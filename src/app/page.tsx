import type { Metadata } from 'next';
import DashboardClient from './DashboardClient';
import HomeKnowledgeSnapshot from '@/components/HomeKnowledgeSnapshot';
import { getPublicKnowledgeHub, POLICYWATCHER_ORIGIN, type PublicKnowledgeHub } from '@/lib/publicKnowledge';
import { POLICYWATCHER_VERSION } from '@/lib/release';
import styles from './HomePage.module.css';

export const metadata: Metadata = {
  title: 'PolicyWatcher - Public Policy Change Monitor',
  description: 'Inspect evidence-gated company policies, verified baselines and published policy changes through a server-rendered public knowledge index and interactive dashboard.',
  alternates: { canonical: `${POLICYWATCHER_ORIGIN}/` },
};

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let knowledge: PublicKnowledgeHub | null = null;
  try {
    knowledge = await getPublicKnowledgeHub();
  } catch (error) {
    console.error('[Home] Public knowledge snapshot temporarily unavailable:', error);
  }

  return (
    <div data-policywatcher-release={POLICYWATCHER_VERSION}>
      <main className={styles.publicKnowledgeMain}>
        <div className={styles.publicKnowledgeShell}>
          <HomeKnowledgeSnapshot data={knowledge} />
        </div>
      </main>
      <DashboardClient />
    </div>
  );
}
