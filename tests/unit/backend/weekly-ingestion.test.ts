import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildDashboardPayload } from '@/lib/scoring-and-matcher';
import { resetSqliteTestInstance } from '@/lib/db/sqlite';

const now = new Date('2026-10-27T18:00:00Z');

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(now);
  vi.stubEnv('PANTRYBOT_SQLITE_PATH', ':memory:');
  vi.stubEnv('SUPABASE_SECRET_KEY', '');
  vi.stubEnv('KROGER_CLIENT_ID', '');
  vi.stubEnv('USDA_MARS_API_KEY', '');
  resetSqliteTestInstance();
});
afterEach(() => { resetSqliteTestInstance(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.useRealTimers(); });

describe('weekly ingestion through dashboard scoring', () => {
  it('retains successful merchants when another times out and excludes stale cheap specials', async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      if (String(input).includes('q=King%20Soopers')) throw new Error('merchant timeout');
      return Response.json({ items: [
        { id: 1, name: 'Boneless chicken thighs per lb', current_price: 2.99, merchant_name: 'Safeway', valid_from: '2026-10-21T04:00:00Z', valid_to: '2026-10-28T03:59:59Z' },
        { id: 2, name: 'Boneless chicken thighs per lb', current_price: 0.99, merchant_name: 'Safeway', valid_from: '2026-10-14', valid_to: '2026-10-20' },
      ] });
    });
    vi.stubGlobal('fetch', fetchMock);
    const data = await buildDashboardPayload();
    const chicken = data.commodities.find((c) => c.ingredient.id === 'chicken-thighs-boneless')!;
    expect(chicken.bestOffer.source).toBe('FLIPP_LIVE');
    expect(chicken.bestOffer.normalizedPricePerUnit).toBe(2.99);
    expect(data.freshness?.usableLiveOffers).toBe(1);
    expect(data.freshness?.sourceOfferCounts.flipp).toBe(1);
    expect(chicken.priceHistory.some((week) => week.weekStart === '2026-10-21' && week.safewayPrice === 2.99)).toBe(true);
    expect(data.adCycleLabel).toContain('Oct 21');
    expect(fetchMock.mock.calls.length).toBe(8);
  });

  it('keeps a complete deterministic dashboard when every source fails, without claiming live freshness', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const first = await buildDashboardPayload();
    const second = await buildDashboardPayload();
    expect(first.recommendedTrio).toHaveLength(3);
    expect(first.freshness?.liveRetrievedAtIso).toBeNull();
    expect(first.freshness?.usableLiveOffers).toBe(0);
    expect(first.splurgeAlerts).toHaveLength(0);
    expect(first.commodities.every((c) => !c.arbitragePrompt?.eligible && c.cycleSignal?.status !== 'STOCK_UP_6WK_LOW')).toBe(true);
    expect(first.dataSourcesActive.flippLive).toBe(false);
    expect(first.commodities.every((c) => c.bestOffer.rawPriceText.includes('Historical estimate'))).toBe(true);
    expect(first.commodities.map((c) => c.bestOffer.salePrice)).toEqual(second.commodities.map((c) => c.bestOffer.salePrice));
  });
});
