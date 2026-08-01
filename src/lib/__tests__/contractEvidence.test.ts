import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  CONTRACT_SELECTION_MAX_CHARACTERS,
  deriveContractEvidenceQuery,
} from '../contractEvidence';

describe('contract evidence topic derivation', () => {
  it('links the Word manifest to the live support and task-pane routes', () => {
    const manifest = readFileSync('integrations/office-word/policywatcher-contract-evidence-review/manifest.xml', 'utf8');
    expect(manifest).toContain('https://policywatcher.online/methodology/confidence');
    expect(manifest).toContain('https://policywatcher.online/office-addin/contract-review');
    expect(manifest).not.toContain('https://policywatcher.online/methodology"');
  });

  it('derives only fixed topic labels and never returns the selected clause', () => {
    const confidentialClause = 'Project Zephyr customer list is confidential. The supplier must report a security incident and delete personal data.';
    const result = deriveContractEvidenceQuery(confidentialClause);
    expect(result.topics.map((topic) => topic.id)).toEqual(expect.arrayContaining(['confidentiality', 'security', 'privacy', 'retention']));
    expect(JSON.stringify(result)).not.toContain('Project Zephyr');
    expect(result.query).not.toContain('customer list');
  });

  it('bounds local classification without adding arbitrary fallback keywords', () => {
    const result = deriveContractEvidenceQuery('x'.repeat(CONTRACT_SELECTION_MAX_CHARACTERS + 250));
    expect(result.characterCount).toBe(CONTRACT_SELECTION_MAX_CHARACTERS + 250);
    expect(result.truncated).toBe(true);
    expect(result.topics).toEqual([]);
    expect(result.query).toBe('');
  });
});
