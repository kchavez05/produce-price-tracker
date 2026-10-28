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
    const day = date.toISOString().slice(0, 10);
    if (day < query.start) break;
    const cycle = currentAdCycle(date).start;
    for (const [storeIndex, offer] of ALL_WEEKLY_BASELINE_OFFERS.filter(
      (o) => o.canonicalIngredientId === ingredient.id
    ).entries()) {
      const price = Number(
        (
          offer.normalizedPricePerUnit *
          [1, 1.15, 0.95, 1.2, 1.05, 0.9][(index + storeIndex) % 6]
        ).toFixed(2)
      );
      const id = 1000 + index * 100 + storeIndex;
      const payload = {
        ...offer,
        normalizedPricePerUnit: price,
        validFrom: cycle,
        validTo: day,
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
        source_to: day,
        cycle,
        unit: ingredient.standardUnit,
        normalized_price: price,
        payload,
        retrieved_at: `${day}T12:00:00Z`,
        receipt_id: id,
        receipt_count: 1,
        receipts: [{ id, retrieved_at: `${day}T12:00:00Z` }],
      });
    }
  }
  // Catalog and local scenarios suffice in demo mode. Never manufacture source reports.
  return archive;
}
