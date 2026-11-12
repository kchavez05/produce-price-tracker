import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import {
  checkRateLimit,
  getClientIp,
  getSecureCookieOptions,
  sanitizeRedirectPath,
  verifySameOrigin,
} from '@/lib/security/rate-limit';

function createMockRequest(options: {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
}): NextRequest {
  const url = options.url || 'http://localhost:3000/api/test';
  const method = options.method || 'GET';
  const headers = new Headers(options.headers || {});
  return new NextRequest(url, { method, headers });
}

describe('rate-limit-security: getClientIp', () => {
  it('extracts client IP from x-forwarded-for header', () => {
    const req = createMockRequest({
      headers: { 'x-forwarded-for': '203.0.113.195, 70.41.3.18' },
    });
    expect(getClientIp(req)).toBe('203.0.113.195');
  });

  it('extracts client IP from x-real-ip header if x-forwarded-for is missing', () => {
    const req = createMockRequest({
      headers: { 'x-real-ip': '198.51.100.4' },
    });
    expect(getClientIp(req)).toBe('198.51.100.4');
  });

  it('falls back to 127.0.0.1 when no proxy headers are present', () => {
    const req = createMockRequest({});
    expect(getClientIp(req)).toBe('127.0.0.1');
  });
});

describe('rate-limit-security: checkRateLimit', () => {
  it('allows requests within the limit and decrements remaining', () => {
    const req = createMockRequest({
      headers: { 'x-real-ip': '10.0.0.1' },
    });
    const scope = 'dashboard';

    const r1 = checkRateLimit(req, scope, 5, 10_000);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(4);

    const r2 = checkRateLimit(req, scope, 5, 10_000);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(3);
  });

  it('caps distinct identities without evicting active counters and recovers after expiry', async () => {
    vi.resetModules();
    const { checkRateLimit: bounded } = await import('@/lib/security/rate-limit');
    const clock = vi.spyOn(Date, 'now').mockReturnValue(10_000);
    const req = createMockRequest({});
    try {
      const admitted = Array.from({ length: 5000 }, (_, i) => bounded(req, 'barcode-lookup', 1, 60_000, `client-${i}`)).filter((result) => result.allowed);
      expect(admitted.length).toBeGreaterThan(0); expect(admitted.length).toBeLessThanOrEqual(5000);
      const iteration = vi.spyOn(Map.prototype, Symbol.iterator);
      let rejected: ReturnType<typeof bounded>[] = []; let scans = 0;
      try {
        rejected = Array.from({ length: 100 }, (_, i) => bounded(req, 'barcode-lookup', 1, 60_000, `extra-${i}`));
        scans = iteration.mock.calls.length;
      } finally { iteration.mockRestore(); }
      expect(scans).toBe(0);
      for (const result of rejected) expect(result).toMatchObject({ allowed: false, remaining: 0, resetInSeconds: 60 });
      expect(bounded(req, 'barcode-lookup', 1, 60_000, 'client-0').allowed).toBe(false);
      // A saturated public scope cannot consume another route's client slots.
      expect(bounded(req, 'auth-callback', 2, 60_000, 'legitimate-client').allowed).toBe(true);
      expect(bounded(req, 'api-account-auth', 2, 60_000, 'legitimate-client').allowed).toBe(true);
      clock.mockReturnValue(70_001);
      expect(bounded(req, 'barcode-lookup', 1, 60_000, 'new-client').allowed).toBe(true);
      expect(bounded(req, 'barcode-lookup', 1, 60_000, 'client-0').allowed).toBe(true);
    } finally { clock.mockRestore(); }
  });

  it('blocks requests once limit is exceeded', () => {
    const req = createMockRequest({
      headers: { 'x-real-ip': '10.0.0.2' },
    });
    const scope = 'api-account-delete';

    for (let i = 0; i < 3; i++) {
      checkRateLimit(req, scope, 3, 10_000);
    }

    const rBlocked = checkRateLimit(req, scope, 3, 10_000);
    expect(rBlocked.allowed).toBe(false);
    expect(rBlocked.remaining).toBe(0);
    expect(rBlocked.resetInSeconds).toBeGreaterThan(0);
  });
});

describe('rate-limit-security: verifySameOrigin', () => {
  it('allows safe HTTP methods (GET, HEAD, OPTIONS)', () => {
    expect(verifySameOrigin(createMockRequest({ method: 'GET' }))).toBe(true);
    expect(verifySameOrigin(createMockRequest({ method: 'HEAD' }))).toBe(true);
    expect(verifySameOrigin(createMockRequest({ method: 'OPTIONS' }))).toBe(true);
  });

  it('allows state-mutating requests when Origin matches Host', () => {
    const req = createMockRequest({
      method: 'POST',
      headers: {
        host: 'pantrybot.dev',
        origin: 'https://pantrybot.dev',
      },
    });
    expect(verifySameOrigin(req)).toBe(true);
  });

  it('blocks state-mutating requests when Origin does not match Host', () => {
    const req = createMockRequest({
      method: 'POST',
      headers: {
        host: 'pantrybot.dev',
        origin: 'https://malicious-site.com',
      },
    });
    expect(verifySameOrigin(req)).toBe(false);
  });
});

describe('rate-limit-security: sanitizeRedirectPath', () => {
  it('allows valid relative internal paths', () => {
    expect(sanitizeRedirectPath('/')).toBe('/');
    expect(sanitizeRedirectPath('/terms')).toBe('/terms');
    expect(sanitizeRedirectPath('/privacy')).toBe('/privacy');
    expect(sanitizeRedirectPath('/?tab=leaderboard')).toBe('/?tab=leaderboard');
  });

  it('rejects protocol-relative URLs (open redirect)', () => {
    expect(sanitizeRedirectPath('//attacker.com')).toBe('/');
    expect(sanitizeRedirectPath('//google.com/phish')).toBe('/');
  });

  it('rejects backslash bypasses', () => {
    expect(sanitizeRedirectPath('/\\attacker.com')).toBe('/');
  });

  it('falls back to / on null, empty, or undefined', () => {
    expect(sanitizeRedirectPath(null)).toBe('/');
    expect(sanitizeRedirectPath(undefined)).toBe('/');
    expect(sanitizeRedirectPath('')).toBe('/');
    expect(sanitizeRedirectPath('   ')).toBe('/');
  });
});

describe('rate-limit-security: getSecureCookieOptions', () => {
  it('configures strict HttpOnly, SameSite=Lax, and root path', () => {
    const opts = getSecureCookieOptions();
    expect(opts.httpOnly).toBe(true);
    expect(opts.sameSite).toBe('lax');
    expect(opts.path).toBe('/');
    expect(opts.maxAge).toBeGreaterThan(0);
  });
});
