import { CANONICAL_INGREDIENTS } from '@/data/canonical-ingredients';
import { MEAD_WEEKLY_STORE_OFFERS } from '@/data/mead-baseline-offers';
import { MEAL_PREP_BLUEPRINTS } from '@/data/meal-prep-blueprints';
import {
  CanonicalIngredient,
  DashboardPayload,
  RecommendedDish,
  ScoredCommodity,
  StoreChain,
  StoreOffer,
  MatchedSlotIngredient,
} from '@/types/domain';
import { fetchLiveFlippOffers } from './connectors/flipp';
import { checkUsdaMarsStatus, fetchKrogerLiveOffers } from './connectors/usda-and-kroger';
import {
  getIngredientHistoryFromSqlite,
  getSqliteDatabaseStats,
  persistLiveOffersToSqlite,
} from './db/sqlite';

/**
 * Computes absolute affordability score (0-100) based on normalized $/lb (or $/doz).
 * Lower $/lb = higher affordability score.
 */
function calculateAffordabilityScore(
  ingredient: CanonicalIngredient,
  pricePerUnit: number
): number {
  if (ingredient.category === 'PROTEIN') {
    if (pricePerUnit <= 1.25) return 100;
    if (pricePerUnit >= 8.0) return 12;
    const score = 100 - ((pricePerUnit - 1.25) / (8.0 - 1.25)) * 88;
    return Math.round(Math.max(10, Math.min(100, score)));
  }

  if (ingredient.category === 'PRODUCE') {
    if (pricePerUnit <= 0.6) return 100;
    if (pricePerUnit >= 3.8) return 15;
    const score = 100 - ((pricePerUnit - 0.6) / (3.8 - 0.6)) * 85;
    return Math.round(Math.max(12, Math.min(100, score)));
  }

  // DAIRY_EGGS
  if (pricePerUnit <= 1.6) return 100;
  if (pricePerUnit >= 5.0) return 20;
  const score = 100 - ((pricePerUnit - 1.6) / (5.0 - 1.6)) * 80;
  return Math.round(Math.max(15, Math.min(100, score)));
}

/**
 * Computes discount depth score (0-100) relative to Mountain Region baseline & regular price.
 */
function calculateDiscountDepthScore(
  discountVsBaselinePct: number,
  discountVsRegularPct: number
): number {
  const effectiveDiscount = Math.max(discountVsBaselinePct, discountVsRegularPct * 0.9);
  if (effectiveDiscount <= 0) return 10;
  if (effectiveDiscount >= 50) return 100;
  return Math.round(10 + (effectiveDiscount / 50) * 90);
}

/**
 * Computes wholesale momentum bonus (0-100) from USDA Market News signals.
 */
function calculateWholesaleBonus(
  ingredient: CanonicalIngredient,
  discountVsBaselinePct: number
): number {
  const { trend } = ingredient.usdaSignal;
  if (trend === 'CYCLE_FLOOR' && discountVsBaselinePct >= 20) return 95;
  if (trend === 'SPIKING_BUY_NOW' && discountVsBaselinePct >= 25) return 100;
  if (trend === 'DROPPING_FAST' && discountVsBaselinePct < 15) return 20;
  return 60;
}

