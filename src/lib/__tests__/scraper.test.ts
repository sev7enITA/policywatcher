import { describe, expect, it, vi } from 'vitest';
import { isIP } from 'net';

vi.mock('dns/promises', () => ({
  lookup: vi.fn(async (hostname: string) => {
    const fixtures: Record<string, Array<{ address: string; family: number }>> = {
      'public.example': [{ address: '93.184.216.34', family: 4 }],
      'mixed-private.example': [
        { address: '93.184.216.34', family: 4 },
        { address: '10.0.0.5', family: 4 },
      ],
      'ipv6-doc.example': [{ address: '2001:db8::1', family: 6 }],
      'ipv6-public.example': [{ address: '2001:4860:4860::8888', family: 6 }],
    };
    const result = fixtures[hostname];
    if (!result) throw new Error(`unmocked dns lookup: ${hostname}`);
    return result;
  }),
}));

import {
  detectBlockPage,
  detectSoft404,
  extractPolicyText,
  hasLiveHostDrift,
  hasLivePathDrift,
  isFreshEnough,
  isPolicyContent,
  parseArchiveTimestamp,
  validateOutboundUrl,
  resolveAndPinHostname,
  isCoherentHost,
  validateContent,
} from '../scraper';

/* ------------------------------------------------------------------
   Fixtures
   ------------------------------------------------------------------ */

const POLICY_HTML = `
<html><head><title>Privacy Policy</title><style>.x{color:red}</style></head>
<body>
  <nav>Home | Products | About</nav>
  <header id="header">MegaCorp</header>
  <main>
    <h1>Privacy Policy</h1>
    <p>We collect personal data and information about your account when you use our service.</p>
    <h2>Your rights</h2>
    <p>You have rights over your data, including deletion and access, under the GDPR.</p>
    <ul><li>Right of access</li><li>Right to erasure</li></ul>
    <p>We use cookies and require consent for processing and disclosure to third party providers. Data retention periods are described below. This agreement covers the terms of the policy for every user.</p>
  </main>
  <footer id="footer">Copyright MegaCorp - <a href="/terms">Terms</a></footer>
  <script>trackEverything()</script>
</body></html>`;

const CLOUDFLARE_CHALLENGE = `
<html><head><title>Just a moment...</title></head>
<body><div id="cf-challenge-running">Checking your browser before accessing example.com</div></body></html>`;

const SOFT_404 = `
<html><head><title>Oops</title></head>
<body><h1>Page not found</h1><p>The page you requested could not be found.</p></body></html>`;

const SOFT_404_IT = `
<html><head><title>Errore</title></head>
<body><h1>Errore 404</h1><p>Pagina non trovata.</p></body></html>`;

/* ------------------------------------------------------------------
   extractPolicyText
   ------------------------------------------------------------------ */

