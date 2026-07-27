'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import {
  POLICYWATCHER_BROWSER_EXTENSION_DISPLAY_VERSION,
  POLICYWATCHER_BROWSER_EXTENSION_RELEASE_STATUS,
  POLICYWATCHER_RELEASE_NAME,
  POLICYWATCHER_VERSION,
} from '@/lib/release';
import styles from './ChangelogModal.module.css';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangelogModal({ isOpen, onClose }: ChangelogModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.95, x: "-50%", y: "-45%" }}
            animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
            exit={{ opacity: 0, scale: 0.95, x: "-50%", y: "-45%" }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
              <X size={20} />
            </button>

            <div className={styles.header}>
              <div className={styles.iconContainer}>
                <Sparkles size={24} className={styles.sparkleIcon} />
              </div>
              <h2>System Changelog</h2>
              <p className={styles.subtitle}>Feature implementation status & roadmap</p>
            </div>

            <div className={styles.body}>
              {/* Implemented Section */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  <CheckCircle2 size={16} className={styles.sectionIconActive} />
                  Implemented Features
                </h3>
                <div className={styles.featureList}>
                  <div className={styles.featureItem}>
                    <div className={styles.featureHeader}>
                      <span className={styles.featureName}>{POLICYWATCHER_RELEASE_NAME} (v{POLICYWATCHER_VERSION})</span>
                      <span className={styles.badgeActive}>Current Beta</span>
                    </div>
                    <p className={styles.featureDesc}>
                      PolicyWatcher composes its native dashboard from validated contracts for modules, workspace state, actions, data sources, responsive layout and five governed visualizations. Versioned shareable evidence views encode public filter state in canonical URLs and restore committed context through browser history while stale values fail closed. The Evidence Newsroom supplies bilingual packages, dated claim records, reusable data, release feeds and specialized contact routes. The dashboard now uses one persistent assistant trigger in unified navigation, while labelled access remains available in Workspace Controls and command search. This changes assistant discovery only and does not change generated answers or the chat API. Event counts are not unique people, verified readership, media coverage or confirmed outcomes. Vizro was studied as a pinned knowledge source; no Vizro, Dash, Flask or Python runtime was added.
                    </p>
                  </div>

                  <div className={styles.featureItem}>
                    <div className={styles.featureHeader}>
                      <span className={styles.featureName}>Browser Evidence Companion (v{POLICYWATCHER_BROWSER_EXTENSION_DISPLAY_VERSION})</span>
                      <span className={styles.badgeActive}>Extension Beta</span>
                    </div>
                    <p className={styles.featureDesc}>
                      A Manifest V3 companion lets people inspect an opened policy-update notice only after an explicit gesture. Raw notice text is parsed and discarded inside the active page; users confirm the minimal clues before the service worker asks PolicyWatcher for portfolio-wide public evidence. {POLICYWATCHER_BROWSER_EXTENSION_RELEASE_STATUS.en}.
                    </p>
                  </div>

                  <div className={styles.featureItem}>
                    <div className={styles.featureHeader}>
                      <span className={styles.featureName}>Calm Workspace (v3.7.2)</span>
                      <span className={styles.badgeStable}>Stable</span>
                    </div>
                    <p className={styles.featureDesc}>
                      First-time visitors choose an objective and evidence depth, preview the resulting evidence modules and keep Source QA visible before applying the workspace. The toolbar exposes at most three relevant shortcuts, retains additional commands in More, and provides direct What Changed, Search, Workspace and changelog access. Preferences and completion stay local to the browser.
                    </p>
                  </div>

                  <div className={styles.featureItem}>
                    <div className={styles.featureHeader}>
                      <span className={styles.featureName}>Evidence Intake Reliability (v3.7.1)</span>
                      <span className={styles.badgeStable}>Stable</span>
                    </div>
                    <p className={styles.featureDesc}>
                      Plain-text notices work when copy-and-paste omits hidden links. Users confirm the company, starting policy categories, dates and optional official URL locally; PolicyWatcher then prioritizes that signal while checking the company’s configured public policy portfolio. Conflicts and unavailable database storage produce explicit states without transmitting the raw email.
                    </p>
                  </div>

                  <div className={styles.featureItem}>
                    <div className={styles.featureHeader}>
                      <span className={styles.featureName}>Stability Release (v3.6.5)</span>
                      <span className={styles.badgeStable}>Stable</span>
                    </div>
                    <p className={styles.featureDesc}>
                      Centralized onboarding batch invariants, held-workflow duplicate protection, cancellable orientation evaluation, component-level overflow containment, and single-source release metadata.
                    </p>
                  </div>

                  <div className={styles.featureItem}>
                    <div className={styles.featureHeader}>
                      <span className={styles.featureName}>Audit Reliability Fixes (v3.6.4)</span>
                      <span className={styles.badgeStable}>Stable</span>
                    </div>
                    <p className={styles.featureDesc}>
                      Discovery jobs now persist in the database with atomic run claims, malformed admin requests return controlled validation errors, and onboarding batches reopen correctly when publication evidence fails revalidation. Bulk intake safely reuses proposed candidates and audit-logs rejected-candidate reopening. The landing page no longer listens continuously to motion sensors, and Observatory countdowns compare UTC calendar dates.
                    </p>
                  </div>

                  <div className={styles.featureItem}>
                    <div className={styles.featureHeader}>
                      <span className={styles.featureName}>Guided Evidence Workflows (v3.6.3)</span>
                      <span className={styles.badgeStable}>Stable</span>
                    </div>
                    <p className={styles.featureDesc}>
                      The voted Objective-based Dashboard Composer now guides first-time visitors from intent and evidence depth to a preview assembled from registered dashboard modules, with Source QA pinned. The protected Bulk Source Onboarding console persists proposed source, official review, first private baseline, QA gate, and an explicit publish, hold, or reject decision. Imports, approval, and baseline capture never publish evidence by themselves. This release also retains the source-remediation and suspension explainability improvements for official-but-blocked providers.
                    </p>
                  </div>

                  <div className={styles.featureItem}>
                    <div className={styles.featureHeader}>
                      <span className={styles.featureName}>Adaptive Workspace Foundation (v3.6.1)</span>
                      <span className={styles.badgeStable}>Stable</span>
                    </div>
                    <p className={styles.featureDesc}>
                      This release established the Citizen, GRC / Legal, Research, and Builder intents, Snapshot, Operational, and Forensic evidence depths, local persistence, and roadmap deep links. Version 3.6.3 builds the true first-use module composer on this foundation while preserving the same source-quality safeguards.
                    </p>
                  </div>

                  <div className={styles.featureItem}>
                    <div className={styles.featureHeader}>
                      <span className={styles.featureName}>Audit Operations Layer (v3.5.1)</span>
                      <span className={styles.badgeStable}>Stable</span>
                    </div>
                    <p className={styles.featureDesc}>
                      Maintenance release for confidence and reliability: Dataset QA issues can now be marked reviewed, ignored with reason, or reopened; each decision writes an append-only Review Log event. The scraper adds HTTP/2 handling, optional VPS-rendered fetch, freshness-guarded Wayback/Common Crawl recovery, path/host drift checks, Partial suspension for incomplete retrievals, safer source URL migration with dry-run, and stricter renderer SSRF checks. Public APIs, sitemap, digests, share pages, reports, timeline and benchmarks now require publicEvidence-gated snapshots/changes before exposing analysis. Admin session signing requires a dedicated SESSION_HMAC_SECRET and destructive admin deletes require server-side confirmation.
                    </p>
                  </div>

                  <div className={styles.featureItem}>
                    <div className={styles.featureHeader}>
                      <span className={styles.featureName}>Evidence &amp; Confidence Layer (v3.5.0)</span>
                      <span className={styles.badgeStable}>Stable</span>
                    </div>
                    <p className={styles.featureDesc}>
                      Confidence-focused consolidation with policy data statuses, ingestion metadata, check logs, Dataset QA assurance script, Trust & Quality public page, GitHub Quality Gate, CodeQL, OpenSSF Scorecard, targeted Vitest reliability coverage, Sonar/Codecov readiness, security-header hardening, OpenSSF-ready governance files, and refreshed methodology/how-to wording. These checks are operational evidence, not legal or compliance certification.
                    </p>
                  </div>

                  <div className={styles.featureItem}>
                    <div className={styles.featureHeader}>
                      <span className={styles.featureName}>Public Timeline, Dataset QA Status & Security Hardening (v3.0.0)</span>
                      <span className={styles.badgeDone}>Completed</span>
                    </div>
                    <p className={styles.featureDesc}>
                      Public release with a policy-change timeline, home-page Market Pulse, change permalinks, embeddable change widgets, dynamic OG social cards, sitemap generation, diff rendering, industry-average benchmarking, regional heatmaps, encrypted backup verification, and Dataset QA status. Dataset QA checks source fit, hash integrity, freshness, structured AI JSON, KPI coverage, regional impacts, and subscriber hygiene. Security updates include cron secret handling, sanitized AI assistant rendering, protected subscriber tokens, escaped email templates, SSRF-aware scraper egress checks, backup passphrase requirements, and deployment diagnostics.
                    </p>
                  </div>

                  <div className={styles.featureItem}>
                    <div className={styles.featureHeader}>
                      <span className={styles.featureName}>Admin Dashboard, Wayback Machine & Document Sources (v2.5.0)</span>
                      <span className={styles.badgeActive}>New</span>
                    </div>
                    <p className={styles.featureDesc}>
                      Protected admin dashboard at /admin with two roles: Admin (company and policy operations, cron control) and Auditor (read-only access to selected review views). Features include system metrics, cron manager with concurrency lock, database inspector, KPI audit matrix (16x15), company and policy management, and feature documentation. Controls include HMAC-SHA256 signed HTTP-only cookies, rate-limited login (5/min), constant-time comparison, and intentional delay on failed attempts. A Sources tab lists configured documents per company with Wayback Machine availability links.
                    </p>
                  </div>

                  <div className={styles.featureItem}>
                    <div className={styles.featureHeader}>
                      <span className={styles.featureName}>AI Engine Migration & Public Repository (v2.4.0)</span>
                      <span className={styles.badgeDone}>Completed</span>
                    </div>
                    <p className={styles.featureDesc}>
                      Migrated the AI engine from deprecated Gemini 1.5 Flash to Gemini 2.5 Flash with a Gemini 2.0 Flash-Lite fallback for 503/429 responses. Published the repository on GitHub under CC BY 4.0 with documentation, architecture diagrams, and methodology. Replaced emoji in the onboarding wizard with SVG icons.
                    </p>
                  </div>

                  <div className={styles.featureItem}>
                    <div className={styles.featureHeader}>
                      <span className={styles.featureName}>Interactive Onboarding & How To Guide (v2.3.0)</span>
                      <span className={styles.badgeDone}>Completed</span>
                    </div>
                    <p className={styles.featureDesc}>
                      Interactive user onboarding wizard displaying platform features, limits, disclaimers, and AI live assistant routing. Includes a custom opt-out skip checkbox, session-scoped pop management, and a permanent How To header button.
                    </p>
                  </div>

                  <div className={styles.featureItem}>
                    <div className={styles.featureHeader}>
                      <span className={styles.featureName}>Email Alerts, Digests & Personalization (v2.2.0)</span>
                      <span className={styles.badgeDone}>Completed</span>
                    </div>
                    <p className={styles.featureDesc}>
                      Preference-filtered change alerts and weekly/monthly digests with self-service unsubscribe management.
                    </p>
                  </div>

                  <div className={styles.featureItem}>
                    <div className={styles.featureHeader}>
                      <span className={styles.featureName}>AI Live Assistant & Natural TTS</span>
                      <span className={styles.badgeDone}>Completed</span>
                    </div>
                    <p className={styles.featureDesc}>
                      Conversational chatbot trained on corporate policies using Google Cloud Text-to-Speech API for natural voice interactions.
                    </p>
                  </div>

                  <div className={styles.featureItem}>
                    <div className={styles.featureHeader}>
                      <span className={styles.featureName}>Global Command Palette</span>
                      <span className={styles.badgeDone}>Completed</span>
                    </div>
                    <p className={styles.featureDesc}>
                      Global overlay search (CMD+K / Ctrl+K) allowing quick search, filter, and immediate actions on monitored companies and policies.
                    </p>
                  </div>

                  <div className={styles.featureItem}>
                    <div className={styles.featureHeader}>
                      <span className={styles.featureName}>Side-by-Side Compare (A/B)</span>
                      <span className={styles.badgeDone}>Completed</span>
                    </div>
                    <p className={styles.featureDesc}>
                      Detailed diffing interface displaying additions, deletions, and structural policy revisions with Gemini AI risk analysis.
                    </p>
                  </div>

                  <div className={styles.featureItem}>
                    <div className={styles.featureHeader}>
                      <span className={styles.featureName}>KPI Compliance Matrix</span>
                      <span className={styles.badgeDone}>Completed</span>
                    </div>
                    <p className={styles.featureDesc}>
                      Visual matrix showing how companies perform across standard privacy, AI governance, and ethical indicators.
                    </p>
                  </div>
                </div>
              </div>

              {/* Roadmap Section */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  <Clock size={16} className={styles.sectionIconRoadmap} />
                  Product Roadmap (Next Releases)
                </h3>
                <div className={styles.featureList}>
                  <div className={styles.featureItem}>
                    <div className={styles.featureHeader}>
                      <span className={styles.featureName}>GDPR & EU AI Act Alignment Engine</span>
                      <span className={styles.badgeRoadmap}>Q3 2026</span>
                    </div>
                    <p className={styles.featureDesc}>
                      Detailed auditing tool matching policy changes to specific legal requirements and compliance checkpoints.
                    </p>
                  </div>

                  <div className={styles.featureItem}>
                    <div className={styles.featureHeader}>
                      <span className={styles.featureName}>Custom Subscriptions & Alerts</span>
                      <span className={styles.badgeRoadmap}>Q3 2026</span>
                    </div>
                    <p className={styles.featureDesc}>
                      Granular alert controls allowing users to opt into updates for individual companies directly from their profile.
                    </p>
                  </div>

                  <div className={styles.featureItem}>
                    <div className={styles.featureHeader}>
                      <span className={styles.featureName}>CSV & JSON Data Export</span>
                      <span className={styles.badgeRoadmap}>Q4 2026</span>
                    </div>
                    <p className={styles.featureDesc}>
                      Download comparative data grids and compliance assessment logs for offline reporting and corporate auditing.
                    </p>
                  </div>

                  <div className={styles.featureItem}>
                    <div className={styles.featureHeader}>
                      <span className={styles.featureName}>Native Dark Mode Support</span>
                      <span className={styles.badgeRoadmap}>Q4 2026</span>
                    </div>
                    <p className={styles.featureDesc}>
                      Full CSS variables toggle to support a native, system-wide dark UI theme.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