export function scoreAllCommodities(
  allOffers: StoreOffer[],
  storeFilter: 'ALL' | StoreChain = 'ALL',
  usdaOverrides: Record<
    string,
    { mountainBaseline?: number; mountainAdFeaturePct?: number; note?: string }
  > = {}
): ScoredCommodity[] {
  const scored: ScoredCommodity[] = [];

  for (const rawIng of CANONICAL_INGREDIENTS) {
    const override = usdaOverrides[rawIng.id];
    const ingredient: CanonicalIngredient = override
      ? {
          ...rawIng,
          mountainBaselinePerUnit:
            override.mountainBaseline ?? rawIng.mountainBaselinePerUnit,
          usdaSignal: {
            ...rawIng.usdaSignal,
            mountainAdFeaturePct:
              override.mountainAdFeaturePct ??
              rawIng.usdaSignal.mountainAdFeaturePct,
          },
        }
      : rawIng;

    const matchingOffers = allOffers.filter(
      (o) => o.canonicalIngredientId === ingredient.id
    );
    if (matchingOffers.length === 0) continue;

    const ksOffers = matchingOffers
      .filter((o) => o.store === 'KING_SOOPERS')
      .sort((a, b) => a.normalizedPricePerUnit - b.normalizedPricePerUnit);
    const swOffers = matchingOffers
      .filter((o) => o.store === 'SAFEWAY')
      .sort((a, b) => a.normalizedPricePerUnit - b.normalizedPricePerUnit);

    const kingSoopersOffer = ksOffers[0];
    const safewayOffer = swOffers[0];

    const pool =
      storeFilter === 'KING_SOOPERS'
        ? ksOffers
        : storeFilter === 'SAFEWAY'
          ? swOffers
          : [kingSoopersOffer, safewayOffer].filter((x): x is StoreOffer => Boolean(x));

    if (pool.length === 0) continue;

    pool.sort((a, b) => a.normalizedPricePerUnit - b.normalizedPricePerUnit);
    const bestOffer = pool[0];
    const runnerUpOffer = pool[1];

    const discountVsBaselinePct = Math.round(
      ((ingredient.mountainBaselinePerUnit - bestOffer.normalizedPricePerUnit) /
        ingredient.mountainBaselinePerUnit) *
        100
    );
    const discountVsRegularPct = Math.round(
      ((bestOffer.regularPricePerUnit - bestOffer.normalizedPricePerUnit) /
        bestOffer.regularPricePerUnit) *
        100
    );

    const affordabilityScore = calculateAffordabilityScore(
      ingredient,
      bestOffer.normalizedPricePerUnit
    );
    const discountDepthScore = calculateDiscountDepthScore(
      discountVsBaselinePct,
      discountVsRegularPct
    );
    const wholesaleBonusScore = calculateWholesaleBonus(
      ingredient,
      discountVsBaselinePct
    );

    const valueScore = Math.round(
      0.55 * affordabilityScore +
        0.35 * discountDepthScore +
        0.1 * wholesaleBonusScore
    );

    const isHighRegularPrice =
      bestOffer.regularPricePerUnit >= 4.75 ||
      bestOffer.normalizedPricePerUnit >= ingredient.splurgeThresholdPerUnit * 0.78;
    const isDeepDiscount = discountVsRegularPct >= 38 || discountVsBaselinePct >= 30;
    const isSplurgeAlert = Boolean(
      isHighRegularPrice &&
        isDeepDiscount &&
        bestOffer.normalizedPricePerUnit >= 1.95
    );

    let actionTag: ScoredCommodity['actionTag'] = 'GREAT_STAPLE';
    if (
      ingredient.usdaSignal.trend === 'DROPPING_FAST' &&
      discountVsBaselinePct < 18
    ) {
      actionTag = 'WAIT_NEXT_WEEK';
    } else if (
      ingredient.usdaSignal.trend === 'SPIKING_BUY_NOW' &&
      discountVsRegularPct >= 30
    ) {
      actionTag = 'BUY_BEFORE_SPIKE';
    } else if (isSplurgeAlert && bestOffer.normalizedPricePerUnit >= 3.9) {
      actionTag = 'SPLURGE_DEAL';
    } else if (valueScore >= 82 || discountVsRegularPct >= 42) {
      actionTag = 'STOCK_UP_ANCHOR';
    }

    const { priceHistory, sixWeekLocalAvg, sixWeekLow } =
      getIngredientHistoryFromSqlite(ingredient.id);

    scored.push({
      ingredient,
      bestOffer,
      runnerUpOffer,
      kingSoopersOffer,
      safewayOffer,
      valueScore,
      affordabilityScore,
      discountDepthScore,
      wholesaleBonusScore,
      discountVsBaselinePct,
      discountVsRegularPct,
      isSplurgeAlert,
      actionTag,
      priceHistory,
      sixWeekLocalAvg,
      sixWeekLow,
    });
  }

  return scored.sort((a, b) => b.valueScore - a.valueScore);
}

/**
 * Evaluates all modular Stew, Braise, Chili, Curry, and Casserole blueprints
 * against current local deals and user-pinned ingredient IDs.
 */
