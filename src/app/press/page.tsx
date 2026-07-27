import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  ExternalLink,
  FileSearch,
  GitBranch,
  MessageSquareText,
  Newspaper,
  Radio,
  ShieldCheck,
  Users,
} from 'lucide-react';
import styles from './press.module.css';
import Footer from '@/components/Footer';
import PublicHeader from '@/components/PublicHeader';

export const metadata: Metadata = {
  title: 'Who Is Talking About PolicyWatcher',
  description:
    'A curated public wall of articles, LinkedIn discussions, and community references about PolicyWatcher.',
};

const repositoryUrl = 'https://github.com/sev7enITA/policywatcher';

const mentions = [
  {
    source: "Tom's Hardware Italia",
    type: 'Article',
    date: 'July 2026',
    title: 'PolicyWatcher: osservare le policy delle Big Tech come infrastruttura civica',
    summary:
      'A long-form article presenting PolicyWatcher as a civic-tech infrastructure for observing how major technology platforms change public-facing policy texts.',
    signal: 'Editorial coverage',
    href: 'https://www.tomshw.it/business/policywatcher-osservare-le-policy-delle-big-tech-come-infrastruttura-civica',
    image: '/press/toms-hardware-policywatcher.jpg',
    imageAlt: "Tom's Hardware Italia PolicyWatcher article preview",
    tone: 'blue',
    feature: true,
  },
  {
    source: 'Massimo Chiriatti',
    type: 'LinkedIn post',
    date: 'July 2026',
    title: 'Public post sharing the PolicyWatcher GitHub repository',
    summary:
      'A public LinkedIn contribution pointing to the open-source repository and bringing PolicyWatcher into an AI and digital-policy professional conversation.',
    signal: 'AI community attention',
    href: 'https://www.linkedin.com/posts/massimochiriatti_github-sev7enitapolicywatcher-ai-powered-activity-7480524272717914113-drNk?utm_source=share&utm_medium=member_desktop&rcm=ACoAAAGsz9cBmSFfvtGARb5SXzJawRC63pNXQx0',
    image: '/press/massimo-chiriatti-linkedin.png',
    imageAlt: 'Massimo Chiriatti LinkedIn post preview',
    tone: 'teal',
  },
  {
    source: 'Michele Iaselli',
    type: 'LinkedIn post',
    date: 'July 2026',
    title: 'PolicyWatcher discussed in an AI governance and policy context',
    summary:
      'A public LinkedIn contribution connecting PolicyWatcher to policy monitoring, governance, and the need to make platform changes easier to inspect.',
    signal: 'Governance community attention',
    href: 'https://www.linkedin.com/posts/micheleiaselli_policywatcher-aigovernance-policy-activity-7476170330156273665-oz42?utm_source=share&utm_medium=member_desktop&rcm=ACoAAAGsz9cBmSFfvtGARb5SXzJawRC63pNXQx0',
    image: '/press/michele-iaselli-linkedin.jpg',
    imageAlt: 'Michele Iaselli LinkedIn post preview',
    tone: 'amber',
  },
  {
    source: 'Giovanna Panucci / Gladiatori Digitali',
    type: 'Newsletter article',
    date: 'July 2026',
    title: 'Come monitorare policy, privacy e AI Act dei principali tool di intelligenza artificiale',
    summary:
      'A newsletter article testing PolicyWatcher as an open-source tool for monitoring policy, terms of service, privacy notices, and AI Act-relevant changes across major AI services.',
    signal: 'Privacy and AI Act community attention',
    href: 'https://avvocatogiovannapanucci.substack.com/p/come-monitorare-policy-privacy-e',
    image: '/press/gladiatori-digitali-panucci.png',
    imageAlt: 'Gladiatori Digitali PolicyWatcher article preview',
    tone: 'rust',
  },
];

const channels = [
  {
    label: 'Editorial articles',
    value: '2',
    note: 'Long-form external coverage currently tracked.',
  },
  {
    label: 'Public community posts',
    value: '2',
    note: 'LinkedIn discussions and professional-community references.',
  },
  {
    label: 'Repository available',
    value: 'OSS',
    note: 'Public codebase, docs, security files and release notes.',
  },
];

