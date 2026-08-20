import type { Metadata } from 'next';
import { unstable_noStore as noStore } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { INVESTOR_SESSION_COOKIE } from '@/lib/investorAccess';
import { resolveInvestorSessionState } from '@/lib/investorAccessService';
import { parseInternalStudyScenario } from '@/lib/internalExecutiveStudyTypes';
import ExecutiveStudyDocument from '@/app/admin/executive-study/ExecutiveStudyDocument';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export const metadata: Metadata = {
  title: 'Executive Study | PolicyWatcher Investor Data Room',
  referrer: 'no-referrer',
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nocache: true,
    googleBot: { index: false, follow: false, noarchive: true, noimageindex: true },
  },
};

export default async function InvestorExecutiveStudyPage({
  searchParams,
}: {
  searchParams: Promise<{ scenario?: string | string[] }>;
}) {
  noStore();
  const cookieStore = await cookies();
  const resolution = await resolveInvestorSessionState(cookieStore.get(INVESTOR_SESSION_COOKIE)?.value);
  if (!resolution.ok) {
    const outcome = resolution.reason === 'revoked' || resolution.reason === 'expired'
      ? resolution.reason
      : 'session-ended';
    redirect(`/investor/access?outcome=${outcome}`);
  }
  const { grant } = resolution;

  // The private payload is imported only after the signed cookie and current
  // database grant state (expiry and revocation included) have both passed.
  const { loadInternalExecutiveStudy } = await import('@/lib/internalExecutiveStudyServer');
  const study = await loadInternalExecutiveStudy();
  const params = await searchParams;
  const rawScenario = Array.isArray(params.scenario) ? params.scenario[0] : params.scenario;
  return (
    <ExecutiveStudyDocument
      study={study}
      initialScenario={parseInternalStudyScenario(rawScenario)}
      access={{ mode: 'investor', recipientLabel: grant.recipientLabel, expiresAt: grant.expiresAt }}
    />
  );
}