describe('extractPolicyText', () => {
  it('extracts headings, paragraphs and list items as structured text', () => {
    const text = extractPolicyText(POLICY_HTML);
    expect(text).toContain('# Privacy Policy');
    expect(text).toContain('## Your rights');
    expect(text).toContain('- Right of access');
    expect(text).toContain('We collect personal data');
  });

  it('strips navigation, header, footer and scripts', () => {
    const text = extractPolicyText(POLICY_HTML);
    expect(text).not.toContain('Home | Products');
    expect(text).not.toContain('trackEverything');
    expect(text).not.toContain('Copyright MegaCorp');
  });

  it('is deterministic: same HTML always yields the same text (hash stability)', () => {
    expect(extractPolicyText(POLICY_HTML)).toBe(extractPolicyText(POLICY_HTML));
  });

  it('falls back to raw visible text when no structured blocks exist', () => {
    const bare = '<html><body>plain privacy text about data and cookies with no markup</body></html>';
    expect(extractPolicyText(bare)).toContain('plain privacy text');
  });

  it('does not duplicate text from generic container wrappers', () => {
    const html = `
      <html><body>
        <div class="container">
          <main>
            <h1>Privacy Policy</h1>
            <section><div><p>We collect personal data for account services.</p></div></section>
          </main>
        </div>
      </body></html>`;
    const text = extractPolicyText(html);
    expect(text.match(/We collect personal data/g)?.length).toBe(1);
  });

  it('extracts only the addressed section when the source URL has a fragment', () => {
    const realisticPolicyText = 'We collect personal data and information for account services. Users have rights, consent choices, cookie controls, retention notices, GDPR processing details, third party disclosure terms, account access controls, service policy information, and legal agreement details. ';
    const html = `
      <html><body><article>
        <h2 id="privacy">Privacy Policy</h2>
        <p>${realisticPolicyText.repeat(4)}</p>
        <h2 id="terms">Terms of Service</h2>
        <p>This unrelated agreement section should not be part of the privacy capture.</p>
      </article></body></html>`;
    const text = extractPolicyText(html, 'https://example.com/legal#privacy');

    expect(text).toContain('## Privacy Policy');
    expect(text).toContain('We collect personal data');
    expect(text).not.toContain('Terms of Service');
    expect(text).not.toContain('unrelated agreement section');
  });
});

/* ------------------------------------------------------------------
   detectBlockPage / detectSoft404 / isPolicyContent
   ------------------------------------------------------------------ */

describe('detectBlockPage', () => {
  it('detects Cloudflare browser challenges', () => {
    expect(detectBlockPage(CLOUDFLARE_CHALLENGE)).toBe('captcha_challenge');
  });

  it('detects generic captcha walls', () => {
    expect(detectBlockPage('<html><body><div class="g-recaptcha"></div></body></html>')).toBe('captcha');
  });

  it('detects WAF access-denied pages', () => {
    expect(detectBlockPage('<html><body>Access Denied - you have been blocked</body></html>')).toBe('access_denied');
  });

  it('does NOT flag legitimate policy text mentioning captcha beyond the first 2000 chars', () => {
    const padding = '<p>lorem ipsum</p>'.repeat(150); // pushes the mention past 2000 chars
    const html = `<html><body>${padding}<p>We use reCAPTCHA to protect forms.</p></body></html>`;
    expect(detectBlockPage(html)).toBeNull();
  });

  it('returns null for a normal policy page', () => {
    expect(detectBlockPage(POLICY_HTML)).toBeNull();
  });
});

describe('detectSoft404', () => {
  it('detects short not-found templates (EN and IT)', () => {
    expect(detectSoft404(SOFT_404)).toBe(true);
    expect(detectSoft404(SOFT_404_IT)).toBe(true);
  });

  it('does not flag long pages that merely mention "not found"', () => {
    const long = `<html><body><p>${'word '.repeat(400)}</p><p>page not found handling is described here</p></body></html>`;
    expect(detectSoft404(long)).toBe(false);
  });

  it('does not flag a normal policy page', () => {
    expect(detectSoft404(POLICY_HTML)).toBe(false);
  });
});

describe('isPolicyContent', () => {
  it('accepts genuine policy text (at least 3 markers)', () => {
    expect(isPolicyContent(extractPolicyText(POLICY_HTML))).toBe(true);
  });

  it('rejects unrelated content', () => {
    expect(isPolicyContent('Breaking news: local sports team wins the championship again tonight.')).toBe(false);
  });
});

/* ------------------------------------------------------------------
   validateOutboundUrl (SSRF guard) - IP-literal cases need no DNS
   ------------------------------------------------------------------ */