export function rankMealPrepDishes(
  scoredCommodities: ScoredCommodity[],
  pinnedIngredientIds: string[] = []
): {
  recommendedTrio: RecommendedDish[];
  allRankedDishes: RecommendedDish[];
} {
  const commodityMap = new Map<string, ScoredCommodity>();
  for (const sc of scoredCommodities) {
    commodityMap.set(sc.ingredient.id, sc);
  }
  const pinnedSet = new Set(pinnedIngredientIds);

  const evaluated: RecommendedDish[] = [];

  for (const blueprint of MEAL_PREP_BLUEPRINTS) {
    const matchedIngredients: MatchedSlotIngredient[] = [];
    let storeIngredientCost = 0;
    let regularStoreCost = 0;
    let scoreSum = 0;
    let pinnedHits = 0;

    for (const slot of blueprint.slots) {
      const candidates = slot.candidateIngredientIds
        .map((id) => commodityMap.get(id))
        .filter((c): c is ScoredCommodity => Boolean(c));

      if (candidates.length === 0) continue;

      candidates.sort((a, b) => {
        const aPinned = pinnedSet.has(a.ingredient.id) ? 1 : 0;
        const bPinned = pinnedSet.has(b.ingredient.id) ? 1 : 0;
        if (aPinned !== bPinned) return bPinned - aPinned;
        return b.valueScore - a.valueScore;
      });

      const chosen = candidates[0];
      const isUserPinned = pinnedSet.has(chosen.ingredient.id);
      if (isUserPinned) pinnedHits += 1;

      const slotCost = Number(
        (chosen.bestOffer.normalizedPricePerUnit * slot.quantityRequired).toFixed(2)
      );
      const regularSlotCost = Number(
        (chosen.bestOffer.regularPricePerUnit * slot.quantityRequired).toFixed(2)
      );

      storeIngredientCost += slotCost;
      regularStoreCost += regularSlotCost;
      scoreSum += chosen.valueScore;

      matchedIngredients.push({
        slotLabel: slot.label,
        ingredientId: chosen.ingredient.id,
        ingredientName: chosen.ingredient.name,
        quantityUsed: slot.quantityRequired,
        unit: chosen.ingredient.standardUnit,
        store: chosen.bestOffer.store,
        rawDealText: chosen.bestOffer.rawPriceText,
        dealType: chosen.bestOffer.dealType,
        dealConditions: chosen.bestOffer.dealConditions,
        unitCost: chosen.bestOffer.normalizedPricePerUnit,
        slotCost,
        regularSlotCost,
        isUserPinned,
      });
    }

    const totalBatchCost = Number(
      (storeIngredientCost + blueprint.estimatedPantryCost).toFixed(2)
    );
    const regularBatchCost = Number(
      (regularStoreCost + blueprint.estimatedPantryCost).toFixed(2)
    );
    const totalBatchSavings = Number(
      Math.max(0, regularBatchCost - totalBatchCost).toFixed(2)
    );
    const costPerServing = Number((totalBatchCost / blueprint.servings).toFixed(2));

    const avgIngredientScore =
      matchedIngredients.length > 0 ? scoreSum / matchedIngredients.length : 50;
    const costEfficiencyBonus = Math.max(0, (3.25 - costPerServing) * 14);
    const pinnedBonus = pinnedHits * 25;

    const dishMatchScore = Math.round(
      avgIngredientScore + costEfficiencyBonus + pinnedBonus
    );

    evaluated.push({
      id: blueprint.id,
      title: blueprint.title,
      subtitle: blueprint.subtitle,
      style: blueprint.style,
      appliance: blueprint.appliance,
      servings: blueprint.servings,
      prepTimeMinutes: blueprint.prepTimeMinutes,
      cookTimeMinutes: blueprint.cookTimeMinutes,
      freezerFriendly: blueprint.freezerFriendly,
      flavorProfile: blueprint.flavorProfile,
      matchedIngredients,
      pantryStaples: blueprint.pantryStaples,
      estimatedPantryCost: blueprint.estimatedPantryCost,
      totalBatchCost,
      regularBatchCost,
      totalBatchSavings,
      costPerServing,
      dishMatchScore,
      steps: blueprint.steps,
      reheatTip: blueprint.reheatTip,
      aiGenerated: false,
    });
  }

  evaluated.sort((a, b) => b.dishMatchScore - a.dishMatchScore);

  const recommendedTrio: RecommendedDish[] = [];
  const usedPrimaryProteins = new Set<string>();

  for (const dish of evaluated) {
    if (recommendedTrio.length >= 3) break;
    const primaryProteinId = dish.matchedIngredients[0]?.ingredientId || dish.id;
    const hasPinned = dish.matchedIngredients.some((m) => m.isUserPinned);

    if (!usedPrimaryProteins.has(primaryProteinId) || hasPinned) {
      recommendedTrio.push(dish);
      usedPrimaryProteins.add(primaryProteinId);
    }
  }

  for (const dish of evaluated) {
    if (recommendedTrio.length >= 3) break;
    if (!recommendedTrio.some((d) => d.id === dish.id)) {
      recommendedTrio.push(dish);
    }
  }

  return {
    recommendedTrio,
    allRankedDishes: evaluated,
  };
}

