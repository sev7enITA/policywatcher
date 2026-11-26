import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { buildPublicInsight } from '@/lib/policyAsCode';
import { parseInsight, canonicalize } from '../../../integrations/policy-as-code/insight-ir.mjs';

describe('offline exporter → strict interchange → PolicyAsCode draft sidecar', () => {
  it('preserves exact version/digest/UTF16 provenance through the real importer CLI', () => {
    const directory = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'pw-pac-roundtrip-'));
    try {
      fs.chmodSync(directory, 0o700);
      const source = 'Synthetic 🧪. We retain sample data for 30 days.';
      const insight = buildPublicInsight({
        id: '11111111-1111-4111-8111-111111111111', publicEvidence: true,
        publicPublishedAt: '2026-11-22T10:01:00.000Z', createdAt: '2026-11-22T10:00:30.000Z',
        aiSummaryEn: 'Synthetic retention screening.', tldrEn: null,
        riskReasonsJson: JSON.stringify([{ textEn: 'Synthetic retention screening.', evidenceSide: 'new',
          evidenceQuote: 'We retain sample data for 30 days.', relatedKpi: 'kpiDataRetention' }]),
        newSnapshot: { version: 3, publicEvidence: true, text: source, createdAt: '2026-11-22T10:00:00.000Z' },
        oldSnapshot: null, policy: { id: '22222222-2222-4222-8222-222222222222', jurisdiction: '',
          url: 'https://example.org/policy', dataStatus: 'Reviewed', ingestionMethod: 'Direct Scrape' },
      }, new Date('2026-11-22T10:02:00.000Z'))!;
      const interchange = JSON.stringify(insight);
      expect(canonicalize(parseInsight(interchange))).toBe(canonicalize(insight));
      const input = path.join(directory, 'insight.json');
      fs.writeFileSync(input, interchange, { mode: 0o600 });
      const run = () => spawnSync(process.execPath, [
        path.resolve('integrations/policy-as-code/import-draft.mjs'), '--input', input,
        '--draft-root', directory, '--tenant', 'qa-tenant', '--project', 'review-only', '--actor', 'offline-qa',
      ], { encoding: 'utf8', timeout: 10_000 });
      const first = run();
      expect(first.status, first.stderr).toBe(0);
      const receipt = JSON.parse(first.stdout);
      expect(receipt.status).toBe('created');
      const stored = JSON.parse(fs.readFileSync(receipt.path, 'utf8'));
      expect(stored.status).toBe('draft');
      expect(stored.insight).toEqual(insight);
      expect(stored.sourcePayloadDigest).toBe(insight.contentDigest);
      const span = stored.insight.claims[0].evidence[0];
      expect(source.slice(span.start, span.end)).toBe(span.quote);
      expect(stored.executionAuthorized).toBe(false);
      const bytes = fs.readFileSync(receipt.path);
      const repeated = run();
      expect(repeated.status, repeated.stderr).toBe(0);
      expect(JSON.parse(repeated.stdout).status).toBe('existing');
      expect(fs.readFileSync(receipt.path)).toEqual(bytes);
      expect(fs.readdirSync(directory).sort()).toEqual(['insight.json', 'qa-tenant']);
    } finally { fs.rmSync(directory, { recursive: true, force: true }); }
  });
});
