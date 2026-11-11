import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/pantry/barcode-lookup/route';
const lookup = vi.hoisted(() => vi.fn());
vi.mock('@/lib/barcodes/index.server', () => ({ lookupConfiguredBarcode: lookup }));
let counter = 0;
const request = (body: unknown, extra: Record<string, string> = {}) => new NextRequest('http://localhost/api/pantry/barcode-lookup', { method: 'POST', headers: { host: 'localhost', origin: 'http://localhost', 'x-forwarded-for': `198.51.100.${++counter}`, ...extra }, body: JSON.stringify(body) });
beforeEach(() => { vi.stubEnv('PANTRYBOT_PANTRY_ENABLED', 'true'); vi.stubEnv('PANTRYBOT_BARCODE_LOOKUP_ENABLED', 'true'); lookup.mockReset().mockResolvedValue({ status: 'NOT_FOUND', message: 'No applicable product.' }); });
afterEach(() => vi.unstubAllEnvs());
describe('bounded keyless public-product lookup API', () => {
  it('stays disabled by default and requires shared enforcement for production', async () => {
    vi.stubEnv('PANTRYBOT_BARCODE_LOOKUP_ENABLED', 'false');
    expect((await (await POST(request({ barcode: '036000291452' }))).json()).status).toBe('DISABLED');
    vi.stubEnv('PANTRYBOT_BARCODE_LOOKUP_ENABLED', 'true'); vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('PANTRYBOT_BARCODE_SHARED_LIMIT_VERIFIED', 'false');
    expect((await (await POST(request({ barcode: '036000291452' }))).json()).status).toBe('SERVICE_UNAVAILABLE');
    expect(lookup).not.toHaveBeenCalled();
  });
  it('validates before lookup, excludes caller source/owner settings and bounds bytes', async () => {
    for (const body of [{ barcode: 36000291452 }, { barcode: 'https://example.test/' }, { barcode: '036000291452', owner: 'account:other' }, { barcode: '036000291452', format: null }, { barcode: '0'.repeat(400) }]) {
      expect((await POST(request(body))).status).toBeGreaterThanOrEqual(400);
    }
    expect(lookup).not.toHaveBeenCalled();
  });
  it('accepts a validated string for guests/accounts without sending identity or caching scans', async () => {
    const response = await POST(request({ barcode: ' 036000291452 ' }));
    expect(response.status).toBe(200); expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(lookup).toHaveBeenCalledWith({ original: ' 036000291452 ', digits: '036000291452', key: '00036000291452', format: 'MANUAL' });
  });
  it('blocks cross-origin traffic and throttles a single IP', async () => {
    expect((await POST(request({ barcode: '036000291452' }, { origin: 'https://other.test' }))).status).toBe(403);
    let response!: Response;
    for (let i = 0; i < 31; i++) response = await POST(request({ barcode: '036000291452' }, { 'x-forwarded-for': '203.0.113.254' }));
    expect(response.status).toBe(429); expect(response.headers.get('Retry-After')).toBeTruthy();
  });
  it('bounds a stalled request stream before opening the index', async () => {
    vi.useFakeTimers();
    try {
      const body = new ReadableStream<Uint8Array>({ start() {} });
      const init = { method: 'POST', headers: { host: 'localhost', origin: 'http://localhost', 'x-forwarded-for': '203.0.113.253' }, body, duplex: 'half' as const };
      const pending = POST(new NextRequest('http://localhost/api/pantry/barcode-lookup', init));
      await vi.advanceTimersByTimeAsync(2001);
      expect((await pending).status).toBe(503); expect(lookup).not.toHaveBeenCalled();
    } finally { vi.useRealTimers(); }
  });
  it('turns index failures and oversized projections into recoverable service failures', async () => {
    lookup.mockRejectedValueOnce(new Error('/private/secret-path'));
    const response = await POST(request({ barcode: '036000291452' }));
    expect(response.status).toBe(503); expect(await response.text()).not.toContain('secret-path');
    lookup.mockResolvedValueOnce({ status: 'NOT_FOUND', message: 'x'.repeat(20000) });
    expect((await POST(request({ barcode: '036000291452' }))).status).toBe(503);
  });
});