describe('validateOutboundUrl', () => {
  it('rejects non-http(s) schemes', async () => {
    expect((await validateOutboundUrl('ftp://example.com/file')).ok).toBe(false);
    expect((await validateOutboundUrl('file:///etc/passwd')).ok).toBe(false);
  });

  it('rejects malformed URLs', async () => {
    const result = await validateOutboundUrl('not a url');
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.reason).toBe('malformed_url');
  });

  it('rejects embedded credentials', async () => {
    const result = await validateOutboundUrl('https://user:pass@example.com/policy');
    expect(result.ok === false && result.reason).toBe('blocked_url_credentials');
  });

  it('rejects localhost and private/loopback/link-local IPs', async () => {
    for (const url of [
      'http://localhost/admin',
      'http://sub.localhost/x',
      'http://127.0.0.1/x',
      'http://10.0.0.5/x',
      'http://172.16.1.1/x',
      'http://192.168.1.1/x',
      'http://169.254.169.254/latest/meta-data', // cloud metadata endpoint
      'http://[::1]/x',
      'http://[fd00::1]/x',
      'http://[fe90::1]/x',
      'http://[ff02::1]/x',
      'http://[2001:db8::1]/x',
    ]) {
      const result = await validateOutboundUrl(url);
      expect(result.ok, url).toBe(false);
    }
  });

  it('rejects non-standard loopback IP literal forms normalized by URL parsing', async () => {
    for (const url of [
      'http://0x7f000001/',
      'http://2130706433/',
      'http://127.1/',
      'http://%31%32%37.0.0.1/',
    ]) {
      const result = await validateOutboundUrl(url);
      expect(result.ok, url).toBe(false);
      expect(result.ok === false && result.finalUrl).toBe('http://127.0.0.1/');
    }
  });

  it('accepts public IP literals without DNS lookups', async () => {
    const result = await validateOutboundUrl('https://8.8.8.8/policy');
    expect(result.ok).toBe(true);
  });

  it('rejects hostnames when any DNS answer is private', async () => {
    const result = await validateOutboundUrl('https://mixed-private.example/policy');
    expect(result.ok === false && result.reason).toBe('blocked_private_address');
  });

  it('applies the same conservative policy to DNS-resolved IPv6 ranges', async () => {
    const rejected = await validateOutboundUrl('https://ipv6-doc.example/policy');
    const accepted = await validateOutboundUrl('https://ipv6-public.example/policy');

    expect(rejected.ok === false && rejected.reason).toBe('blocked_private_address');
    expect(accepted.ok).toBe(true);
  });
});

/* ------------------------------------------------------------------
   Archive freshness guard
   ------------------------------------------------------------------ */

describe('parseArchiveTimestamp', () => {
  it('parses full Wayback timestamps as UTC', () => {
    const date = parseArchiveTimestamp('20260615123045');
    expect(date?.toISOString()).toBe('2026-06-15T12:30:45.000Z');
  });

  it('parses date-only timestamps', () => {
    expect(parseArchiveTimestamp('20260615')?.toISOString()).toBe('2026-06-15T00:00:00.000Z');
  });

  it('returns null on garbage', () => {
    expect(parseArchiveTimestamp('not-a-ts')).toBeNull();
    expect(parseArchiveTimestamp('')).toBeNull();
  });
});

describe('isFreshEnough', () => {
  const lastCheck = new Date('2026-06-01T00:00:00Z');

  it('accepts snapshots newer than the last successful check', () => {
    expect(isFreshEnough('20260615120000', lastCheck)).toBe(true);
  });

  it('rejects snapshots older than the last successful check (stale-archive regression guard)', () => {
    expect(isFreshEnough('20251231235959', lastCheck)).toBe(false);
  });

  it('rejects missing timestamps when a bound is set', () => {
    expect(isFreshEnough(undefined, lastCheck)).toBe(false);
  });

  it('accepts anything when no bound is provided', () => {
    expect(isFreshEnough('19990101', undefined)).toBe(true);
    expect(isFreshEnough(undefined, undefined)).toBe(true);
  });
});

