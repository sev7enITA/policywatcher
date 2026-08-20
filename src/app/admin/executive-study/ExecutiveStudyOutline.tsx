'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './executiveStudy.module.css';

const outline = [
  ['decision-desk', 'Decision'],
  ['market', 'Market'],
  ['strategy', 'Strategy'],
  ['business-model', 'Business model'],
  ['product-governance', 'Product'],
  ['financial-plan', 'Financials'],
  ['validation', 'Validation'],
  ['risks', 'Risks'],
  ['full-study', 'Full study'],
  ['sources', 'Sources'],
] as const;

export default function ExecutiveStudyOutline() {
  const [activeSection, setActiveSection] = useState<(typeof outline)[number][0]>('decision-desk');
  const links = useRef(new Map<string, HTMLAnchorElement>());

  useEffect(() => {
    const sections = outline
      .map(([id]) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section));
    let frame = 0;
    const syncSection = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const marker = window.innerHeight * 0.28;
        const current = sections.reduce((active, section) => (
          section.getBoundingClientRect().top <= marker ? section : active
        ), sections[0]);
        if (current) setActiveSection(current.id as (typeof outline)[number][0]);
      });
    };
    syncSection();
    window.addEventListener('scroll', syncSection, { passive: true });
    window.addEventListener('resize', syncSection);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', syncSection);
      window.removeEventListener('resize', syncSection);
    };
  }, []);

  useEffect(() => {
    const link = links.current.get(activeSection);
    const scroller = link?.parentElement;
    if (!link || !scroller) return;
    const left = link.offsetLeft - (scroller.clientWidth - link.clientWidth) / 2;
    scroller.scrollTo({ left: Math.max(0, left), behavior: 'auto' });
  }, [activeSection]);

  return (
    <nav className={styles.studyNav} aria-label="Executive study sections">
      <span>Study index</span>
      <div>
        {outline.map(([id, label], index) => (
          <a
            key={id}
            ref={(node) => {
              if (node) links.current.set(id, node);
              else links.current.delete(id);
            }}
            href={`#${id}`}
            aria-current={activeSection === id ? 'location' : undefined}
            onClick={() => setActiveSection(id)}
          >
            <b>{String(index + 1).padStart(2, '0')}</b>{label}
          </a>
        ))}
      </div>
    </nav>
  );
}
