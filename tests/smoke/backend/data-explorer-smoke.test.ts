import { describe, it, expect, vi, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/data/[view]/route';
const get = (view: string, params = '') =>
  GET(
    new NextRequest(`http://localhost/api/data/${view}?mode=demo&${params}`),
    { params: Promise.resolve({ view }) }
  );
afterEach(() => vi.unstubAllEnvs());
describe('public data explorer API', () => {
  it('works without credentials, sessions, provider calls, or source fabrication', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('SUPABASE_SECRET_KEY', '');
    const history = await get('history');
    expect(history.status).toBe(200);
    const data = await history.json();
    expect(data.mode).toBe('demo');
    expect(data.points.length).toBeGreaterThan(0);
    expect(data.reports).toHaveLength(0);
    const rows = await get(
      'rows',
      `dataset=offers&asof=${encodeURIComponent(data.asof)}&snapshot=${data.snapshot}`
    );
    expect(rows.status).toBe(200);
    const records = await rows.json();
    expect(records.total).toBeGreaterThan(0);
    expect(records.rows[0].status).toBe('synthetic_demo');
    const csv = await get(
      'export',
      `dataset=offers&asof=${encodeURIComponent(data.asof)}&snapshot=${data.snapshot}`
    );
    expect(csv.status).toBe(200);
    expect(csv.headers.get('content-type')).toContain('text/csv');
    expect(csv.headers.get('X-Export-Metadata')).toContain('demo');
    expect(await csv.text()).toContain('synthetic_demo');
    const score = await get('score');
    expect(score.status).toBe(200);
    expect((await score.json()).score.trace.policyVersion).toBe('1.5.1');
    const calculated = await get('rows', 'dataset=calculated');
    const scoreRow = (await calculated.json()).rows.find(
      (r: { source: string }) => r.source === 'PANTRYBOT'
    );
    expect(scoreRow.details.trace.policyVersion).toBe('1.5.1');
    const catalog = await get('catalog');
    expect(catalog.status).toBe(200);
    expect((await catalog.json()).ingredients.length).toBeGreaterThan(20);
    const original = await get('rows', 'dataset=original');
    expect((await original.json()).rows).toHaveLength(0);
    expect((await get('report', 'version=demo-test')).status).toBe(400);
  });
  it('rejects invalid datasets, private IDs, expired snapshots, and changed snapshots', async () => {
    expect((await get('users')).status).toBe(404);
    expect((await get('rows', 'dataset=profiles')).status).toBe(400);
    expect((await get('history', 'zip=bad')).status).toBe(400);
    expect((await get('rows', 'dataset=offers&snapshot=changed')).status).toBe(
      409
    );
  });
});