describe('hasLiveHostDrift', () => {
  it('allows same host redirects and www normalization', () => {
    expect(hasLiveHostDrift('https://example.com/privacy', 'https://www.example.com/privacy', 'direct')).toBe(false);
  });

  it('allows redirects between subdomains of the same registrable domain', () => {
    expect(hasLiveHostDrift('https://www.google.com/accounts/TOS', 'https://policies.google.com/terms', 'direct')).toBe(false);
  });

  it('rejects live redirects to another host', () => {
    expect(hasLiveHostDrift('https://example.com/privacy', 'https://example.net/', 'direct')).toBe(true);
  });

  it('does not apply host drift to archive sources', () => {
    expect(hasLiveHostDrift('https://example.com/privacy', 'https://web.archive.org/web/123/https://example.com/privacy', 'wayback')).toBe(false);
  });
});

describe('hasLivePathDrift', () => {
  it('rejects live redirects from a configured policy path to the homepage on the same host', () => {
    expect(hasLivePathDrift('https://stripe.com/us/privacy', 'https://stripe.com/', 'direct')).toBe(true);
  });

  it('does not reject equivalent paths or archive URLs', () => {
    expect(hasLivePathDrift('https://stripe.com/us/privacy', 'https://www.stripe.com/us/privacy/', 'direct')).toBe(false);
    expect(hasLivePathDrift('https://stripe.com/us/privacy', 'https://web.archive.org/web/123/https://stripe.com/', 'wayback')).toBe(false);
  });
});

describe('validateContent partial evidence', () => {
  it('marks over-cap extracted text as partial instead of silently treating it as complete', async () => {
    const repeated = 'We collect personal data, information, cookie consent, account rights, service policy, retention, disclosure, and GDPR processing. ';
    const html = `<html><body><main><h1>Privacy Policy</h1><p>${repeated.repeat(4500)}</p></main></body></html>`;

    const result = await validateContent(html);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.text.length).toBe(500_000);
      expect(result.partial).toBe(true);
      expect(result.partialReason).toBe('text_truncated_at_max_length');
      expect(result.originalTextLength).toBeGreaterThan(500_000);
    }
  });
});

describe('isCoherentHost', () => {
  it('allows identical hosts', () => {
    expect(isCoherentHost('example.com', 'example.com')).toBe(true);
  });

  it('allows subdomain relationships', () => {
    expect(isCoherentHost('example.com', 'privacy.example.com')).toBe(true);
    expect(isCoherentHost('privacy.example.com', 'example.com')).toBe(true);
  });

  it('allows matching root domains', () => {
    expect(isCoherentHost('sub1.example.com', 'sub2.example.com')).toBe(true);
    expect(isCoherentHost('privacy.company.co.uk', 'support.company.co.uk')).toBe(true);
    expect(isCoherentHost('service.github.io', 'cdn.service.github.io')).toBe(true);
  });

  it('rejects completely different domains', () => {
    expect(isCoherentHost('example.com', 'malicious.com')).toBe(false);
    expect(isCoherentHost('google.com', 'microsoft.com')).toBe(false);
    expect(isCoherentHost('company.co.uk', 'attacker.co.uk')).toBe(false);
    expect(isCoherentHost('service.github.io', 'attacker.github.io')).toBe(false);
    expect(isCoherentHost('service.github.io', 'github.io')).toBe(false);
  });
});

describe('resolveAndPinHostname IP resolution', () => {
  it('resolves public hostname to a pinned IP', async () => {
    const ip = await resolveAndPinHostname('public.example');
    expect(ip).toBe('93.184.216.34');
    expect(isIP(ip)).toBeGreaterThan(0);
  });

  it('rejects loopback/local hostnames', async () => {
    await expect(resolveAndPinHostname('localhost')).rejects.toThrow();
  });

  it('rejects private IP literals', async () => {
    await expect(resolveAndPinHostname('127.0.0.1')).rejects.toThrow('blocked_private_ip');
    await expect(resolveAndPinHostname('192.168.1.1')).rejects.toThrow('blocked_private_ip');
  });

  it('rejects hostnames if DNS returns any private address', async () => {
    await expect(resolveAndPinHostname('mixed-private.example')).rejects.toThrow('blocked_private_ip');
  });
});
