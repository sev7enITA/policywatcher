/**
 * PolicyWatcher - AI Chat API
 *
 * @route POST /api/chat
 *
 * Accepts a natural-language question and an optional list of policy IDs,
 * retrieves the relevant policy texts from the database, and forwards them
 * as context to Google Gemini to produce an AI-generated answer.
 *
 * @auth    None (public endpoint).
 * @rateLimit 10 requests / minute per IP (AI inference is expensive).
 *
 * @body {{ question: string; policyIds?: string[] }}
 * @returns {{ answer: string }}
 */
import { DOCUMENT_TYPES, isDocumentTypes, documentTypeWhere } from '@/lib/documentScope';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { answerPolicyQuestion } from '@/lib/gemini';
import { rateLimit } from '@/lib/rateLimit';
import type { Prisma } from '@prisma/client';
import { publicPolicyWhere } from '@/lib/publicDataGate';
import { createErrorReference, getErrorMessage } from '@/lib/safeErrors';
import { readBoundedJsonObject } from '@/lib/requestBody';

type PolicyWithCompany = Prisma.PolicyGetPayload<{
  select: { name: true; currentText: true; company: { select: { name: true } } };
}>;

export const CHAT_MAX_BODY_BYTES = 16 * 1024;
export const CHAT_MAX_QUESTION_CHARS = 1_000;
export const CHAT_MAX_POLICY_IDS = 12;
export const CHAT_MAX_CONTEXT_POLICIES = 20;
const MAX_POLICY_ID_CHARS = 128;

/**
 * Handles a POST request to answer a user question about tracked policies.
 *
 * @param request - The incoming Next.js request containing `question` and optional `policyIds`.
 * @returns A JSON response with the AI-generated `answer`, or an error object.
 */
export async function POST(request: NextRequest) {
  // Rate limit: AI is expensive. 10 questions/min per IP.
  const limited = rateLimit(request, { intervalMs: 60_000, max: 10, name: 'chat' });
  if (limited) return limited;

  try {
    const parsedBody = await readBoundedJsonObject(request, CHAT_MAX_BODY_BYTES);
    if (!parsedBody.ok) {
      return NextResponse.json(
        { error: parsedBody.reason === 'body_too_large' ? 'Payload too large.' : 'Invalid JSON body.' },
        { status: parsedBody.reason === 'body_too_large' ? 413 : 400 },
      );
    }

    const body = parsedBody.value;
    if (body.documentTypes !== undefined && !isDocumentTypes(body.documentTypes)) return NextResponse.json({ error: 'Invalid document types.' }, { status: 400 });
    const types = body.documentTypes === undefined ? [...DOCUMENT_TYPES] : body.documentTypes as Array<typeof DOCUMENT_TYPES[number]>;
    if (body.companyIds !== undefined && (!Array.isArray(body.companyIds) || body.companyIds.length > 100 || !body.companyIds.every(id => typeof id === 'string' && id.length <= 128))) return NextResponse.json({ error: 'Invalid company scope.' }, { status: 400 });
    const scopeWhere = { ...documentTypeWhere(types), ...(Array.isArray(body.companyIds) ? { companyId: { in: body.companyIds as string[] } } : {}) };

    const question = typeof body.question === 'string' ? body.question.trim() : '';
    const rawPolicyIds = Array.isArray(body.policyIds) ? body.policyIds : [];
    if (rawPolicyIds.length > CHAT_MAX_POLICY_IDS) {
      return NextResponse.json(
        { error: `At most ${CHAT_MAX_POLICY_IDS} policy IDs are allowed.` },
        { status: 400 },
      );
    }
    const policyIds = Array.from(new Set(rawPolicyIds
      .filter((id: unknown): id is string => typeof id === 'string')
      .map((id) => id.trim())
      .filter((id) => id.length > 0 && id.length <= MAX_POLICY_ID_CHARS)));

    if (!question) {
      return NextResponse.json(
        { error: "The 'question' parameter is required." },
        { status: 400 }
      );
    }
    if (question.length > CHAT_MAX_QUESTION_CHARS) {
      return NextResponse.json(
        { error: `Question must not exceed ${CHAT_MAX_QUESTION_CHARS} characters.` },
        { status: 400 },
      );
    }

    // Fetch relevant policies context
    let policiesToQuery: PolicyWithCompany[] = [];

    if (policyIds && policyIds.length > 0) {
      policiesToQuery = await db.policy.findMany({
        where: publicPolicyWhere({
          ...scopeWhere,
          id: { in: policyIds },
        }),
        select: {
          name: true,
          currentText: true,
          company: { select: { name: true } },
        },
        take: CHAT_MAX_POLICY_IDS,
      });
    } else {
      // Fetch latest policies for all companies
      policiesToQuery = await db.policy.findMany({
        where: publicPolicyWhere(scopeWhere),
        select: {
          name: true,
          currentText: true,
          company: { select: { name: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: CHAT_MAX_CONTEXT_POLICIES,
      });
    }

    const availablePoliciesCount = await db.policy.count({ where: publicPolicyWhere({ ...scopeWhere, ...(policyIds.length ? { id: { in: policyIds } } : {}) }) });
    const contextPolicies = policiesToQuery.map((p) => ({
      company: p.company.name,
      policyName: p.name,
      text: p.currentText,
    }));

    if (contextPolicies.length === 0) {
      return NextResponse.json({
        answer: 'Nessun contesto policy disponibile nella selezione per rispondere alla domanda.',
        contextPoliciesCount: 0, availablePoliciesCount: 0,
      });
    }

    const answer = await answerPolicyQuestion(question, contextPolicies);

    return NextResponse.json({ answer, contextPoliciesCount: contextPolicies.length, availablePoliciesCount, documentTypes: types });
  } catch (error) {
    const errorReference = createErrorReference('chat');
    console.error(`[Chat] Error reference ${errorReference}: ${getErrorMessage(error)}`);
    return NextResponse.json(
      {
        error: 'Unable to process the question at this time.',
        reference: errorReference,
      },
      { status: 500 }
    );
  }
}
