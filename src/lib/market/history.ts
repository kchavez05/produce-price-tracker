import type { PriceHistoryPoint, StoreOffer } from '@/types/domain';
import { CANONICAL_INGREDIENTS } from '@/data/canonical-ingredients';
import { currentAdCycle, isCurrentLiveOffer } from '@/lib/offer-freshness';
import { marketClient, asJson } from './client';
import { selectBenchmarks, parseBenchmarkRows } from '@/lib/usda/read';
import { hash } from '@/lib/usda/adapter';

export interface IngredientHistory {
  priceHistory: PriceHistoryPoint[]; sixWeekLocalAvg: number; sixWeekLow: number; sixWeekHigh: number; sixWeekMedian: number;
}
export const emptyHistory = (): IngredientHistory => ({ priceHistory: [], sixWeekLocalAvg: 0, sixWeekLow: 0, sixWeekHigh: 0, sixWeekMedian: 0 });
export function summarizeHistory(points: PriceHistoryPoint[]): IngredientHistory {
  const values = points.map((p) => p.bestLocalPrice).filter((n): n is number => n !== null && n > 0).sort((a, b) => a - b);
  const middle = Math.floor(values.length / 2);
  return { priceHistory: points, sixWeekLow: values[0] ?? 0, sixWeekHigh: values.at(-1) ?? 0,
    sixWeekMedian: values.length ? (values[middle] + values[Math.floor((values.length - 1) / 2)]) / 2 : 0,
    sixWeekLocalAvg: values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0 };
}
export async function archiveMarketOffers(offers: StoreOffer[], zip: string, now = new Date()) {
  const client = marketClient();
  if (!client) return 'local' as const;
  const rows = offers.filter((offer) => isCurrentLiveOffer(offer, now)).map((offer) => ({
    zip_code: zip, source: offer.source, source_offer_id: offer.id, ingredient_id: offer.canonicalIngredientId,
    store: offer.store, location_label: offer.storeLocationLabel, source_from: offer.validFrom, source_to: offer.validTo,
    observed_at: now.toISOString(), cycle: currentAdCycle(now).start,
    unit: CANONICAL_INGREDIENTS.find((i) => i.id === offer.canonicalIngredientId)?.standardUnit,
    normalized_price: offer.normalizedPricePerUnit,
    // An observation timestamp is not a price revision.
    content_hash: hash({ ...offer, observedAtIso: undefined }), payload: offer,
  }));
  if (!rows.length) return 'cloud' as const;
  try {
    const { error } = await client.rpc('archive_market_offers', { p_rows: asJson(rows) }).retry(false);
    if (error) throw error;
    return 'cloud' as const;
  } catch { console.error('market_history_archive_failed'); return 'unavailable' as const; }
}
export async function loadMarketHistory(zip: string, now = new Date()): Promise<{
  storage: 'cloud' | 'local' | 'unavailable'; histories: Record<string, IngredientHistory>;
}> {
  const client = marketClient();
  if (!client) return { storage: 'local', histories: {} };
  const end = currentAdCycle(now).start;
  const start = new Date(`${end}T12:00:00Z`); start.setUTCDate(start.getUTCDate() - 35);
  try {
    const [local, usda] = await Promise.all([
      client.rpc('read_market_history', { p_zip: zip, p_start: start.toISOString().slice(0, 10), p_end: end }).retry(false),
      client.rpc('read_usda_history', { p_start: start.toISOString().slice(0, 10), p_end: end }).retry(false),
    ]);
    const { data, error } = local;
    if (error || usda.error || !Array.isArray(usda.data) || !Array.isArray(data)) throw new Error('history_read_failed');
    const grouped = new Map<string, Map<string, PriceHistoryPoint>>();
    for (const row of data as { ingredient_id: string; cycle: string; store: string; price: number }[]) {
      const weeks = grouped.get(row.ingredient_id) ?? new Map<string, PriceHistoryPoint>();
      const point = weeks.get(row.cycle) ?? { weekStart: row.cycle, label: row.cycle, kingSoopersPrice: null, safewayPrice: null, usdaMountainAvg: null, bestLocalPrice: null };
      const price = Number(row.price);
      if (!Number.isFinite(price) || price <= 0) continue;
      if (row.store === 'KING_SOOPERS') point.kingSoopersPrice = price;
      if (row.store === 'SAFEWAY') point.safewayPrice = price;
      point.bestLocalPrice = point.bestLocalPrice !== null && point.bestLocalPrice > 0 ? Math.min(point.bestLocalPrice, price) : price;
      weeks.set(row.cycle, point); grouped.set(row.ingredient_id, weeks);
    }
    // Source periods remain distinct from retrieval weeks; select revisions before aligning to a display cycle.
    const sourceRows = parseBenchmarkRows(usda.data);
    for (const day of [...new Set(sourceRows.map((row) => row.period_end))].sort()) {
      const selection = selectBenchmarks(sourceRows.filter((row) => row.period_end === day), new Date(`${day}T23:59:59Z`));
      const week = currentAdCycle(new Date(`${day}T12:00:00Z`)).start;
      for (const [id, benchmark] of Object.entries(selection.overrides)) {
        const weeks = grouped.get(id) ?? new Map<string, PriceHistoryPoint>();
        const point = weeks.get(week) ?? { weekStart: week, label: week, kingSoopersPrice: null, safewayPrice: null, usdaMountainAvg: null, bestLocalPrice: null };
        const provenance = selection.provenance[id];
        point.usdaBenchmarkAvg = benchmark.mountainBaseline ?? null;
        point.usdaMountainAvg = provenance.region === 'MOUNTAIN' ? point.usdaBenchmarkAvg : null;
        point.usdaRegion = provenance.region; point.usdaPeriodEnd = day; point.usdaVersionId = provenance.versionId;
        weeks.set(week, point); grouped.set(id, weeks);
      }
    }
    return { storage: 'cloud', histories: Object.fromEntries([...grouped].map(([id, weeks]) => [id, summarizeHistory([...weeks.values()].sort((a, b) => a.weekStart.localeCompare(b.weekStart)))])) };
  } catch { return { storage: 'unavailable', histories: {} }; }
}
