import { describe, expect, it } from 'vitest';
import {
  buildReturnedRemediationSummary,
  deriveNextRemediationAction,
  remediationReasonLabel,
  safeSourceReference,
  sortRemediationIssues,
} from '@/lib/sourceRemediation';

const issue = (id: string, status: string, detected: string, sourceUrl = 'https://example.com/privacy') => ({
  id,
  status,
  lastDetectedAt: detected,
  sourceUrl,
  retrievalKey: `key-${id}`,
  reasonCode: 'access_blocked',
});

describe('source remediation workbench helpers', () => {
  it('orders returned issues by actionability and then recency', () => {
    const sorted = sortRemediationIssues([
      issue('resolved', 'Resolved', '2026-08-02T12:00:00Z'),
      issue('watching', 'Watching', '2026-08-02T11:00:00Z'),
      issue('older-open', 'Open', '2026-08-01T11:00:00Z'),
      issue('newer-open', 'Open', '2026-08-02T11:00:00Z'),
      issue('recovered', 'Recovered', '2026-08-02T10:00:00Z'),
    ]);
    expect(sorted.map((entry) => entry.id)).toEqual(['newer-open', 'older-open', 'watching', 'recovered', 'resolved']);
  });

  it('derives one bounded next action without making a health claim', () => {
    const action = deriveNextRemediationAction([
      issue('recovered', 'Recovered', '2026-08-02T10:00:00Z'),
      issue('open', 'Open', '2026-08-02T09:00:00Z'),
    ]);
    expect(action).toMatchObject({ issueId: 'open', label: 'Repair active source failure', sourceHost: 'example.com' });
    expect(deriveNextRemediationAction([issue('resolved', 'Resolved', '2026-08-02T10:00:00Z')])).toBeNull();
  });

  it('summarizes only the returned window and labels the boundary', () => {
    const summary = buildReturnedRemediationSummary([
      issue('open', 'Open', '2026-08-02T09:00:00Z'),
      issue('recovered', 'Recovered', '2026-08-02T10:00:00Z'),
    ], 120);
    expect(summary).toMatchObject({ returned: 2, total: 120, limit: 100, counts: { open: 1, recovered: 1 } });
    expect(summary.boundary).toContain('not a source-health claim');
  });

  it('exposes external links only for credential-free HTTPS sources without fragments', () => {
    expect(safeSourceReference('https://www.example.com/privacy?lang=en')).toEqual({
      host: 'example.com',
      path: '/privacy',
      href: 'https://www.example.com/privacy?lang=en',
    });
    expect(safeSourceReference('http://example.com/privacy').href).toBeNull();
    expect(safeSourceReference('https://user:secret@example.com/privacy').href).toBeNull();
    expect(safeSourceReference('https://example.com/privacy#internal').href).toBeNull();
    expect(safeSourceReference('not-a-url')).toEqual({ host: 'Invalid source', path: 'URL unavailable', href: null });
  });

  it('turns machine reason codes into bounded operator labels', () => {
    expect(remediationReasonLabel('transport_timeout')).toBe('Transport timeout');
    expect(remediationReasonLabel('new_safe_reason')).toBe('New safe reason');
    expect(remediationReasonLabel(null)).toBe('Reason not recorded');
  });
});
