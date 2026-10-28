import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseExplorerQuery, ExplorerError } from '@/lib/explorer/query';
import {
  historyPoints,
  archiveRows,
  filterRows,
  deriveData,
  currentOfferRevisions,
  latestReports,
} from '@/lib/explorer/derive';
import { publicSourceRow, publicReport } from '@/lib/explorer/public-fields';
import { rowsCsv } from '@/lib/explorer/csv';
import { parseReport, validateConfig } from '@/lib/usda/adapter';
import { calculateValueScore, discountPercent } from '@/lib/value-score';
import { scoreAllCommodities } from '@/lib/scoring-and-matcher';
import { CANONICAL_INGREDIENTS } from '@/data/canonical-ingredients';
import { ALL_WEEKLY_BASELINE_OFFERS } from '@/data/mead-baseline-offers';
import type { Archive, ExplorerOffer } from '@/lib/explorer/types';
import type { PriceHistoryPoint } from '@/types/domain';
const now = new Date('2026-10-28T21:00:00Z');
const query = (patch: Record<string, string> = {}) =>
  parseExplorerQuery(
    new URLSearchParams({
      ingredient: 'chicken-thighs-boneless',
      start: '2026-10-01',
      end: '2026-10-28',
      ...patch,
    }),
    now
  );
const base = ALL_WEEKLY_BASELINE_OFFERS.find(
  (o) => o.canonicalIngredientId === 'chicken-thighs-boneless'
)!;
const offer = (id = 1, price = 2): ExplorerOffer => ({
  id,
  zip_code: '80542',
  source: 'FLIPP_LIVE',
  source_offer_id: 'same-offer',
  ingredient_id: base.canonicalIngredientId,
  store: 'TARGET',
  location_label: 'Test market',
  source_from: '2026-10-21',
  source_to: '2026-10-27',
  cycle: '2026-10-21',
  unit: 'lb',
  normalized_price: price,
  payload: {
    ...base,
    id: String(id),
    source: 'FLIPP_LIVE',
    store: 'TARGET',
    normalizedPricePerUnit: price,
  },
  retrieved_at: '2026-10-25T12:00:00Z',
  receipt_id: id,
  receipt_count: 1,
  receipts: [{ id, retrieved_at: '2026-10-25T12:00:00Z' }],
});
const archive = (offers: ExplorerOffer[] = []): Archive => ({
  reports: [],
  observations: [],
  offers,
});
describe('explorer queries and public projection', () => {
  it('rejects invalid or unbounded filters and expired snapshots', () => {
    for (const patch of [
      { zip: 'x' },
      { ingredient: 'private-inventory' },
      { start: '2026-01-01' },
      { end: '2026-02-31' },
      { stores: 'UNKNOWN' },
      { dataset: 'users' },
      { sort: 'payload' },
      { asof: '2020-01-01' },
      { page: '-1' },
      { source: 'OTHER' },
      { region: 'OTHER' },
    ] as Record<string, string>[])
      expect(() => query(patch)).toThrow(ExplorerError);
    expect(query({ start: '2026-08-06' }).start).toBe('2026-08-06');
  });
  it('publishes only audited source fields, including unmapped commodities', () => {
    expect(
      publicSourceRow({
        commodity: 'Unknown commodity',
        price_avg: 3,
        api_key: 'secret',
        user_id: 'private',
        authorization: 'bearer',
        nested: { secret: 1 },
      })
    ).toEqual({ commodity: 'Unknown commodity', price_avg: 3 });
    const projected = publicReport([
      {
        reportSection: 'Report Details',
        results: [{ commodity: 'Unmapped', store_count: 4, token: 'secret' }],
        secret: 'private',
      },
    ]);
    expect(projected[0].results).toEqual([
      { commodity: 'Unmapped', store_count: 4 },
    ]);
  });
  it('escapes CSV delimiters and neutralizes spreadsheet formulas in text fields', () => {
    const rows = archiveRows(
      archive([offer()]),
      query({ dataset: 'offers' }),
      'verified'
    );
    rows[0].variety = ' =HYPERLINK("bad")';
    rows[0].store = 'Target, "test"';
    const csv = rowsCsv(rows);
    expect(csv).toContain('"\' =HYPERLINK(""bad"")"');
    expect(csv).toContain('"Target, ""test"""');
    expect(csv).toContain('\r\n');
  });
});
describe('explorer history and revisions', () => {
  it('uses latest retrieval, including a return to an earlier price, for every store', () => {
    const a = offer(1, 2);
    const b = offer(2, 3);
    const c = { ...a, receipt_id: 3, retrieved_at: '2026-10-26T12:00:00Z' };
    expect(currentOfferRevisions([b, c])[0].normalized_price).toBe(2);
    const points = historyPoints(archive([b, c]), query());
    expect(points).toHaveLength(1);
    expect(points[0]).toMatchObject({
      series: 'TARGET',
      price: 2,
      ids: ['offer:1'],
    });
    expect(
      archiveRows(
        archive([b, c]),
        query({ dataset: 'offers' }),
        'verified'
      ).find((r) => r.version === '2')?.status
    ).toBe('superseded');
  });
  it('does not fill missing local weeks or manufacture USDA observations', () => {
    const data = deriveData(archive([offer()]), query(), 'verified');
    expect(data.coverage.localWeeks).toBe(1);
    expect(data.coverage.usdaPeriods).toBe(0);
    expect(data.points).toHaveLength(1);
    expect(data.score?.commodity.cycleSignal?.badgeLabel).toContain(
      'fewer than six weeks'
    );
    expect(() =>
      deriveData(
        archive([offer(2)]),
        query({ snapshot: data.snapshot }),
        'verified'
      )
    ).toThrow('snapshot changed');
  });
  it('matches filtered export ordering with stable ties and allows revision inspection', () => {
    const rows = archiveRows(
      archive([offer(1, 2), { ...offer(2, 3), source_offer_id: 'different' }]),
      query({ dataset: 'offers' }),
      'verified'
    );
    expect(
      filterRows(
        rows,
        query({ dataset: 'offers', sort: 'price', direction: 'asc' })
      ).map((r) => r.price)
    ).toEqual([2, 3]);
    expect(
      filterRows(rows, query({ dataset: 'offers', row: 'offer:2' }))
    ).toHaveLength(1);
  });
  it('normalizes actual fixture packages and exposes weighted benchmark contributors', () => {
    const definition = JSON.parse(
      readFileSync('config/usda/3324.json', 'utf8')
    );
    const config = validateConfig(definition.config);
    const payload = JSON.parse(
      readFileSync('tests/fixtures/usda/3324.json', 'utf8')
    );
    const parsed = parseReport(payload, config, now)[0];
    for (const row of parsed.rows)
      expect(row.value).toBeCloseTo(
        Number(row.original[config.fields.price]) *
          config.units[String(row.original[config.fields.unit])].multiplier
      );
    const ingredient = parsed.rows[0].ingredient_id;
    const report = {
      id: 'a',
      slug: '3324',
      title: 'Fixture',
      ...parsed,
      fetched_at: '2026-10-24T12:00:00Z',
      validation: 'usable',
      accepted: true,
      active: true,
      config,
    };
    const source: Archive = {
      reports: [report],
      observations: parsed.rows
        .filter((r) => r.ingredient_id === ingredient)
        .map((row) => ({
          ...row,
          version_id: 'a',
          mapping_version: config.adapterVersion,
        })),
      offers: [],
    };
    const q = query({ ingredient });
    const points = historyPoints(source, q);
    expect(points).toHaveLength(1);
    const observations = source.observations;
    const total = observations.reduce(
      (n, o) => n + Number(o.original.store_count),
      0
    );
    expect(points[0].price).toBeCloseTo(
      observations.reduce(
        (n, o) => n + o.value * Number(o.original.store_count),
        0
      ) / total
    );
    expect(points[0].ids).toHaveLength(observations.length);
    const newer = { ...report, id: 'b', published_at: '2026-10-24T13:00:00' };
    source.reports.push(newer);
    expect(latestReports(source.reports).has('b')).toBe(true);
  });
});
describe('shared score trace and truthful cycle badge', () => {
  it('reproduces dashboard component scores and guards invalid denominators', () => {
    const ingredient = CANONICAL_INGREDIENTS.find(
      (i) => i.id === base.canonicalIngredientId
    )!;
    const normal = {
      ...ingredient,
      usdaSignal: { ...ingredient.usdaSignal, trend: 'STABLE' as const },
    };
    const trace = calculateValueScore(normal, 2, 4);
    const scored = scoreAllCommodities(
      [
        {
          ...base,
          source: 'FLIPP_LIVE',
          normalizedPricePerUnit: 2,
          regularPricePerUnit: 4,
        },
      ],
      'ALL',
      {},
      undefined,
      {}
    )[0];
    expect(scored.valueScore).toBe(trace.valueScore);
    expect(trace.contributions[2]).toBe(6);
    for (const n of [0, -1, NaN, Infinity])
      expect(discountPercent(n, 2)).toBe(0);
    expect(discountPercent(1, 2)).toBe(-100);
    expect(() => calculateValueScore(normal, NaN, 4)).toThrow();
    for (const [category, low, high, endScore] of [
      ['PROTEIN', 1.25, 8, 12],
      ['PRODUCE', 0.6, 3.8, 15],
      ['DAIRY_EGGS', 1.6, 5, 20],
    ] as const) {
      expect(
        calculateValueScore({ ...normal, category }, low, 4).affordabilityScore
      ).toBe(100);
      expect(
        calculateValueScore({ ...normal, category }, high, 4).affordabilityScore
      ).toBe(endScore);
    }
  });
  it('does not label a deep discount above the observed low as a six-week low', () => {
    const history: PriceHistoryPoint[] = Array.from(
      { length: 6 },
      (_, index) => ({
        weekStart: `2026-09-${String(index + 1).padStart(2, '0')}`,
        label: 'fixture',
        kingSoopersPrice: 1,
        safewayPrice: null,
        usdaMountainAvg: null,
        bestLocalPrice: 1,
      })
    );
    const offer = {
      ...base,
      source: 'FLIPP_LIVE' as const,
      normalizedPricePerUnit: 2,
      regularPricePerUnit: 5,
    };
    const scored = scoreAllCommodities([offer], 'ALL', {}, undefined, {
      [base.canonicalIngredientId]: {
        priceHistory: history,
        sixWeekLocalAvg: 1,
        sixWeekLow: 1,
        sixWeekHigh: 1,
        sixWeekMedian: 1,
      },
    })[0];
    expect(scored.cycleSignal?.status).not.toBe('STOCK_UP_6WK_LOW');
    expect(scored.cycleSignal?.badgeLabel).toContain('Deep discount');
    const low = scoreAllCommodities(
      [{ ...offer, normalizedPricePerUnit: 1 }],
      'ALL',
      {},
      undefined,
      {
        [base.canonicalIngredientId]: {
          priceHistory: history,
          sixWeekLocalAvg: 1,
          sixWeekLow: 1,
          sixWeekHigh: 1,
          sixWeekMedian: 1,
        },
      }
    )[0];
    expect(low.cycleSignal?.status).toBe('STOCK_UP_6WK_LOW');
  });
  it('removes sweet and red onions from the cooking-onion matcher and bag-only label', () => {
    const onion = CANONICAL_INGREDIENTS.find(
      (i) => i.id === 'yellow-white-onions'
    )!;
    expect(onion.name).not.toContain('3 lb');
    expect(onion.matchKeywords).not.toContain('sweet onions');
    expect(onion.excludeKeywords).toContain('sweet onions');
    expect(onion.excludeKeywords).toContain('red onions');
  });
});
