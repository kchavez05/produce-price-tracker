import { CANONICAL_INGREDIENTS } from '@/data/canonical-ingredients';
import { ALL_WEEKLY_BASELINE_OFFERS } from '@/data/mead-baseline-offers';
import type { ExplorerQuery } from './query';
import type { Archive } from './types';
import { currentAdCycle } from '@/lib/offer-freshness';
/** Deterministic scenarios, isolated from production verified series. No synthetic USDA claim. */
export function demoArchive(query: ExplorerQuery): Archive {
  const ingredient = CANONICAL_INGREDIENTS.find(
    (i) => i.id === query.ingredient
  )!;
  const archive: Archive = { reports: [], observations: [], offers: [] };
  const end = new Date(`${query.end}T12:00:00Z`);
  for (let index = 0; index < 12; index++) {
    const date = new Date(end);
    date.setUTCDate(date.getUTCDate() - 7 * index);
    const cycle = currentAdCycle(date).start;
    if (cycle < query.start) break;
    // Absolute Wednesday index: narrowing a window cannot change a point’s identity or price.
    const cycleIndex = Math.round(
      (Date.parse(cycle) - Date.parse('2026-01-07')) / 604800000
    );
    const endDate = new Date(`${cycle}T12:00:00Z`);
    endDate.setUTCDate(endDate.getUTCDate() + 6);
    const validTo = endDate.toISOString().slice(0, 10);
    for (const [storeIndex, offer] of ALL_WEEKLY_BASELINE_OFFERS.filter(
      (o) => o.canonicalIngredientId === ingredient.id
    ).entries()) {
      const price = Number(
        (
          offer.normalizedPricePerUnit *
          [1, 1.15, 0.95, 1.2, 1.05, 0.9][
            (((cycleIndex + storeIndex) % 6) + 6) % 6
          ]
        ).toFixed(2)
      );
      const id = (cycleIndex + 200000) * 100 + storeIndex;
      const payload = {
        ...offer,
        normalizedPricePerUnit: price,
        salePrice: price,
        saleUnit: ingredient.standardUnit,
        rawPriceText: `$${price.toFixed(2)}/${ingredient.standardUnit} (synthetic scenario)`,
        validFrom: cycle,
        validTo,
      };
      archive.offers.push({
        id,
        zip_code: query.zip,
        source: 'CURATED_FALLBACK',
        source_offer_id: offer.id,
        ingredient_id: ingredient.id,
        store: offer.store,
        location_label: offer.storeLocationLabel,
        source_from: cycle,
        source_to: validTo,
        cycle,
        unit: ingredient.standardUnit,
        normalized_price: price,
        payload,
        retrieved_at: `${cycle}T12:00:00Z`,
        receipt_id: id,
        receipt_count: 1,
        receipts: [{ id, retrieved_at: `${cycle}T12:00:00Z` }],
      });
    }
  }
  // Catalog and local scenarios suffice in demo mode. Never manufacture source reports.
  return archive;
}
