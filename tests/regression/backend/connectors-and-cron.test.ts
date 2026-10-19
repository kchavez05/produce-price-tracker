import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getWeeklySync, POST as postWeeklySync } from '@/app/api/cron/weekly-sync/route';
import { resetSqliteTestInstance } from '@/lib/db/sqlite';

function createRequest(url: string, options: { method?: string; body?: any } = {}): NextRequest {
  const method = options.method || 'GET';
  const headers = new Headers({
    host: 'localhost:3000',
    origin: 'http://localhost:3000',
    'content-type': 'application/json',
  });
  return new NextRequest(url, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
}

describe('regression: weekly cron sync and notifications', () => {
  beforeEach(() => {
    process.env.PANTRYBOT_SQLITE_PATH = ':memory:';
    resetSqliteTestInstance();
  });

  afterAll(() => {
    resetSqliteTestInstance();
  });

  it('executes weekly circular sync via GET and generates smart notifications & markdown digest', async () => {
    const req = createRequest(
      'http://localhost:3000/api/cron/weekly-sync?cycle=2026-10-14-cron-test&zip=80542&record=true'
    );

    const res = await getWeeklySync(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.cycle).toBe('2026-10-14-cron-test');
    expect(data.syncedOffersCount).toBeGreaterThan(0);

    // Verify smart push notifications generated
    expect(Array.isArray(data.smartPushNotifications)).toBe(true);
    expect(data.smartPushNotifications.length).toBeGreaterThan(0);
    const triggers = data.smartPushNotifications.map((n: any) => n.triggerType);
    expect(triggers).toContain('FRIDAY_PREP_DIGEST');

    // Verify Friday weekend digest with markdown
    expect(data.fridayWeekendDigest).toBeDefined();
    expect(data.fridayWeekendDigest.markdownDigest).toContain('Weekend Meal-Prep Digest');
    expect(data.fridayWeekendDigest.topValueCommodities.length).toBeGreaterThan(0);

    // Verify recent sync runs recorded in SQLite
    expect(Array.isArray(data.recentSyncRuns)).toBe(true);
    expect(data.recentSyncRuns.some((r: any) => r.cycle === '2026-10-14-cron-test')).toBe(true);
  });

  it('triggers manual sync via POST', async () => {
    const req = createRequest('http://localhost:3000/api/cron/weekly-sync', {
      method: 'POST',
      body: {
        cycle: 'manual-trigger-test',
        zipCode: '80542',
      },
    });

    const res = await postWeeklySync(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.cycle).toBe('manual-trigger-test');
  });
});