const principles = [
  {
    title: 'Collected, not certified',
    body:
      'This page records public references and coverage. It does not treat any article or post as a product certification, audit approval, or legal validation.',
    icon: ShieldCheck,
  },
  {
    title: 'Source-first context',
    body:
      'Every mention links to the original public source so readers can inspect the context directly, including wording, author, platform, and publication surface.',
    icon: FileSearch,
  },
  {
    title: 'Community memory',
    body:
      'As PolicyWatcher evolves, this page becomes a visible chronology of how the project is being discussed by journalists, researchers, legal experts, and builders.',
    icon: Users,
  },
];

function PressSignal() {
  return (
    <svg viewBox="0 0 720 520" className={styles.signalGraphic} aria-hidden="true">
      <defs>
        <linearGradient id="pressLine" x1="0" x2="1">
          <stop stopColor="#18b8a6" />
          <stop offset="0.48" stopColor="#5067f6" />
          <stop offset="1" stopColor="#d98914" />
        </linearGradient>
      </defs>
      <path className={styles.signalGrid} d="M74 72h572M74 168h572M74 264h572M74 360h572M74 456h572M146 44v436M286 44v436M426 44v436M566 44v436" />
      <path className={styles.signalLineSoft} d="M102 352c70-118 134-94 204-150 80-64 151-79 254-12" />
      <path className={styles.signalLine} d="M96 398c76-18 103-96 180-100 91-5 121 71 202 40 72-27 93-114 166-142" />
      <g className={styles.signalCardA}>
        <rect x="96" y="296" width="136" height="86" rx="7" />
        <path d="M116 322h76M116 344h96M116 362h58" />
      </g>
      <g className={styles.signalCardB}>
        <rect x="330" y="168" width="146" height="96" rx="7" />
        <path d="M352 196h86M352 220h102M352 242h62" />
      </g>
      <g className={styles.signalCardC}>
        <rect x="508" y="104" width="118" height="78" rx="7" />
        <path d="M528 130h58M528 152h78" />
      </g>
      <circle className={styles.signalNodeTeal} cx="162" cy="334" r="14" />
      <circle className={styles.signalNodeBlue} cx="404" cy="216" r="14" />
      <circle className={styles.signalNodeAmber} cx="566" cy="142" r="14" />
    </svg>
  );
}

