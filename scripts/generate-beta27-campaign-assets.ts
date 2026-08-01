import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PRESS_KIT_CANONICAL_URL } from '../src/lib/pressKit';
import {
  buildCampaignLandingUrl,
  editorialCampaigns,
} from '../src/lib/editorialCampaigns';

const CAMPAIGN_RELEASE = '3.9.0-beta.27';
const CAMPAIGN_RELEASE_NAME = 'Admin Operational Readiness';
const CAMPAIGN_DATE = '2026-08-01';

const targetDir = resolve('docs/press-campaign-beta27');
mkdirSync(targetDir, { recursive: true });

function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

type FrozenClaimSnapshot = {
  release: string;
  releaseName: string;
  asOf: string;
  immutableCampaignSnapshot: boolean;
  facts: Array<{ id: string; value: string; label: { en: string }; scope: { en: string }; proofHref: string }>;
  claims: Array<{ id: string; claim: { en: string }; boundary: { en: string }; proofHref: string }>;
};

const claimsJsonPath = resolve(targetDir, 'claims-freeze-beta27.json');
const claimsJson = readFileSync(claimsJsonPath, 'utf8');
const claimSnapshot = JSON.parse(claimsJson) as FrozenClaimSnapshot;
if (
  claimSnapshot.release !== CAMPAIGN_RELEASE
  || claimSnapshot.releaseName !== CAMPAIGN_RELEASE_NAME
  || claimSnapshot.asOf !== CAMPAIGN_DATE
  || claimSnapshot.immutableCampaignSnapshot !== true
) {
  throw new Error('The Beta 27 claims freeze metadata does not match the immutable campaign boundary.');
}
const claimsDigest = sha256(claimsJson);
writeFileSync(resolve(targetDir, 'claims-freeze-beta27.sha256'), `${claimsDigest}  claims-freeze-beta27.json\n`);

const claimsMarkdown = [
  '# PolicyWatcher Beta 27  -  immutable campaign claims sheet',
  '',
  `Release: \`${CAMPAIGN_RELEASE}\` - ${CAMPAIGN_RELEASE_NAME}`,
  `As of: \`${CAMPAIGN_DATE}\``,
  `Canonical registry: ${PRESS_KIT_CANONICAL_URL}#claim-registry`,
  `SHA-256 of JSON snapshot: \`${claimsDigest}\``,
  '',
  'This file is a campaign freeze derived from the public Claim Registry. Later corrections require a new version; do not silently rewrite a distributed snapshot.',
  '',
  '## Approved facts',
  '',
  '| ID | Value | English label | Scope boundary | Proof |',
  '|---|---:|---|---|---|',
  ...claimSnapshot.facts.map((fact) => `| ${fact.id} | ${fact.value} | ${fact.label.en} | ${fact.scope.en} | ${fact.proofHref} |`),
  '',
  '## Approved claims and mandatory boundaries',
  '',
  '| ID | Approved wording | Mandatory boundary | Proof |',
  '|---|---|---|---|',
  ...claimSnapshot.claims.map((claim) => `| ${claim.id} | ${claim.claim.en} | ${claim.boundary.en} | ${claim.proofHref} |`),
  '',
  '## Prohibited transformations',
  '',
  '- Do not replace configured scope with global, complete or exhaustive coverage.',
  '- Do not convert unavailable, excluded, not scanned or Not assessed into zero, clear or healthy.',
  '- Do not convert an implemented control into measured performance, adoption, compliance, certification or independent validation.',
  '- Do not describe repository access under CC BY 4.0 as OSI certification.',
  '- Do not describe external coverage as endorsement.',
  '- Do not describe a checksum as proof of semantic truth, authorship provenance or institutional approval.',
  '',
].join('\n');
writeFileSync(resolve(targetDir, 'claims-freeze-beta27.md'), claimsMarkdown);

const activeCampaigns = editorialCampaigns
  .filter((campaign) => campaign.lifecycle === 'active' && campaign.id.startsWith('beta27-'))
  .map((campaign) => ({
    id: campaign.id,
    release: campaign.release,
    region: campaign.region,
    channel: campaign.channel,
    locale: campaign.locale,
    readiness: campaign.readiness,
    landingUrl: buildCampaignLandingUrl(campaign.id),
    copySource: campaign.availableCopySource,
    disclosure: campaign.disclosure,
  }));

const campaignRegistry = {
  $schema: 'https://policywatcher.online/schemas/editorial-campaign-registry/v1',
  schemaVersion: '1.0.0',
  generatedAt: CAMPAIGN_DATE,
  release: CAMPAIGN_RELEASE,
  privacyBoundary: 'Campaign IDs identify only an allowlisted release, region and channel cohort. They contain no recipient, journalist, outlet, email, account, free text or message identifier.',
  campaigns: activeCampaigns,
};
writeFileSync(resolve(targetDir, 'campaign-registry-beta27.json'), `${JSON.stringify(campaignRegistry, null, 2)}\n`);

console.log(`Generated ${claimSnapshot.claims.length} frozen claims, ${claimSnapshot.facts.length} facts and ${activeCampaigns.length} active campaign cohorts.`);
console.log(`Claims SHA-256: ${claimsDigest}`);