/**
 * Full pipeline orchestrator: merges live connectors + Mead, CO weekly circular dataset,
 * persists updates to SQLite, computes commodity scores, splurge alerts, market radar,
 * and the 3-dish meal prep plan.
 */
export async function buildDashboardPayload(options?: {
  zipCode?: string;
  storeFilter?: 'ALL' | StoreChain;
  pinnedIngredientIds?: string[];
  kingSoopersLocationId?: string;
}): Promise<DashboardPayload> {
  const zipCode = options?.zipCode || process.env.NEXT_PUBLIC_DEFAULT_ZIP || '80542';
  const storeFilter = options?.storeFilter || 'ALL';
  const pinnedIngredientIds = options?.pinnedIngredientIds || [];

  const [flippResult, usdaResult, krogerResult] = await Promise.all([
    fetchLiveFlippOffers(zipCode),
    checkUsdaMarsStatus(),
    fetchKrogerLiveOffers(options?.kingSoopersLocationId),
  ]);

  // Persist any live-fetched Flipp or Kroger offers into SQLite for the active ad cycle
  if (flippResult.offers.length > 0 || krogerResult.offers.length > 0) {
    persistLiveOffersToSqlite([...flippResult.offers, ...krogerResult.offers]);
  }

  const combinedOffers: StoreOffer[] = [
    ...flippResult.offers,
    ...krogerResult.offers,
    ...MEAD_WEEKLY_STORE_OFFERS,
  ];

  const commodities = scoreAllCommodities(
    combinedOffers,
    storeFilter,
    usdaResult.overrides
  );
  const splurgeAlerts = commodities.filter((c) => c.isSplurgeAlert);
  const { recommendedTrio, allRankedDishes } = rankMealPrepDishes(
    commodities,
    pinnedIngredientIds
  );

  const buyBeforeSpike = commodities.filter(
    (c) => c.actionTag === 'BUY_BEFORE_SPIKE'
  );

  const holdOffDropping = commodities
    .filter((c) => c.actionTag === 'WAIT_NEXT_WEEK')
    .map((c) => ({
      ingredient: c.ingredient,
      currentLocalPrice: c.bestOffer.normalizedPricePerUnit,
      expectedSaleTarget: Number(
        (c.ingredient.mountainBaselinePerUnit * 0.58).toFixed(2)
      ),
      reason: c.ingredient.usdaSignal.note,
    }));

  const sqliteStats = getSqliteDatabaseStats();

  return {
    zipCode,
    cityLabel: zipCode === '80542' ? 'Mead / Longmont / Firestone, CO' : `Zip ${zipCode} Area`,
    adCycleLabel: 'Wed Oct 14 – Tue Oct 20, 2026 (Active Weekend Cycle)',
    lastUpdatedIso: new Date().toISOString(),
    dataSourcesActive: {
      flippLive: flippResult.liveSuccess,
      usdaLive: usdaResult.usdaLive,
      krogerLive: krogerResult.krogerLive,
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY?.trim()),
      sqlitePersisted: sqliteStats.totalHistoricalOfferRows > 0,
    },
    sqliteStats,
    nearbyKingSoopersLocations: krogerResult.locations,
    selectedKingSoopersLocationId: krogerResult.selectedLocationId,
    commodities,
    splurgeAlerts,
    recommendedTrio,
    allRankedDishes,
    marketRadar: {
      buyBeforeSpike,
      holdOffDropping,
    },
  };
}
