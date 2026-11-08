import { ScoredCommodity, StoreChain, StoreOffer } from '@/types/domain';
import { calculateValueScore } from '@/lib/value-score';
import { exactOfferAllowed, requiresExactOffer, exactComparisonOffer } from './exact-offer';

/** Qualify before choosing each store's winner; never broaden a cached selected-store pool. */
export function filterCommodityOffers(commodity: ScoredCommodity, allow: (offer: StoreOffer) => boolean): ScoredCommodity | undefined {
  const compare = (a: StoreOffer, b: StoreOffer) => Number(a.source === 'CURATED_FALLBACK') - Number(b.source === 'CURATED_FALLBACK') || a.normalizedPricePerUnit - b.normalizedPricePerUnit;
  const offers = (commodity.recipeOffers ?? [commodity.bestOffer, commodity.runnerUpOffer, commodity.kingSoopersOffer, commodity.safewayOffer, ...Object.values(commodity.storeOffers ?? {})])
    .filter((offer): offer is StoreOffer => Boolean(offer && offer.canonicalIngredientId === commodity.ingredient.id && Number.isFinite(offer.normalizedPricePerUnit) && offer.normalizedPricePerUnit > 0 && allow(offer))).map(exactComparisonOffer).sort(compare);
  const storeOffers: Partial<Record<StoreChain, StoreOffer>> = {};
  for (const offer of offers) if (!storeOffers[offer.store]) storeOffers[offer.store] = offer;
  const selected = commodity.recipeStorePool ?? [commodity.bestOffer.store];
  const pool = Object.values(storeOffers).filter((o): o is StoreOffer => Boolean(o && selected.includes(o.store))).sort(compare);
  if (!pool.length) return;
  return { ...commodity, ...calculateValueScore(commodity.ingredient, pool[0].normalizedPricePerUnit, pool[0].regularPricePerUnit, pool[0].regularPriceEvidence === 'OBSERVED_SAME_PRODUCT'), bestOffer: pool[0], runnerUpOffer: pool[1], storeOffers, kingSoopersOffer: storeOffers.KING_SOOPERS, safewayOffer: storeOffers.SAFEWAY, recipeOffers: offers };
}
export function qualifiedExactCommodity(commodity: ScoredCommodity): ScoredCommodity | undefined {
  if (!requiresExactOffer(commodity.ingredient.id)) return commodity;
  const result = filterCommodityOffers(commodity, (o) => exactOfferAllowed(commodity.ingredient.id, o.rawTitle) === true);
  return result ? { ...result, comparisonEvidence: 'UNQUALIFIED_GROUP_HISTORY', clubBenchmark: undefined, cycleSignal: undefined } : undefined;
}
