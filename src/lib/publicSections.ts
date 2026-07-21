export type PublicSectionGroup =
  | 'core'
  | 'evidence'
  | 'assurance'
  | 'community'
  | 'governance'
  | 'boundary';

export interface PublicSectionNode {
  id: string;
  label: string;
  href: string;
  group: PublicSectionGroup;
  summary: string;
  role: string;
  status: 'live' | 'dynamic' | 'reference' | 'protected';
  icon: string;
  x: number;
  y: number;
}

export interface PublicSectionEdge {
  from: string;
  to: string;
  label: string;
  strength: 'primary' | 'secondary';
}

export const publicSectionGroups: Record<PublicSectionGroup, { label: string; description: string; color: string }> = {
  core: {
    label: 'Core Workspace',
    description: 'Entry points and public inspection surfaces.',
    color: '#146c6a',
  },
  evidence: {
    label: 'Evidence Views',
    description: 'Source-gated views built from publicEvidence records.',
    color: '#3f55a6',
  },
  assurance: {
    label: 'Trust & QA',
    description: 'Quality gates, security signals and operational evidence.',
    color: '#b45309',
  },
  community: {
    label: 'Community Surface',
    description: 'Roadmap, press references and public narrative.',
    color: '#7c3aed',
  },
  governance: {
    label: 'Methodology',
    description: 'Use boundaries, confidence methodology and privacy policy.',
    color: '#0f766e',
  },
  boundary: {
    label: 'Controlled Boundary',
    description: 'Protected operational capabilities, shown for context only.',
    color: '#475569',
  },
};

export const publicSectionNodes: PublicSectionNode[] = [
  {
    id: 'dashboard',
    label: 'Evidence Console',
    href: '/',
    group: 'core',
    summary: 'Main public dashboard with filters, QA state, source suspensions and monitored companies.',
    role: 'Start here to inspect current public evidence.',
    status: 'dynamic',
    icon: 'layout',
    x: 48,
    y: 50,
  },
  {
    id: 'showcase',
    label: 'Showcase',
    href: '/showcase',
    group: 'core',
    summary: 'Product overview, workflows, admin capabilities and dataset-quality narrative.',
    role: 'Use it to understand the platform at a glance.',
    status: 'live',
    icon: 'sparkles',
    x: 28,
    y: 22,
  },
  {
    id: 'timeline',
    label: 'Timeline',
    href: '/timeline',
    group: 'evidence',
    summary: 'Chronological view of source-verified policy movement.',
    role: 'Use it to follow change history over time.',
    status: 'dynamic',
    icon: 'clock',
    x: 22,
    y: 55,
  },
  {
    id: 'observatory',
    label: 'Observatory',
    href: '/observatory',
    group: 'evidence',
    summary: 'Curated public source registry for AI governance, privacy enforcement, standards and events.',
    role: 'Use it to inspect authoritative sources before following public policy signals.',
    status: 'reference',
    icon: 'book',
    x: 58,
    y: 34,
  },
  {
    id: 'leaderboard',
    label: 'Policy Signals Board',
    href: '/leaderboard',
    group: 'evidence',
    summary: 'Evidence-only ranking of source coverage, retrieval traceability and public movement.',
    role: 'Use it to compare evidence readiness, not legal compliance.',
    status: 'dynamic',
    icon: 'bar-chart',
    x: 31,
    y: 78,
  },
  {
    id: 'trust',
    label: 'Trust & Quality',
    href: '/trust',
    group: 'assurance',
    summary: 'CI, CodeQL, OpenSSF, HTTP header checks, renderer evidence and Dataset QA framing.',
    role: 'Use it to inspect operational quality signals.',
    status: 'reference',
    icon: 'shield',
    x: 69,
    y: 76,
  },
  {
    id: 'methodology',
    label: 'Confidence Methodology',
    href: '/methodology/confidence',
    group: 'governance',
    summary: 'Bilingual explanation of provenance, scraper cascade, AI limits and known boundaries.',
    role: 'Use it before relying on any output.',
    status: 'reference',
    icon: 'book',
    x: 76,
    y: 55,
  },
  {
    id: 'roadmap',
    label: 'Community Roadmap',
    href: '/roadmap',
    group: 'community',
    summary: 'Future features, adaptive workspaces, API ideas and community-priority signals.',
    role: 'Use it to see what is planned and suggest priorities.',
    status: 'live',
    icon: 'route',
    x: 73,
    y: 25,
  },
  {
    id: 'press',
    label: 'Press Wall',
    href: '/press',
    group: 'community',
    summary: 'Public references, professional-community mentions and media coverage.',
    role: 'Use it to trace public discussion without treating mentions as endorsement.',
    status: 'live',
    icon: 'newspaper',
    x: 53,
    y: 13,
  },
  {
    id: 'about',
    label: 'About the Project',
    href: '/about',
    group: 'community',
    summary: 'Project authorship, public contact routes, open-source links, and the background behind PolicyWatcher.',
    role: 'Use it to understand who maintains the project and where to continue the conversation.',
    status: 'reference',
    icon: 'user',
    x: 39,
    y: 13,
  },
  {
    id: 'security',
    label: 'Security Policy',
    href: '/security',
    group: 'governance',
    summary: 'Responsible disclosure channel and in-scope security reporting boundaries.',
    role: 'Use it to report vulnerabilities responsibly.',
    status: 'reference',
    icon: 'lock',
    x: 88,
    y: 38,
  },
  {
    id: 'privacy',
    label: 'Privacy Policy',
    href: '/privacy',
    group: 'governance',
    summary: 'Privacy notice and user-data boundaries.',
    role: 'Use it to understand site privacy terms.',
    status: 'reference',
    icon: 'file-text',
    x: 86,
    y: 70,
  },
  {
    id: 'infographics',
    label: 'Visual Guide',
    href: '/infographics',
    group: 'community',
    summary: 'Interactive animated infographics detailing Adaptive Workspaces, Site Atlas and filter invariants.',
    role: 'Use it to see how PolicyWatcher layout adapts.',
    status: 'live',
    icon: 'sparkles',
    x: 64,
    y: 19,
  },
  {
    id: 'admin',
    label: 'Admin Operations',
    href: '/admin',
    group: 'boundary',
    summary: 'Protected console for Dataset QA, cron scans, VPS services, database inspection and review logs.',
    role: 'Shown as an architecture boundary; access remains protected.',
    status: 'protected',
    icon: 'server',
    x: 50,
    y: 93,
  },
];

