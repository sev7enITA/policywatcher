import Link from 'next/link';
import Footer from '@/components/Footer';
import PublicHeader from '@/components/PublicHeader';
import styles from '../../knowledge.module.css';

export default function CompanyKnowledgeNotFound() {
  return <><PublicHeader current="knowledge" /><main className={styles.page}><div className={styles.shell}><section className={styles.section}><div className={styles.notice} role="status"><div><h1>Public company record not found</h1><p>The company does not exist or does not pass the public-evidence gate. Withheld records are not exposed.</p><Link href="/knowledge">Return to the knowledge index</Link></div></div></section></div></main><Footer lang="en" variant="compact" /></>;
}
