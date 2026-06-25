/**
 * Admin Explainability Page
 *
 * Static documentation page explaining every feature of PolicyWatcher
 * for audit transparency. Accessible by both admin and auditor roles.
 */
'use client';

import { useState, useEffect } from 'react';
import {
  BookOpen, Database, Brain, BarChart3, Shield, Globe,
  Bell, Lock, Zap, FileText, GitCompare, RefreshCw,
  ChevronDown, ChevronUp, AlertTriangle, CheckCircle
} from 'lucide-react';
import styles from '../admin.module.css';

interface Section {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export default function ExplainabilityPage() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['architecture']));

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const sections: Section[] = [
    {
      id: 'architecture',
      title: 'System Architecture',
      icon: <Database size={20} />,
      content: (
        <div>
          <p style={{ marginBottom: 16, lineHeight: 1.7 }}>
            PolicyWatcher is a Next.js 16 application using React 19 with TypeScript.
            The data layer uses Prisma ORM with SQLite for persistence. The AI layer
            uses Google Gemini for policy analysis and conversational Q&A.
          </p>
          <h4 style={{ marginBottom: 12, color: 'var(--primary)' }}>Data Flow</h4>
          <div className={styles.card} style={{ padding: 20, fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: 1.8 }}>
            <div>1. <strong>Cron Trigger</strong> (POST /api/cron/check-all with Bearer token)</div>
            <div style={{ paddingLeft: 20 }}>|</div>
            <div>2. <strong>Scraper</strong> (fetch URL, extract text, compute SHA-256 hash)</div>
            <div style={{ paddingLeft: 20 }}>|</div>
            <div>3. <strong>Hash Comparison</strong> (newHash !== currentHash?)</div>
            <div style={{ paddingLeft: 20 }}>|-- NO: skip, mark as &quot;unchanged&quot;</div>
            <div style={{ paddingLeft: 20 }}>|-- YES: proceed to analysis</div>
            <div style={{ paddingLeft: 20 }}>|</div>
            <div>4. <strong>Snapshot Creation</strong> (save full text + hash + version)</div>
            <div style={{ paddingLeft: 20 }}>|</div>
            <div>5. <strong>Gemini Analysis</strong> (send old + new text, receive structured JSON)</div>
            <div style={{ paddingLeft: 20 }}>|</div>
            <div>6. <strong>PolicyChange Record</strong> (store AI analysis, KPIs, risk score, region impacts)</div>
            <div style={{ paddingLeft: 20 }}>|</div>
            <div>7. <strong>Email Notifications</strong> (filter subscribers by region/industry, send alerts)</div>
            <div style={{ paddingLeft: 20 }}>|</div>
            <div>8. <strong>UI Refresh</strong> (dashboard fetches /api/companies for updated data)</div>
          </div>

          <h4 style={{ margin: '20px 0 12px', color: 'var(--primary)' }}>Technology Stack</h4>
          <table className={styles.table}>
            <thead><tr><th className={styles.th}>Layer</th><th className={styles.th}>Technology</th><th className={styles.th}>Purpose</th></tr></thead>
            <tbody>
              <tr className={styles.trHover}><td className={styles.td}>Frontend</td><td className={styles.td}>React 19, CSS Modules</td><td className={styles.td}>UI components, styling</td></tr>
              <tr className={styles.trHover}><td className={styles.td}>Framework</td><td className={styles.td}>Next.js 16 (Turbopack)</td><td className={styles.td}>SSR, API routes, routing</td></tr>
              <tr className={styles.trHover}><td className={styles.td}>Database</td><td className={styles.td}>SQLite via Prisma ORM</td><td className={styles.td}>Data persistence</td></tr>
              <tr className={styles.trHover}><td className={styles.td}>AI</td><td className={styles.td}>Google Gemini 2.5 Flash</td><td className={styles.td}>Policy analysis, chat</td></tr>
              <tr className={styles.trHover}><td className={styles.td}>Fallback AI</td><td className={styles.td}>Gemini 2.0 Flash-Lite</td><td className={styles.td}>503/429 resilience</td></tr>
              <tr className={styles.trHover}><td className={styles.td}>Charts</td><td className={styles.td}>Recharts</td><td className={styles.td}>Risk trends, radar charts</td></tr>
              <tr className={styles.trHover}><td className={styles.td}>PDF</td><td className={styles.td}>@react-pdf/renderer</td><td className={styles.td}>Executive reports</td></tr>
              <tr className={styles.trHover}><td className={styles.td}>Email</td><td className={styles.td}>Nodemailer</td><td className={styles.td}>Subscriber alerts</td></tr>
            </tbody>
          </table>
        </div>
      ),
    },
    {
      id: 'scraping',
      title: 'Scraping Pipeline',
      icon: <RefreshCw size={20} />,
      content: (
        <div>
          <h4 style={{ marginBottom: 12, color: 'var(--primary)' }}>How It Works</h4>
          <ul style={{ lineHeight: 1.8, paddingLeft: 20 }}>
            <li>The scraper fetches each tracked URL using a standard HTTP GET with a browser-like User-Agent.</li>
            <li>HTML is parsed to extract the main text content (removing navigation, scripts, and boilerplate).</li>
            <li>A SHA-256 hash is computed on the extracted text for change detection.</li>
            <li>If the hash matches the stored hash, no action is taken (policy unchanged).</li>
            <li>If the hash differs, the full text is saved as a new PolicySnapshot.</li>
          </ul>

          <h4 style={{ margin: '20px 0 12px', color: 'var(--primary)' }}>Data Integrity Guarantees</h4>
          <div className={styles.alert + ' ' + styles.alertInfo}>
            <CheckCircle size={16} /> The scraper NEVER fabricates data. If a page is blocked by Cloudflare,
            returns a captcha, or is temporarily unavailable, the system records the status honestly
            as &quot;unavailable&quot; or &quot;invalid&quot; and skips analysis. No snapshot or AI analysis is created
            for unreachable pages.
          </div>

          <h4 style={{ margin: '20px 0 12px', color: 'var(--primary)' }}>Error Classification</h4>
          <table className={styles.table}>
            <thead><tr><th className={styles.th}>Status</th><th className={styles.th}>Meaning</th><th className={styles.th}>Action</th></tr></thead>
            <tbody>
              <tr className={styles.trHover}><td className={styles.td}>unchanged</td><td className={styles.td}>Hash matches, no changes</td><td className={styles.td}>Skip</td></tr>
              <tr className={styles.trHover}><td className={styles.td}>changed</td><td className={styles.td}>New hash detected</td><td className={styles.td}>Snapshot + AI analysis</td></tr>
              <tr className={styles.trHover}><td className={styles.td}>unavailable</td><td className={styles.td}>Timeout, bot block, maintenance</td><td className={styles.td}>Log and skip</td></tr>
              <tr className={styles.trHover}><td className={styles.td}>invalid</td><td className={styles.td}>404, 410, soft-404</td><td className={styles.td}>Log and skip</td></tr>
              <tr className={styles.trHover}><td className={styles.td}>error</td><td className={styles.td}>Unexpected exception</td><td className={styles.td}>Log error, continue</td></tr>
            </tbody>
          </table>
        </div>
      ),
    },
    {
      id: 'ai-analysis',
      title: 'AI Analysis Engine',
      icon: <Brain size={20} />,
      content: (
        <div>
          <h4 style={{ marginBottom: 12, color: 'var(--primary)' }}>Model Fallback Chain</h4>
          <div className={styles.card} style={{ padding: 16, fontFamily: 'monospace', fontSize: '0.85rem' }}>
            gemini-2.5-flash (primary, best quality) → gemini-2.0-flash-lite (fallback, highest availability)
          </div>
          <p style={{ marginTop: 12, lineHeight: 1.7 }}>
            If the primary model returns 503 (overloaded) or 429 (rate limited), the system automatically
            retries with the fallback model. If both fail, mock analysis data is used for the cron pipeline,
            and a user-friendly bilingual error message is shown for the chat.
          </p>

          <h4 style={{ margin: '20px 0 12px', color: 'var(--primary)' }}>Analysis Output Structure</h4>
          <p style={{ lineHeight: 1.7, marginBottom: 12 }}>
            Gemini receives the old and new policy text and returns a structured JSON with:
          </p>
          <ul style={{ lineHeight: 1.8, paddingLeft: 20 }}>
            <li><strong>Executive Summary</strong> (bilingual EN/IT)</li>
            <li><strong>TL;DR</strong> (one-sentence takeaway, bilingual)</li>
            <li><strong>Key Points</strong> (3-5 bullets with sentiment: positive/negative/neutral)</li>
            <li><strong>Risk Reasons</strong> (exactly 3 reasons with delta scores, e.g. +2, -1)</li>
            <li><strong>Overall Risk</strong> (Low/Medium/High) and <strong>Score</strong> (1-10)</li>
            <li><strong>15 KPI Values</strong> across Privacy, AI Governance, Ethics</li>
            <li><strong>AI Governance Indicators</strong> (training opt-out, scraping, IP, retention)</li>
            <li><strong>Remediations</strong> (2-4 actionable steps with optional URLs)</li>
            <li><strong>6 Region Impacts</strong> (EU/US/Global x Individual/Enterprise)</li>
          </ul>

          <h4 style={{ margin: '20px 0 12px', color: 'var(--primary)' }}>Safety</h4>
          <div className={styles.alert + ' ' + styles.alertWarning}>
            <AlertTriangle size={16} /> The system prompt includes an explicit injection defense:
            policy text is wrapped in a POLICY_CONTEXT tag and marked as UNTRUSTED DATA.
            The model is instructed to never follow instructions found within policy texts.
          </div>
        </div>
      ),
    },
    {
      id: 'kpi-framework',
      title: 'KPI Framework (15 Indicators)',
      icon: <BarChart3 size={20} />,
      content: (
        <div>
          <p style={{ marginBottom: 16, lineHeight: 1.7 }}>
            Each policy analysis produces values for 15 KPIs organized into 3 areas.
            Values are assigned by Gemini based on the actual policy text.
          </p>
          <table className={styles.table}>
            <thead><tr><th className={styles.th}>Area</th><th className={styles.th}>KPI</th><th className={styles.th}>Possible Values</th></tr></thead>
            <tbody>
              <tr className={styles.trHover}><td className={styles.td} rowSpan={5}>Privacy & Data Protection</td><td className={styles.td}>Data Collection Scope</td><td className={styles.td}>Minimal, Moderate, Extensive</td></tr>
              <tr className={styles.trHover}><td className={styles.td}>Third-Party Sharing</td><td className={styles.td}>None, Limited, Broad</td></tr>
              <tr className={styles.trHover}><td className={styles.td}>Data Retention</td><td className={styles.td}>Defined, Extended, Indefinite</td></tr>
              <tr className={styles.trHover}><td className={styles.td}>Right to Deletion</td><td className={styles.td}>Full, Partial, None</td></tr>
              <tr className={styles.trHover}><td className={styles.td}>Cross-Border Transfer</td><td className={styles.td}>Restricted, Controlled, Unrestricted</td></tr>
              <tr className={styles.trHover}><td className={styles.td} rowSpan={5}>AI Governance</td><td className={styles.td}>AI Training Opt-Out</td><td className={styles.td}>Available, Partial, Not Available</td></tr>
              <tr className={styles.trHover}><td className={styles.td}>AI Output Ownership</td><td className={styles.td}>User Retained, Shared, Company Claimed</td></tr>
              <tr className={styles.trHover}><td className={styles.td}>Algorithmic Transparency</td><td className={styles.td}>Published, Partial, Opaque</td></tr>
              <tr className={styles.trHover}><td className={styles.td}>Automated Decisions</td><td className={styles.td}>Disclosed, Partial, Undisclosed</td></tr>
              <tr className={styles.trHover}><td className={styles.td}>AI Bias & Fairness</td><td className={styles.td}>Committed, Mentioned, Absent</td></tr>
              <tr className={styles.trHover}><td className={styles.td} rowSpan={5}>Ethics & Corporate Gov.</td><td className={styles.td}>Consent Mechanism</td><td className={styles.td}>Explicit Opt-In, Opt-Out, Implicit</td></tr>
              <tr className={styles.trHover}><td className={styles.td}>Regulatory Compliance</td><td className={styles.td}>Comprehensive, Partial, Minimal</td></tr>
              <tr className={styles.trHover}><td className={styles.td}>Breach Notification</td><td className={styles.td}>Within 24h, Within 72h, Unspecified</td></tr>
              <tr className={styles.trHover}><td className={styles.td}>Independent Audit</td><td className={styles.td}>Certified, Partial, None</td></tr>
              <tr className={styles.trHover}><td className={styles.td}>Content Moderation</td><td className={styles.td}>Transparent, Partial, Opaque</td></tr>
            </tbody>
          </table>

          <h4 style={{ margin: '20px 0 12px', color: 'var(--primary)' }}>Manual Justifications</h4>
          <p style={{ lineHeight: 1.7 }}>
            In addition to AI-generated KPI values, PolicyWatcher includes 480 manually curated
            justifications (16 companies x 15 KPIs x 2 languages). These are stored in
            kpi-justifications.ts and provide human-verified context for each rating, including
            a screening date. They serve as a fallback and validation layer for the AI output.
          </p>
        </div>
      ),
    },
    {
      id: 'risk-scoring',
      title: 'Risk Scoring Methodology',
      icon: <Shield size={20} />,
      content: (
        <div>
          <p style={{ marginBottom: 16, lineHeight: 1.7 }}>
            The overall risk score (1-10) is assigned by Gemini based on the full policy text analysis.
            The score is accompanied by exactly 3 risk reasons, each with a delta contribution
            (e.g., +2, -1) that explains how it affects the final score.
          </p>
          <table className={styles.table}>
            <thead><tr><th className={styles.th}>Score Range</th><th className={styles.th}>Risk Level</th><th className={styles.th}>Interpretation</th></tr></thead>
            <tbody>
              <tr className={styles.trHover}><td className={styles.td}>1-3</td><td className={styles.td}><span className={styles.badge + ' ' + styles.badgeLow}>Low</span></td><td className={styles.td}>Strong privacy protections, transparent practices</td></tr>
              <tr className={styles.trHover}><td className={styles.td}>4-6</td><td className={styles.td}><span className={styles.badge + ' ' + styles.badgeMedium}>Medium</span></td><td className={styles.td}>Mixed practices, some concerns</td></tr>
              <tr className={styles.trHover}><td className={styles.td}>7-10</td><td className={styles.td}><span className={styles.badge + ' ' + styles.badgeHigh}>High</span></td><td className={styles.td}>Significant privacy or governance concerns</td></tr>
            </tbody>
          </table>

          <h4 style={{ margin: '20px 0 12px', color: 'var(--primary)' }}>Transparency</h4>
          <p style={{ lineHeight: 1.7 }}>
            Every score is fully explainable: the 3 risk reasons provide the specific rationale
            with numeric contributions. This is not a black box. Users can see exactly why a
            company received its score and trace it back to the policy text.
          </p>
        </div>
      ),
    },
    {
      id: 'region-impacts',
      title: 'Region Impact Analysis',
      icon: <Globe size={20} />,
      content: (
        <div>
          <p style={{ marginBottom: 16, lineHeight: 1.7 }}>
            Each policy change generates exactly 6 region impact assessments:
          </p>
          <table className={styles.table}>
            <thead><tr><th className={styles.th}>Region</th><th className={styles.th}>Perspective</th><th className={styles.th}>Frameworks Referenced</th></tr></thead>
            <tbody>
              <tr className={styles.trHover}><td className={styles.td}>EU</td><td className={styles.td}>Individual</td><td className={styles.td}>GDPR, EU AI Act, ePrivacy</td></tr>
              <tr className={styles.trHover}><td className={styles.td}>EU</td><td className={styles.td}>Enterprise</td><td className={styles.td}>GDPR, EU AI Act, DORA, NIS2</td></tr>
              <tr className={styles.trHover}><td className={styles.td}>US</td><td className={styles.td}>Individual</td><td className={styles.td}>CCPA/CPRA, state laws</td></tr>
              <tr className={styles.trHover}><td className={styles.td}>US</td><td className={styles.td}>Enterprise</td><td className={styles.td}>FTC Act, SOX, sector-specific</td></tr>
              <tr className={styles.trHover}><td className={styles.td}>Global</td><td className={styles.td}>Individual</td><td className={styles.td}>OECD Privacy, APEC CBPR</td></tr>
              <tr className={styles.trHover}><td className={styles.td}>Global</td><td className={styles.td}>Enterprise</td><td className={styles.td}>ISO 27001, NIST AI RMF, ISO 42001</td></tr>
            </tbody>
          </table>
        </div>
      ),
    },
    {
      id: 'alerts',
      title: 'Email Alert System',
      icon: <Bell size={20} />,
      content: (
        <div>
          <ul style={{ lineHeight: 1.8, paddingLeft: 20 }}>
            <li>Subscribers register with email, name, preferred regions, and preferred industries.</li>
            <li>Frequency options: INSTANT (on every change), WEEKLY, MONTHLY.</li>
            <li>When the cron detects changes, it filters by each subscriber&apos;s region and industry preferences.</li>
            <li>Only matching changes are included in the alert email.</li>
            <li>Each subscriber has a unique unsubscribe token for one-click unsubscription.</li>
            <li>SMTP configuration is in the .env file (supports Gmail, SendGrid, any SMTP provider).</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'security',
      title: 'Security Architecture',
      icon: <Lock size={20} />,
      content: (
        <div>
          <table className={styles.table}>
            <thead><tr><th className={styles.th}>Mechanism</th><th className={styles.th}>Implementation</th><th className={styles.th}>Scope</th></tr></thead>
            <tbody>
              <tr className={styles.trHover}><td className={styles.td}>API Auth</td><td className={styles.td}>Bearer token (API_SECRET)</td><td className={styles.td}>Cron endpoints</td></tr>
              <tr className={styles.trHover}><td className={styles.td}>Admin Auth</td><td className={styles.td}>HMAC-SHA256 signed cookies</td><td className={styles.td}>Admin dashboard</td></tr>
              <tr className={styles.trHover}><td className={styles.td}>Rate Limiting</td><td className={styles.td}>In-memory per-IP, 60 req/min</td><td className={styles.td}>Public API endpoints</td></tr>
              <tr className={styles.trHover}><td className={styles.td}>Cookie Security</td><td className={styles.td}>HttpOnly, Secure, SameSite=Strict</td><td className={styles.td}>Admin sessions</td></tr>
              <tr className={styles.trHover}><td className={styles.td}>Data Integrity</td><td className={styles.td}>SHA-256 hashing for change detection</td><td className={styles.td}>Policy snapshots</td></tr>
              <tr className={styles.trHover}><td className={styles.td}>AI Injection Defense</td><td className={styles.td}>UNTRUSTED DATA tags in prompts</td><td className={styles.td}>Gemini calls</td></tr>
              <tr className={styles.trHover}><td className={styles.td}>Env Protection</td><td className={styles.td}>.gitignore, server-side only</td><td className={styles.td}>All secrets</td></tr>
            </tbody>
          </table>
        </div>
      ),
    },
  ];

  return (
    <div>
      <h1 className={styles.pageTitle}>
        <BookOpen size={24} /> Explainability
      </h1>
      <p className={styles.pageSubtitle}>
        Complete technical documentation of every PolicyWatcher feature. Designed for audit transparency and regulatory review.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
        {sections.map((section) => {
          const isExpanded = expandedSections.has(section.id);
          return (
            <div key={section.id} className={styles.card}>
              <button
                className={styles.expandableHeader}
                onClick={() => toggleSection(section.id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '1rem', fontWeight: 600 }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ color: 'var(--primary)' }}>{section.icon}</span>
                  {section.title}
                </span>
                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              {isExpanded && (
                <div style={{ padding: '0 20px 20px' }}>
                  {section.content}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