export default function PressPage() {
  const featured = mentions.find((mention) => mention.feature) ?? mentions[0];
  const communityMentions = mentions.filter((mention) => !mention.feature);

  return (
    <>
      <PublicHeader current="press" />
      <main className={styles.page}>
      <nav className={styles.nav} aria-label="Press page navigation">
        <Link href="/" className={styles.brand}>
          <Image src="/logo-mark.png" alt="" width={34} height={34} className={styles.brandMark} priority />
          <span>PolicyWatcher</span>
        </Link>
        <div className={styles.navLinks}>
          <a href="#mentions">Mentions</a>
          <a href="#principles">Boundary</a>
          <Link href="/showcase">Showcase</Link>
          <Link href="/trust">Trust QA</Link>
          <a href={repositoryUrl} target="_blank" rel="noopener noreferrer">GitHub</a>
        </div>
      </nav>

      <header className={styles.hero}>
        <section className={styles.heroCopy}>
          <Link href="/" className={styles.backLink}>
            <ArrowLeft size={16} />
            Back to platform
          </Link>
          <span className={styles.eyebrow}>External coverage and community signals</span>
          <h1>Who is talking about PolicyWatcher</h1>
          <p>
            A public wall of articles, professional posts, and community references
            that are helping frame PolicyWatcher as an open-source civic-tech project
            for inspecting policy changes from major digital platforms.
          </p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryAction} href="/press-kit">
              Open the press kit
              <ArrowUpRight size={17} />
            </Link>
            <a className={styles.primaryAction} href="#mentions">
              Read the coverage wall
              <ArrowUpRight size={17} />
            </a>
            <a className={styles.secondaryAction} href="mailto:info@policywatcher.online?subject=PolicyWatcher%20mention">
              Submit a mention
            </a>
          </div>
        </section>

        <aside className={styles.heroPanel} aria-label="Press signal map">
          <div className={styles.panelTop}>
            <span>mentions.watch</span>
            <strong>public references</strong>
          </div>
          <PressSignal />
          <div className={styles.channelGrid}>
            {channels.map((channel) => (
              <article key={channel.label}>
                <strong>{channel.value}</strong>
                <span>{channel.label}</span>
              </article>
            ))}
          </div>
        </aside>
      </header>

      <section className={styles.featured} aria-label="Featured article">
        <div className={styles.sectionIntro}>
          <span className={styles.sectionLabel}>Featured coverage</span>
          <h2>PolicyWatcher enters the public conversation</h2>
        </div>
        <article className={styles.featuredCard}>
          {featured.image && (
            <div className={styles.featuredVisual}>
              <Image src={featured.image} alt={featured.imageAlt} width={420} height={236} />
            </div>
          )}
          <div className={styles.featuredMeta}>
            <span>{featured.type}</span>
            <span>{featured.date}</span>
          </div>
          <div>
            <strong>{featured.source}</strong>
            <h3>{featured.title}</h3>
            <p>{featured.summary}</p>
          </div>
          <a href={featured.href} target="_blank" rel="noopener noreferrer">
            Open original source
            <ExternalLink size={16} />
          </a>
        </article>
      </section>

      <section className={styles.mentionsSection} id="mentions">
        <div className={styles.sectionHead}>
          <div>
            <span className={styles.sectionLabel}>Coverage wall</span>
            <h2>Articles, posts, and professional discussion</h2>
          </div>
          <p>
            The wall starts with the first public references and is designed to grow:
            press articles, LinkedIn posts, talks, newsletters, podcasts, academic
            notes, and public GitHub discussions can be added here as the project evolves.
          </p>
        </div>

        <div className={styles.mentionGrid}>
          {mentions.map((mention, index) => (
            <article className={styles.mentionCard} data-tone={mention.tone} key={mention.href}>
              {mention.image && (
                <div className={styles.mentionVisual}>
                  <Image src={mention.image} alt={mention.imageAlt} width={520} height={292} />
                </div>
              )}
              <div className={styles.mentionNumber}>{String(index + 1).padStart(2, '0')}</div>
              <div className={styles.mentionMeta}>
                <span>{mention.type}</span>
                <span>{mention.date}</span>
              </div>
              <h3>{mention.source}</h3>
              <h4>{mention.title}</h4>
              <p>{mention.summary}</p>
              <div className={styles.signalTag}>
                <Radio size={15} />
                {mention.signal}
              </div>
              <a href={mention.href} target="_blank" rel="noopener noreferrer">
                Visit source
                <ArrowUpRight size={15} />
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.communityBand} aria-label="Community mentions">
        <div>
          <span className={styles.sectionLabel}>Professional conversation</span>
          <h2>Why these early references matter</h2>
        </div>
        <div className={styles.communityStack}>
          {communityMentions.map((mention) => (
            <article key={mention.href}>
              <MessageSquareText size={20} />
              <strong>{mention.source}</strong>
              <p>{mention.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.principles} id="principles">
        <div className={styles.sectionHead}>
          <div>
            <span className={styles.sectionLabel}>Publication boundary</span>
            <h2>How this page should be read</h2>
          </div>
          <p>
            This is a public record of attention around the project. It is useful
            social proof, but it must remain separate from technical assurance,
            source quality, legal interpretation, and security testing.
          </p>
        </div>
        <div className={styles.principleGrid}>
          {principles.map((principle) => {
            const Icon = principle.icon;
            return (
              <article key={principle.title}>
                <Icon size={22} />
                <h3>{principle.title}</h3>
                <p>{principle.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.pressKit}>
        <div>
          <span className={styles.sectionLabel}>For journalists and contributors</span>
          <h2>Useful starting points</h2>
          <p>
            If you are writing about PolicyWatcher, these pages provide a safer
            foundation than screenshots alone: platform overview, methodology,
            trust evidence, roadmap, and source repository.
          </p>
        </div>
        <div className={styles.kitLinks}>
          <Link href="/showcase">
            <Newspaper size={18} />
            Showcase
          </Link>
          <Link href="/trust">
            <ShieldCheck size={18} />
            Trust & Quality
          </Link>
          <Link href="/methodology/confidence">
            <BookOpen size={18} />
            Methodology
          </Link>
          <Link href="/roadmap">
            <GitBranch size={18} />
            Roadmap
          </Link>
          <a href={repositoryUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink size={18} />
            GitHub repository
          </a>
        </div>
      </section>

      <section className={styles.footer} aria-label="Press wall boundary and local links">
        <span>PolicyWatcher press wall</span>
        <span>External mentions are public references, not certifications or endorsements.</span>
        <div>
          <Link href="/">Platform</Link>
          <Link href="/showcase">Showcase</Link>
          <Link href="/trust">Trust</Link>
        </div>
      </section>
      <Footer lang="en" />
      </main>
    </>
  );
}
