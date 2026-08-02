import { POLICYWATCHER_ORIGIN } from '@/lib/publicKnowledge';

const content = `# PolicyWatcher

PolicyWatcher is a public evidence laboratory that records verified policy baselines and published policy changes for monitored companies. AI-assisted screening outputs are not legal advice, compliance determinations, or provider statements.

## Canonical public sections
- Knowledge base: ${POLICYWATCHER_ORIGIN}/knowledge
- Evidence packets: ${POLICYWATCHER_ORIGIN}/evidence
- Confidence methodology: ${POLICYWATCHER_ORIGIN}/methodology/confidence
- Trust and Dataset QA: ${POLICYWATCHER_ORIGIN}/trust
- Residency and processor evidence: ${POLICYWATCHER_ORIGIN}/trust/residency
- Observatory: ${POLICYWATCHER_ORIGIN}/observatory
- Editorial Pulse: ${POLICYWATCHER_ORIGIN}/pulse
- Press Data Room: ${POLICYWATCHER_ORIGIN}/press-kit/data
- Developer directory: ${POLICYWATCHER_ORIGIN}/developers
- Community roadmap and local signal composer: ${POLICYWATCHER_ORIGIN}/roadmap

## Machine-readable public access
- Integration manifest: ${POLICYWATCHER_ORIGIN}/api/v1/manifest
- Published change events: ${POLICYWATCHER_ORIGIN}/api/v1/change-events
- Observatory registry: ${POLICYWATCHER_ORIGIN}/api/v1/observatory?lang=en
- Evidence collections: ${POLICYWATCHER_ORIGIN}/api/v1/evidence-collections
- Agent gateway capabilities: ${POLICYWATCHER_ORIGIN}/api/v1/agent/capabilities
- Agent gateway OpenAPI: ${POLICYWATCHER_ORIGIN}/api/v1/agent/openapi.json
- Residency evidence pack: ${POLICYWATCHER_ORIGIN}/api/v1/residency-evidence

## Enterprise integration boundary
The public Agent Evidence Gateway accepts bounded filters and returns deterministic public-evidence briefs with citations. It does not accept prompt transcripts, contract text, tenant identifiers, account identifiers, access tokens, or arbitrary metadata. Microsoft 365 Copilot, Vertex AI Agent Builder, Amazon Quick, and Word source packages require deployment and approval in the customer environment; source-package availability is not marketplace publication, certification, or tenant installation.

## Evidence boundary
Public knowledge and machine endpoints exclude configured, seeded, withheld, unverified, private, and admin records. They do not expose raw policy text, internal logs, raw failures, admin notes, credentials, or database diagnostics. Missing or unavailable data must not be interpreted as a healthy state.

The residency evidence pack is a dated source register. It does not prove the active deployment or backup region and is not a DPA, transfer impact assessment, legal opinion, or provider certification.

The Roadmap Signal Composer stores a bounded proposal draft in the user browser. Draft contents are not sent to PolicyWatcher; opening a reviewed GitHub proposal or copying its text requires an explicit user action. The composer does not establish popularity, endorsement, acceptance, or adoption.

## Citation guidance
Cite the canonical PolicyWatcher entity, change, or evidence URL as a secondary record. Include the official provider source when available. State the observed or published timestamp and retain the methodology boundary. Do not attribute PolicyWatcher screening language to the monitored company.
`;

export async function GET() {
  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
