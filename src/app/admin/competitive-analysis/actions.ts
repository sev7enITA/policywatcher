'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { COOKIE_NAME, verifySessionToken } from '@/lib/adminAuth';

const ROUTE = '/admin/competitive-analysis';

export async function recordCompetitiveSnapshot(): Promise<never> {
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(COOKIE_NAME)?.value);

  if (!session.valid) redirect('/admin/login');
  if (session.role !== 'admin') redirect(`${ROUTE}?snapshot=forbidden`);

  const { loadCompetitiveAnalysis, persistCompetitiveSnapshot } = await import('@/lib/competitiveAnalysisServer');
  const analysis = await loadCompetitiveAnalysis();
  if (!analysis.currentSnapshot) redirect(`${ROUTE}?snapshot=unavailable`);

  let outcome: 'created' | 'unchanged';
  try {
    outcome = await persistCompetitiveSnapshot({
      snapshot: analysis.currentSnapshot,
      actorRole: 'admin',
    });
  } catch {
    redirect(`${ROUTE}?snapshot=error`);
  }

  revalidatePath(ROUTE);
  redirect(`${ROUTE}?snapshot=${outcome}`);
}
