import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  ExternalLink,
  GitFork,
  Mail,
  Newspaper,
  Route,
  ShieldCheck,
} from 'lucide-react';
import Footer from '@/components/Footer';
import PublicHeader from '@/components/PublicHeader';
import { POLICYWATCHER_BUILD_LABEL } from '@/lib/release';
import styles from './about.module.css';

export const metadata: Metadata = {
  title: 'About PolicyWatcher | Fabrizio Degni',
  description:
    'Project background, authorship, contact information, and public resources for PolicyWatcher.',
};

const resources = [
  {
    title: 'Confidence Methodology',
    body: 'How retrieval paths, source status, public-evidence gates, and AI-assisted interpretation are described.',
    href: '/methodology/confidence',
    icon: BookOpen,
  },
  {
    title: 'Trust & Quality',
    body: 'Operational quality evidence, security signals, dataset QA context, and release documentation.',
    href: '/trust',
    icon: ShieldCheck,
  },
  {
    title: 'Community Roadmap',
    body: 'The public view of active work, future directions, and community-priority signals.',
    href: '/roadmap',
    icon: Route,
  },
  {
    title: 'Press Kit',
    body: 'Product facts, supporting links, limitations, citation guidance and owned media downloads.',
    href: '/press-kit',
    icon: Newspaper,
  },
];

export default function AboutPage() {
  return (
    <>
      <PublicHeader current="about" />
      <main className={styles.page}>
      <nav className={styles.nav} aria-label="About page navigation">
        <Link href="/" className={styles.brand}>
          <Image src="/logo-mark.png" alt="" width={34} height={34} className={styles.brandMark} priority />
          <span>PolicyWatcher</span>
        </Link>
        <div className={styles.navLinks}>
          <Link href="/atlas">Site Atlas</Link>
          <Link href="/observatory">Observatory</Link>
          <Link href="/press">Press Wall</Link>
          <Link href="/trust">Trust &amp; Quality</Link>
        </div>
      </nav>

      <header className={styles.hero}>
        <section className={styles.intro}>
          <Link href="/" className={styles.backLink}>
            <ArrowLeft size={16} />
            Back to the platform
          </Link>
          <span className={styles.eyebrow}>Project authorship and public context · {POLICYWATCHER_BUILD_LABEL}</span>
          <h1>About PolicyWatcher</h1>
          <p className={styles.lead}>
            PolicyWatcher is a civic-tech project created and maintained by Fabrizio Degni. Its repository is public under CC BY 4.0.
            It helps people inspect how configured public policy sources change over time, with the
            retrieval context and data-quality status kept visible alongside the analysis.
          </p>
          <div className={styles.actions}>
            <a
              href="https://github.com/sev7enITA/policywatcher"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.primaryAction}
            >
              <GitFork size={17} />
              Open the repository
              <ArrowUpRight size={15} />
            </a>
            <Link href="/showcase" className={styles.secondaryAction}>
              Explore the platform
              <ArrowUpRight size={15} />
            </Link>
          </div>
        </section>

        <aside className={styles.authorPanel} aria-label="Project author">
          <Image
            src="/fabrizio-degni.png"
            alt="Fabrizio Degni"
            width={200}
            height={200}
            className={styles.portrait}
            priority
          />
          <div>
            <span className={styles.panelLabel}>Created and maintained by</span>
            <h2>Fabrizio Degni</h2>
            <p>
              Independent builder working on public-interest tools for inspecting and discussing
              digital-policy changes with links to source material.
            </p>
          </div>
          <div className={styles.contactLinks}>
            <a href="mailto:info@policywatcher.online">
              <Mail size={16} />
              Contact PolicyWatcher
            </a>
            <a href="https://linkedin.com/in/fabriziodegni" target="_blank" rel="noopener noreferrer">
              <ExternalLink size={16} />
              LinkedIn
            </a>
          </div>
        </aside>
      </header>

      <section className={styles.contextSection} aria-labelledby="project-direction">
        <div className={styles.sectionHeading}>
          <span>Project direction</span>
          <h2 id="project-direction">Display each public policy text with its recorded retrieval context.</h2>
        </div>
        <div className={styles.contextGrid}>
          <article>
            <h3>Public-source monitoring</h3>
            <p>
              The platform works from configured public URLs and records the outcome of each
              retrieval path. When an anomaly prevents a source from meeting the public-evidence
              gate, that source is suspended from public analysis until it can be reviewed.
            </p>
          </article>
          <article>
            <h3>Evidence before interpretation</h3>
            <p>
              Change views, comparisons, and summaries are designed to retain source status,
              timestamps, provenance, and known limits rather than separating an interpretation
              from the evidence that supports it. Dashboard filters and CSV exports use the same
              evidence-gated view model so the downloadable result describes the visible scope.
            </p>
          </article>
          <article>
            <h3>Open development</h3>
            <p>
              PolicyWatcher is developed in public. Its repository, security reporting path,
              methodology, release notes, and community roadmap remain available for inspection.
            </p>
          </article>
        </div>
      </section>

      <section className={styles.resourceSection} aria-labelledby="project-resources">
        <div className={styles.sectionHeading}>
          <span>Where to continue</span>
          <h2 id="project-resources">Project documents and public reference points.</h2>
        </div>
        <div className={styles.resourceGrid}>
          {resources.map((resource) => {
            const Icon = resource.icon;
            return (
              <Link key={resource.title} href={resource.href} className={styles.resourceCard}>
                <span className={styles.resourceIcon}><Icon size={19} /></span>
                <span>
                  <strong>{resource.title}</strong>
                  <small>{resource.body}</small>
                </span>
                <ArrowUpRight size={17} aria-hidden="true" />
              </Link>
            );
          })}
        </div>
      </section>

      <section className={styles.openSourceBand} aria-label="Public repository resources">
        <div>
          <span>Public repository</span>
          <h2>Inspect the project where it is built.</h2>
        </div>
        <div className={styles.openSourceLinks}>
          <a href="https://github.com/sev7enITA/policywatcher" target="_blank" rel="noopener noreferrer">
            <GitFork size={17} />
            GitHub repository
            <ArrowUpRight size={15} />
          </a>
          <a href="https://www.paloframework.org/" target="_blank" rel="noopener noreferrer">
            PALO Framework
            <ArrowUpRight size={15} />
          </a>
        </div>
      </section>

      <Footer lang="en" />
      </main>
    </>
  );
}
