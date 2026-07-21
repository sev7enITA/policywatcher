import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rateLimit';
import { publicChangeWhere, publicPolicyWhere } from '@/lib/publicDataGate';
import {
  buildInquiryDedupeKey,
  createInquiryPublicToken,
  matchInquiryCompany,
  parsePolicyInquiry,
  POLICY_INQUIRY_MAX_INPUT_BYTES,
} from '@/lib/policyInquiry';

const MAX_BODY_BYTES = POLICY_INQUIRY_MAX_INPUT_BYTES + 4096;
const ACTIVE_INQUIRY_STATUSES = ['Proposed', 'Approved', 'Onboarding'] as const;

function safeString(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function inquiryError(lang: 'it' | 'en', key: 'invalid' | 'large' | 'generic') {
  const messages = {
    it: {
      invalid: 'Inserisci il testo della notifica, il nome dell’azienda o un URL ufficiale valido.',
      large: 'Il messaggio supera il limite di 20 KB. Incolla solo intestazione e contenuto essenziale.',
      generic: 'Non è stato possibile completare la verifica. Riprova più tardi.',
    },
    en: {
      invalid: 'Enter the notification text, a company name, or a valid official URL.',
      large: 'The message exceeds the 20 KB limit. Paste only the headers and essential content.',
      generic: 'The verification could not be completed. Please try again later.',
    },
  } as const;
  return messages[lang][key];
}

async function readBoundedBody(request: NextRequest): Promise<Record<string, unknown> | null> {
  const declared = Number(request.headers.get('content-length') || '0');
  if (declared > MAX_BODY_BYTES) throw new Error('BODY_TOO_LARGE');
  const text = await request.text();
  if (Buffer.byteLength(text, 'utf8') > MAX_BODY_BYTES) throw new Error('BODY_TOO_LARGE');
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, { intervalMs: 60 * 60 * 1000, max: 5, name: 'policy-inquiry' });
  if (limited) return limited;

  let lang: 'it' | 'en' = 'it';
  try {
    const body = await readBoundedBody(request);
    if (!body) return NextResponse.json({ error: inquiryError(lang, 'invalid') }, { status: 400 });
    lang = body.lang === 'en' ? 'en' : 'it';

    // Honeypot submissions receive an intentionally bland success without storage.
    if (safeString(body.honeypot, 200)) {
      return NextResponse.json({ state: 'queued', reference: 'received' });
    }

    const input = typeof body.input === 'string' ? body.input : '';
    const companyName = safeString(body.companyName, 160);
    const websiteUrl = safeString(body.websiteUrl, 2000);
    const combinedInput = input || companyName || websiteUrl;
    if (!combinedInput) {
      return NextResponse.json({ error: inquiryError(lang, 'invalid') }, { status: 400 });
    }

    const parsed = parsePolicyInquiry(combinedInput, companyName || undefined, websiteUrl || undefined);
    const companies = await db.company.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        website: true,
        policies: {
          where: publicPolicyWhere(),
          select: { id: true, url: true, type: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    const match = matchInquiryCompany(parsed, companies);

    if (match.state === 'ambiguous') {
      return NextResponse.json({
        state: 'ambiguous',
        candidates: match.candidates.map(({ id, name, slug }) => ({ id, name, slug })),
      });
    }

    let matchedCompanyId: string | null = null;
    let matchedPolicyId: string | null = null;
    if (match.state === 'matched') {
      matchedCompanyId = match.company.id;
      matchedPolicyId = match.matchedPolicyId;
      const dateFloor = parsed.noticeDate
        ? new Date(parsed.noticeDate.getTime() - 365 * 24 * 60 * 60 * 1000)
        : null;
      const baseWhere: Record<string, unknown> = {
        policy: {
          companyId: matchedCompanyId,
          ...(parsed.policyTypes.length ? { type: { in: parsed.policyTypes } } : {}),
          ...(matchedPolicyId ? { id: matchedPolicyId } : {}),
        },
        ...(dateFloor ? { createdAt: { gte: dateFloor } } : {}),
      };
      const changes = await db.policyChange.findMany({
        where: publicChangeWhere(baseWhere) as never,
        select: {
          id: true,
          createdAt: true,
          overallRisk: true,
          overallScore: true,
          tldrEn: true,
          tldrIt: true,
          aiSummaryEn: true,
          aiSummaryIt: true,
          keyPointsJson: true,
          policy: { select: { id: true, name: true, type: true, url: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 3,
      });

      if (changes.length > 0) {
        return NextResponse.json({
          state: 'matched',
          relationship: match.reason === 'exact_policy_url' ? 'direct_policy_source' : 'related_policy_type',
          company: { id: match.company.id, name: match.company.name, slug: match.company.slug },
          emailClaim: {
            subject: parsed.noticeSubject,
            noticeDate: parsed.noticeDate,
            effectiveDate: parsed.effectiveDate,
            policyTypes: parsed.policyTypes,
          },
          changes,
        });
      }
    }

    const kind = matchedCompanyId ? 'verify_existing' : 'unknown_company';
    const dedupeKey = buildInquiryDedupeKey(parsed, matchedCompanyId);
    const existing = await db.policyInquiry.findFirst({
      where: { dedupeKey, status: { in: [...ACTIVE_INQUIRY_STATUSES] } },
      orderBy: { createdAt: 'desc' },
    });
    const inquiry = existing || await db.policyInquiry.create({
      data: {
        publicToken: createInquiryPublicToken(),
        fingerprint: parsed.fingerprint,
        dedupeKey,
        status: 'Proposed',
        kind,
        companyHint: parsed.companyHint,
        normalizedDomain: parsed.normalizedDomain,
        sourceUrl: parsed.sourceUrl,
        noticeSubject: parsed.noticeSubject,
        noticeDate: parsed.noticeDate,
        effectiveDate: parsed.effectiveDate,
        policyTypesJson: JSON.stringify(parsed.policyTypes),
        redactedExcerpt: parsed.redactedExcerpt,
        matchedCompanyId,
        matchedPolicyId,
      },
    });

    if (matchedCompanyId) {
      const company = companies.find((item) => item.id === matchedCompanyId)!;
      return NextResponse.json({
        state: 'monitored_no_verified_change',
        reference: inquiry.publicToken,
        company: { id: company.id, name: company.name, slug: company.slug },
        monitoredSources: company.policies.map((policy) => ({ id: policy.id, url: policy.url, type: policy.type })),
        baselineNotice: lang === 'it'
          ? 'Una baseline iniziale non prova una modifica storica. La richiesta resterà in revisione finché non esiste un confronto pubblico verificato.'
          : 'An initial baseline does not prove a historical change. The request remains under review until a verified public comparison exists.',
      });
    }

    return NextResponse.json({
      state: 'queued',
      reference: inquiry.publicToken,
      companyHint: parsed.companyHint,
      baselineNotice: lang === 'it'
        ? 'Se la fonte verrà approvata, la prima scansione creerà una baseline: non dimostrerà da sola cosa è cambiato in passato.'
        : 'If the source is approved, the first scan creates a baseline; it does not by itself prove what changed in the past.',
    }, { status: existing ? 200 : 202 });
  } catch (error) {
    if (error instanceof Error && ['BODY_TOO_LARGE', 'INPUT_TOO_LARGE'].includes(error.message)) {
      return NextResponse.json({ error: inquiryError(lang, 'large') }, { status: 413 });
    }
    if (error instanceof Error && ['EMPTY_INPUT', 'INVALID_URL'].includes(error.message)) {
      return NextResponse.json({ error: inquiryError(lang, 'invalid') }, { status: 400 });
    }
    console.error('[Policy inquiries] Safe public failure:', error);
    return NextResponse.json({ error: inquiryError(lang, 'generic') }, { status: 500 });
  }
}
