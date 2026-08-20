import type { Metadata } from 'next';
import { unstable_noStore as noStore } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { COOKIE_NAME, verifySessionToken } from '@/lib/adminAuth';
import { parseInternalStudyScenario } from '@/lib/internalExecutiveStudyTypes';
import ExecutiveStudyDocument from './ExecutiveStudyDocument';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export const metadata: Metadata = {
  title: 'Internal executive study | PolicyWatcher Admin',
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noarchive: true,
      noimageindex: true,
    },
  },
};

export default async function ExecutiveStudyPage({
  searchParams,
}: {
  searchParams: Promise<{ scenario?: string | string[] }>;
}) {
  noStore();

  // This check deliberately lives in the page and runs before the private loader
  // is imported. An invalid or missing session therefore cannot serialize study data.
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(COOKIE_NAME)?.value);
  if (!session.valid || (session.role !== 'admin' && session.role !== 'auditor')) {
    redirect('/admin/login');
  }

  const { loadInternalExecutiveStudy } = await import('@/lib/internalExecutiveStudyServer');
  const study = await loadInternalExecutiveStudy();
  const params = await searchParams;
  const rawScenario = Array.isArray(params.scenario) ? params.scenario[0] : params.scenario;
  const scenario = parseInternalStudyScenario(rawScenario);
  return <ExecutiveStudyDocument study={study} initialScenario={scenario} access={{ mode: 'internal', role: session.role }} />;
}
