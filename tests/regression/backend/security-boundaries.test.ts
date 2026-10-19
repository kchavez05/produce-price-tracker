import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as postFreezer, PATCH as patchFreezer } from '@/app/api/freezer/route';
import { POST as postSync } from '@/app/api/sync/route';
import { POST as postAccount, DELETE as deleteAccount } from '@/app/api/account/route';
import { resetSqliteTestInstance } from '@/lib/db/sqlite';

function createCrossOriginRequest(
  url: string,
  method: string,
  body?: any
): NextRequest {
  const headers = new Headers({
    host: 'pantrybot.dev',
    origin: 'https://evil-spoofed-origin.com',
    'content-type': 'application/json',
  });
  return new NextRequest(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('regression: security-boundaries & CSRF protection', () => {
  beforeEach(() => {
    process.env.PANTRYBOT_SQLITE_PATH = ':memory:';
    resetSqliteTestInstance();
  });

  afterAll(() => {
    resetSqliteTestInstance();
  });

  it('rejects cross-origin POST /api/freezer with 403 Forbidden', async () => {
    const req = createCrossOriginRequest('http://pantrybot.dev/api/freezer', 'POST', {
      item: { id: 'test' },
    });
    const res = await postFreezer(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toContain('Forbidden');
  });

  it('rejects cross-origin PATCH /api/freezer with 403 Forbidden', async () => {
    const req = createCrossOriginRequest('http://pantrybot.dev/api/freezer', 'PATCH', {
      id: 'test',
      quantityLbOrDoz: 1,
    });
    const res = await patchFreezer(req);
    expect(res.status).toBe(403);
  });

  it('rejects cross-origin POST /api/sync with 403 Forbidden', async () => {
    const req = createCrossOriginRequest('http://pantrybot.dev/api/sync', 'POST', {
      preferences: {},
    });
    const res = await postSync(req);
    expect(res.status).toBe(403);
  });

  it('rejects cross-origin POST /api/account with 403 Forbidden', async () => {
    const req = createCrossOriginRequest('http://pantrybot.dev/api/account', 'POST', {
      action: 'SIGN_IN_LOCAL',
    });
    const res = await postAccount(req);
    expect(res.status).toBe(403);
  });

  it('rejects cross-origin DELETE /api/account with 403 Forbidden', async () => {
    const req = createCrossOriginRequest('http://pantrybot.dev/api/account', 'DELETE');
    const res = await deleteAccount(req);
    expect(res.status).toBe(403);
  });

  it('enforces rate limits on repeated bursts and returns 429 with Retry-After header', async () => {
    // api-account-delete has a strict rate limit of 5 per minute
    const makeDeleteReq = () =>
      new NextRequest('http://localhost:3000/api/account', {
        method: 'DELETE',
        headers: {
          host: 'localhost:3000',
          origin: 'http://localhost:3000',
          'x-forwarded-for': '198.51.100.99',
        },
      });

    // Make 5 requests (reaching the limit)
    for (let i = 0; i < 5; i++) {
      await deleteAccount(makeDeleteReq());
    }

    // 6th request must be blocked with 429
    const blockedRes = await deleteAccount(makeDeleteReq());
    expect(blockedRes.status).toBe(429);
    expect(blockedRes.headers.get('Retry-After')).toBeTruthy();
  });
});
