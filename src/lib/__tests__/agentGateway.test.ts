import { describe, expect, it } from 'vitest';
import {
  AGENT_GATEWAY_MAX_RESULTS,
  getAgentGatewayOpenApi,
  getAgentObservatoryBrief,
  parseAgentBriefQuery,
} from '../agentGateway';

describe('agent evidence gateway', () => {
  it('accepts only bounded query parameters', () => {
    const parsed = parseAgentBriefQuery(new URLSearchParams({
      topic: 'AI governance',
      lang: 'en',
      limit: String(AGENT_GATEWAY_MAX_RESULTS),
    }));
    expect(parsed.ok).toBe(true);
    expect(parseAgentBriefQuery(new URLSearchParams({ secret: 'value' })).ok).toBe(false);
    expect(parseAgentBriefQuery(new URLSearchParams({ limit: '6' })).ok).toBe(false);
    expect(parseAgentBriefQuery(new URLSearchParams({ lang: 'fr' })).ok).toBe(false);
  });

  it('returns a flattened, source-linked observatory brief', () => {
    const parsed = parseAgentBriefQuery(new URLSearchParams({ lang: 'en', limit: '2' }));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const brief = getAgentObservatoryBrief(parsed.value);
    expect(brief.resultCount).toBeLessThanOrEqual(2);
    expect(Array.isArray(brief.answerContext)).toBe(false);
    expect(Array.isArray(brief.citations)).toBe(false);
    expect(brief.boundary).toContain('not legal advice');
  });

  it('publishes three read-only operations without unsupported schema composition or array data types', () => {
    const document = getAgentGatewayOpenApi();
    const serialized = JSON.stringify(document);
    const operations = Object.values(document.paths).flatMap((path) => Object.values(path));
    expect(document.openapi).toBe('3.0.0');
    expect(operations).toHaveLength(3);
    expect(operations.every((operation) => 'operationId' in operation)).toBe(true);
    expect(operations.every((operation) => 'description' in operation && operation.description.length > 0)).toBe(true);
    expect(operations.flatMap((operation) => 'parameters' in operation ? operation.parameters : []).every((parameter) => parameter.description.length > 0)).toBe(true);
    expect(serialized).not.toMatch(/"type":"array"/);
    expect(serialized).not.toMatch(/"(?:oneOf|allOf|anyOf|not)"/);
  });
});