export const publicSectionEdges: PublicSectionEdge[] = [
  { from: 'dashboard', to: 'timeline', label: 'publishes verified changes to', strength: 'primary' },
  { from: 'dashboard', to: 'observatory', label: 'uses curated source context from', strength: 'secondary' },
  { from: 'dashboard', to: 'leaderboard', label: 'feeds evidence signals into', strength: 'primary' },
  { from: 'dashboard', to: 'methodology', label: 'is governed by', strength: 'primary' },
  { from: 'dashboard', to: 'trust', label: 'surfaces QA state in', strength: 'primary' },
  { from: 'observatory', to: 'methodology', label: 'documents registry boundaries beside', strength: 'primary' },
  { from: 'observatory', to: 'trust', label: 'depends on QA interpretation from', strength: 'secondary' },
  { from: 'showcase', to: 'dashboard', label: 'introduces', strength: 'primary' },
  { from: 'showcase', to: 'roadmap', label: 'points future work to', strength: 'secondary' },
  { from: 'showcase', to: 'trust', label: 'summarizes assurance from', strength: 'secondary' },
  { from: 'roadmap', to: 'dashboard', label: 'evolves into adaptive lenses for', strength: 'primary' },
  { from: 'roadmap', to: 'infographics', label: 'illustrates progress through', strength: 'secondary' },
  { from: 'infographics', to: 'dashboard', label: 'explains adaptive views on', strength: 'primary' },
  { from: 'press', to: 'showcase', label: 'references the public story of', strength: 'secondary' },
  { from: 'about', to: 'showcase', label: 'introduces the project through', strength: 'primary' },
  { from: 'about', to: 'roadmap', label: 'connects community work with', strength: 'secondary' },
  { from: 'trust', to: 'methodology', label: 'documents evidence boundaries with', strength: 'primary' },
  { from: 'security', to: 'trust', label: 'supports security evidence in', strength: 'secondary' },
  { from: 'privacy', to: 'methodology', label: 'sets user-data boundaries beside', strength: 'secondary' },
  { from: 'admin', to: 'dashboard', label: 'controls data exposed by', strength: 'primary' },
  { from: 'admin', to: 'trust', label: 'produces operational evidence for', strength: 'secondary' },
];
