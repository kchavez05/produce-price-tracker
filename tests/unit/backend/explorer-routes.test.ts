import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/data/[view]/route';
import { readArchive, readReport } from '@/lib/explorer/read';
import { readFileSync } from 'node:fs';
import { publicReport, belongsToReport } from '@/lib/explorer/public-fields';
import { validateConfig, parseReport } from '@/lib/usda/adapter';
vi.mock('@/lib/explorer/read', () => ({
  readArchive: vi.fn(),
  readReport: vi.fn(),
}));
const config = validateConfig(
  JSON.parse(readFileSync('config/usda/3324.json', 'utf8')).config
);
const payload = JSON.parse(
  readFileSync('tests/fixtures/usda/3324.json', 'utf8')
);
const parsed = parseReport(
  payload,
  config,
  new Date('2026-10-28T12:00:00Z')
)[0];
const version = '00000000-0000-0000-0000-000000000001';
const report = {
  id: version,
  slug: '3324',
  title: 'Fixture',
  period_start: parsed.period_start,
  period_end: parsed.period_end,
  published_at: parsed.published_at,
  fetched_at: '2026-10-28T12:00:00Z',
  adapter_version: config.adapterVersion,
  validation: 'usable',
  accepted: true,
  active: true,
  config,
};
const get = (view: string, p = '') =>
  GET(
    new NextRequest(
      `http://localhost/api/data/${view}?ingredient=yellow-white-onions&start=2026-10-01&end=2026-10-28&dataset=original&${p}`
    ),
    { params: Promise.resolve({ view }) }
  );
function setup(rows: Record<string, unknown>[]) {
  vi.mocked(readArchive).mockResolvedValue({
    archive: { reports: [report], observations: [], offers: [] },
    mode: 'verified',
    asof: new Date().toISOString(),
  });
  vi.mocked(readReport).mockResolvedValue({
    ...report,
    representation: 'Sanitized public source projection.',
    attribution: 'U.S. Department of Agriculture',
    source: 'https://mymarketnews.ams.usda.gov',
    payload: publicReport([{ reportSection: 'Report Details', results: rows }]),
  });
}
describe('original report rows and export contracts', () => {
  it('paginates all commodities and unmapped rows and exports the identical ordering', async () => {
    const original = publicReport(parsed.payload)[0].results[0];
    const rows = Array.from({ length: 105 }, (_, i) => ({
      ...original,
      commodity: `Unmapped commodity ${i}`,
      variety: `Test ${i}`,
    }));
    setup(rows);
    const response = await get('rows');
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.total).toBe(105);
    expect(body.rows).toHaveLength(100);
    expect(
      body.rows.every(
        (r: { ingredient: string }) => r.ingredient === 'unmapped'
      )
    ).toBe(true);
    const page = await get('rows', 'page=1');
    expect((await page.json()).rows).toHaveLength(5);
    const csv = await get('export');
    expect(csv.status).toBe(200);
    const text = await csv.text();
    expect(text.split('\r\n')).toHaveLength(107);
    expect(text).toContain(body.rows[0].id);
  });
  it('does not silently truncate over-limit exports', async () => {
    const original = publicReport(parsed.payload)[0].results[0];
    setup(
      Array.from({ length: 10001 }, (_, i) => ({
        ...original,
        commodity: `Unmapped ${i}`,
      }))
    );
    const response = await get('export');
    expect(response.status).toBe(413);
    expect((await response.json()).error).toContain('Narrow');
  });
  it('keeps other periods and revisions in the envelope out of a selected version’s table', async () => {
    const original = publicReport(parsed.payload)[0].results[0];
    expect(belongsToReport(original, config, report)).toBe(true);
    const other = {
      ...original,
      [config.fields.publishedAt]: '10/01/2026 12:00:00',
    };
    expect(belongsToReport(other, config, report)).toBe(false);
    setup([original, other]);
    expect((await (await get('rows')).json()).total).toBe(1);
  });
});
