import { describe, expect, it } from 'vitest';
import {
  decodeWorkspaceQuery,
  encodeWorkspaceQuery,
  parseWorkspaceProfile,
  serializeWorkspaceProfile,
} from '../workspaceProfile';

describe('workspace profile codec', () => {
  it('round-trips a valid persisted profile', () => {
    const serialized = serializeWorkspaceProfile({
      intent: 'research',
      depth: 'forensic',
      onTheGo: false,
    });

    expect(parseWorkspaceProfile(serialized)).toEqual({
      intent: 'research',
      depth: 'forensic',
      onTheGo: false,
    });
  });

  it('rejects malformed profiles and disables incompatible on-the-go state', () => {
    expect(parseWorkspaceProfile('not-json')).toBeNull();
    expect(parseWorkspaceProfile('{"intent":"unknown","depth":"snapshot"}')).toBeNull();
    expect(
      parseWorkspaceProfile('{"intent":"grc","depth":"operational","onTheGo":true}')
    ).toEqual({ intent: 'grc', depth: 'operational', onTheGo: false });
  });

  it('decodes canonical and legacy workspace query parameters', () => {
    expect(decodeWorkspaceQuery('?intent=builder&depth=FORENSIC')).toEqual({
      hasWorkspaceParams: true,
      intent: 'builder',
      depth: 'forensic',
    });
    expect(decodeWorkspaceQuery('?workspace=research')).toEqual({
      hasWorkspaceParams: true,
      intent: 'research',
      depth: null,
    });
  });

  it('writes stable canonical query state and preserves unrelated filters', () => {
    const query = encodeWorkspaceQuery('?workspace=builder&industry=FinTech&page=2', {
      intent: 'grc',
      depth: 'operational',
    });

    expect(query).toBe('depth=operational&industry=FinTech&intent=grc&page=2');
    expect(decodeWorkspaceQuery(query)).toEqual({
      hasWorkspaceParams: true,
      intent: 'grc',
      depth: 'operational',
    });
  });
});
