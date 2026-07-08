import { describe, expect, it } from 'vitest';
import { maskIpAddress } from '../adminAccessLog';

describe('adminAccessLog', () => {
  it('masks IPv4 addresses before persistence', () => {
    expect(maskIpAddress('203.0.113.42')).toBe('203.0.113.xxx');
  });

  it('masks the last visible IPv6 segment before persistence', () => {
    expect(maskIpAddress('2001:db8:abcd:0012:0000:0000:0000:0042')).toBe(
      '2001:db8:abcd:0012:0000:0000:0000:xxxx'
    );
    expect(maskIpAddress('2001:db8::42')).toBe('2001:db8::xxxx');
  });

  it('preserves non-IP diagnostic markers without inventing client data', () => {
    expect(maskIpAddress('unknown')).toBe('unknown');
    expect(maskIpAddress(null)).toBeNull();
  });
});
