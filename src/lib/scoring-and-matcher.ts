import { rankMealPrepDishes } from './meal-prep-matcher';
import { calculateValueScore } from '@/lib/value-score';
import { verifiedLocalWeekCount } from '@/lib/market/history-summary';
import { archiveMarketOffers, loadMarketHistory, emptyHistory, type IngredientHistory } from '@/lib/market/history';
import { readUsdaBenchmarks } from '@/lib/usda/read';
import { lastSuccessfulRefresh } from '@/lib/refresh-audit';
import { currentAdCycle, selectCurrentOffers } from '@/lib/offer-freshness';
import { CANONICAL_INGREDIENTS } from '@/data/canonical-ingredients';
import { ALL_WEEKLY_BASELINE_OFFERS } from '@/data/mead-baseline-offers';
import {
  ALL_STORE_CHAINS,
  getStoreDefinition,
  resolveStoreBanner,
} from '@/data/store-registry';
import { compareAgainstWholesaleClubs } from '@/data/wholesale-club-benchmarks';
import {
  ArbitragePrompt,
  AvailableStoreInfo,
  CanonicalIngredient,
  CookingVesselArchetype,
  CycleSignalMetadata,
  DashboardPayload,
  FreezerItem,
  DietaryConstraint,
  MacroGoal,
  RecommendedDish,
  ScoredCommodity,
  StoreChain,
  StoreOffer,
} from '@/types/domain';
import { fetchLiveFlippOffers } from './connectors/flipp';
import { fetchKrogerLiveOffers } from './connectors/usda-and-kroger';
import {
  getIngredientHistoryFromSqlite,
  getSqliteDatabaseStats,
  persistLiveOffersToSqlite,
} from './db/sqlite';
import { isSupabaseConfigured } from './supabase/config';

export function scoreAllCommodities(
  allOffers: StoreOffer[],
  storeFilter: 'ALL' | StoreChain = 'ALL',
  usdaOverrides: Record<
    string,
    { mountainBaseline?: number; mountainAdFeaturePct?: number; note?: string }
  > = {},
  activeStores?: StoreChain[],
  histories?: Record<string, IngredientHistory>
): ScoredCommodity[] {
  const scored: ScoredCommodity[] = [];

  for (const sourceIng of CANONICAL_INGREDIENTS) {
    // Verified retail benchmarks do not establish wholesale momentum.
    const rawIng: CanonicalIngredient = histories ? { ...sourceIng, usdaSignal: { ...sourceIng.usdaSignal,
      trend: 'STABLE', wholesaleChangePct: 0, mountainAdFeaturePct: 0,
      note: 'Wholesale momentum unavailable; retail benchmark provenance is shown separately.',
    } } : sourceIng;
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
      (o) => o.canonicalIngredientId === ingredient.id && Number.isFinite(o.normalizedPricePerUnit) && o.normalizedPricePerUnit > 0
    );
    if (matchingOffers.length === 0) continue;

    const storeOffers: Partial<Record<StoreChain, StoreOffer>> = {};
    for (const chain of ALL_STORE_CHAINS) {
      const chainOffers = matchingOffers
        .filter((o) => o.store === chain)
        .sort((a, b) => a.normalizedPricePerUnit - b.normalizedPricePerUnit);
      if (chainOffers.length > 0) {
        storeOffers[chain] = chainOffers[0];
      }
    }

    const kingSoopersOffer = storeOffers['KING_SOOPERS'];
    const safewayOffer = storeOffers['SAFEWAY'];

    let pool: StoreOffer[] = [];
    if (storeFilter !== 'ALL') {
      const single = storeOffers[storeFilter];
      if (single) pool = [single];
    } else if (activeStores && activeStores.length > 0) {
      pool = activeStores
        .map((s) => storeOffers[s])
        .filter((x): x is StoreOffer => Boolean(x));
    } else {
      pool = Object.values(storeOffers).filter((x): x is StoreOffer => Boolean(x));
    }

    if (pool.length === 0) continue;

    const livePool = pool.filter((offer) => offer.source !== 'CURATED_FALLBACK');
    if (livePool.length > 0) pool = livePool;
    pool.sort((a, b) => a.normalizedPricePerUnit - b.normalizedPricePerUnit);
    const bestOffer = pool[0];
    const runnerUpOffer = pool[1];

    const { discountVsBaselinePct, discountVsRegularPct, affordabilityScore,
      discountDepthScore, wholesaleBonusScore, valueScore } = calculateValueScore(
        ingredient, bestOffer.normalizedPricePerUnit, bestOffer.regularPricePerUnit);

    const isHighRegularPrice =
      bestOffer.regularPricePerUnit >= 4.75 ||
      bestOffer.normalizedPricePerUnit >= ingredient.splurgeThresholdPerUnit * 0.78;
    const isDeepDiscount = discountVsRegularPct >= 38 || discountVsBaselinePct >= 30;
    const verifiedPrice = bestOffer.source !== 'CURATED_FALLBACK';
    const isSplurgeAlert = Boolean(
      verifiedPrice && isHighRegularPrice &&
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

    if (!verifiedPrice) actionTag = 'GREAT_STAPLE';

    const {
      priceHistory,
      sixWeekLocalAvg,
      sixWeekLow,
      sixWeekHigh,
      sixWeekMedian,
    } = histories ? histories[ingredient.id] ?? emptyHistory() : getIngredientHistoryFromSqlite(ingredient.id);

    // Ticket #25: Wholesale Club (Costco & Sam's Club) Price Normalizer
    const clubBenchmark = compareAgainstWholesaleClubs(
      ingredient.id,
      bestOffer.normalizedPricePerUnit,
      ingredient.standardUnit
    );

    // Ticket #24: Predictive 6-Week Cycle Signal Classification
    const pctVsSixWeekLow =
      sixWeekLow > 0
        ? Math.round(
            ((bestOffer.normalizedPricePerUnit - sixWeekLow) / sixWeekLow) * 100
          )
        : 0;

    let cycleStatus: CycleSignalMetadata['status'] = 'FAIR_SALE_PRICE';
    let badgeLabel = '🟡 Fair Sale Price (Buy for Week)';

    if (
      actionTag === 'WAIT_NEXT_WEEK' ||
      (ingredient.usdaSignal.trend === 'DROPPING_FAST' && discountVsRegularPct < 30) ||
      discountVsRegularPct < 20
    ) {
      cycleStatus = 'CYCLE_PEAK_WAIT';
      badgeLabel = '🔴 Cycle Peak (Wait / Substitute)';
    } else if (
      sixWeekLow > 0 && bestOffer.normalizedPricePerUnit <= sixWeekLow + 0.05 &&
        discountVsRegularPct >= 32
    ) {
      cycleStatus = 'STOCK_UP_6WK_LOW';
      badgeLabel = '🟢 Stock Up Alert (6-Week Low)';
    }

    if (discountVsRegularPct >= 42 && cycleStatus !== 'STOCK_UP_6WK_LOW') {
      badgeLabel = 'Deep discount against regular price';
    }
    if (histories && verifiedLocalWeekCount(priceHistory) < 6) {
      cycleStatus = 'FAIR_SALE_PRICE';
      badgeLabel = discountVsRegularPct >= 42
        ? 'Deep discount; fewer than six weeks of verified history'
        : 'Current price; fewer than six weeks of verified history';
    }

    if (!verifiedPrice) {
      cycleStatus = 'FAIR_SALE_PRICE';
      badgeLabel = 'Historical estimate (verify current price)';
    }

    // Ticket #21: Virtual Freezer Arbitrage Prompt ("Buy 2: Prep 1, Freeze 1")
    const isFreezableCategory =
      ingredient.category === 'PROTEIN' ||
      ingredient.id === 'butter-salted-unsalted' ||
      ingredient.id === 'shredded-block-cheese';
    const isArbitrageEligible =
      verifiedPrice && isFreezableCategory &&
      (cycleStatus === 'STOCK_UP_6WK_LOW' ||
        discountVsRegularPct >= 38 ||
        isSplurgeAlert);

    const recommendedFreezeQty =
      ingredient.category === 'PROTEIN'
        ? Math.max(2.0, Number(ingredient.avgEachWeightLb.toFixed(1)))
        : 2.0;
    const freezeCostBasis = Number(
      (bestOffer.normalizedPricePerUnit * recommendedFreezeQty).toFixed(2)
    );
    const futureWeekSavings = Number(
      Math.max(
        0,
        (bestOffer.regularPricePerUnit - bestOffer.normalizedPricePerUnit) *
          recommendedFreezeQty
      ).toFixed(2)
    );

    const arbitragePrompt: ArbitragePrompt = {
      eligible: isArbitrageEligible,
      label: 'Buy 2: Prep 1, Freeze 1',
      recommendedFreezeQty,
      unit: ingredient.standardUnit,
      freezeCostBasis,
      futureWeekSavings,
    };

    scored.push({
      ingredient,
      bestOffer,
      runnerUpOffer,
      kingSoopersOffer,
      safewayOffer,
      storeOffers,
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
      sixWeekHigh,
      sixWeekMedian,
      cycleSignal: {
        status: cycleStatus,
        badgeLabel,
        sixWeekLow,
        sixWeekHigh,
        sixWeekMedian,
        pctVsSixWeekLow,
      },
      clubBenchmark,
      arbitragePrompt,
    });
  }

  // Second pass: Attach intelligent substitution suggestions for items in CYCLE_PEAK_WAIT
  // or higher-cost items that have a deep cycle-low alternative in the same category (Ticket #24)
  for (const item of scored) {
    if (!item.cycleSignal) continue;
    const sameCategoryPool = scored
      .filter(
        (c) =>
          c.ingredient.category === item.ingredient.category &&
          c.ingredient.id !== item.ingredient.id &&
          c.cycleSignal?.status === 'STOCK_UP_6WK_LOW' &&
          c.bestOffer.normalizedPricePerUnit < item.bestOffer.normalizedPricePerUnit - 0.35
      )
      .sort((a, b) => b.valueScore - a.valueScore);

    if (
      sameCategoryPool.length > 0 &&
      (item.cycleSignal.status === 'CYCLE_PEAK_WAIT' ||
        item.bestOffer.normalizedPricePerUnit >= 2.49)
    ) {
      const sub = sameCategoryPool[0];
      const savingsPerUnit = Number(
        (
          item.bestOffer.normalizedPricePerUnit -
          sub.bestOffer.normalizedPricePerUnit
        ).toFixed(2)
      );
      item.cycleSignal.substitutionSuggestion = {
        substituteIngredientId: sub.ingredient.id,
        substituteName: sub.ingredient.name,
        substitutePrice: sub.bestOffer.normalizedPricePerUnit,
        substituteStore: sub.bestOffer.store,
        savingsPerUnit,
        reason:
          item.cycleSignal.status === 'CYCLE_PEAK_WAIT'
            ? `Wait for next week's ad drop on ${item.ingredient.name}; swap in 6-week floor ${sub.ingredient.name} ($${sub.bestOffer.normalizedPricePerUnit.toFixed(2)}/${sub.ingredient.standardUnit}) to save $${savingsPerUnit.toFixed(2)}/${item.ingredient.standardUnit}.`
            : `Arbitrage swap: ${sub.ingredient.name} is at a 6-week floor ($${sub.bestOffer.normalizedPricePerUnit.toFixed(2)}/${sub.ingredient.standardUnit}, saving $${savingsPerUnit.toFixed(2)}/${item.ingredient.standardUnit}).`,
      };
    }
  }

  return scored.sort((a, b) => b.valueScore - a.valueScore);
}

export { rankMealPrepDishes } from './meal-prep-matcher';

const cityCache = new Map<string, string>([
  ['80542', 'Mead / Longmont, CO'],
  ['80501', 'Longmont, CO'],
  ['80504', 'Firestone / Longmont, CO'],
  ['80202', 'Denver, CO'],
  ['80302', 'Boulder, CO'],
]);

export async function resolveCityStateFromZip(zipCode: string): Promise<string> {
  const trimmed = zipCode.trim();
  if (!trimmed || !/^\d{5}$/.test(trimmed)) return `Zip ${trimmed || '80542'}`;
  if (cityCache.has(trimmed)) return cityCache.get(trimmed)!;

  try {
    const res = await fetch(`https://api.zippopotam.us/us/${trimmed}`, {
      signal: AbortSignal.timeout(2000),
      next: { revalidate: 86400 },
    });
    if (res.ok) {
      const data = await res.json();
      const place = data?.places?.[0];
      if (place?.['place name'] && place?.['state abbreviation']) {
        const label = `${place['place name']}, ${place['state abbreviation']}`;
        cityCache.set(trimmed, label);
        return label;
      }
    }
  } catch {
    // Ignore network timeout or fallback
  }

  return `Zip ${trimmed} Area`;
}

export async function buildDashboardPayload(options?: {
  pantryMode?: boolean;
  archiveHistory?: boolean;
  zipCode?: string;
  storeFilter?: 'ALL' | StoreChain;
  activeStores?: StoreChain[];
  pinnedIngredientIds?: string[];
  onHandIngredientIds?: string[];
  targetServings?: number;
  kingSoopersLocationId?: string;
  freezerInventory?: FreezerItem[];
  savedRecipes?: RecommendedDish[];
  macroGoal?: MacroGoal;
  dietaryConstraints?: DietaryConstraint[];
  applianceFilter?: CookingVesselArchetype;
}): Promise<DashboardPayload> {
  const attemptedAtIso = new Date().toISOString();
  const zipCode = options?.zipCode || process.env.NEXT_PUBLIC_DEFAULT_ZIP || '80542';
  const storeFilter = options?.storeFilter || 'ALL';
  const activeStores = options?.activeStores;
  const pinnedIngredientIds = options?.pinnedIngredientIds || [];
  const onHandIngredientIds = options?.onHandIngredientIds || [];
  const targetServings = options?.targetServings || 6;

  const [flippResult, usdaResult, krogerResult, cityLabel, priorLiveRefresh, marketHistory] = await Promise.all([
    fetchLiveFlippOffers(zipCode),
    readUsdaBenchmarks(),
    // The current Kroger integration has a Mead-specific default location.
    // Never archive those prices under an unrelated requested ZIP.
    zipCode === '80542' || options?.kingSoopersLocationId
      ? fetchKrogerLiveOffers(options?.kingSoopersLocationId)
      : Promise.resolve({ krogerLive: false, locations: [], selectedLocationId: '', offers: [] }),
    resolveCityStateFromZip(zipCode),
    lastSuccessfulRefresh(zipCode),
    loadMarketHistory(zipCode),
  ]);

  const observedAt = new Date();
  const adCycle = currentAdCycle(observedAt);
  const { current: liveOffers, offers: combinedOffers } = selectCurrentOffers(
    [...flippResult.offers, ...krogerResult.offers], ALL_WEEKLY_BASELINE_OFFERS, observedAt
  );
  const flippCount = liveOffers.filter((offer) => offer.source === 'FLIPP_LIVE').length;
  const krogerCount = liveOffers.filter((offer) => offer.source === 'KROGER_API').length;
  if (liveOffers.length > 0 && marketHistory.storage === 'local') {
    persistLiveOffersToSqlite(liveOffers, adCycle.start, adCycle.label);
  }

  const archiveStorage = options?.archiveHistory ? await archiveMarketOffers(liveOffers, zipCode, observedAt) : undefined;
  const freezerInventory = options?.freezerInventory || [];
  const freezerIngredientIds = freezerInventory
    .filter((f) => f.quantityLbOrDoz > 0)
    .map((f) => f.canonicalIngredientId);

  const commodities = scoreAllCommodities(
    combinedOffers,
    storeFilter,
    usdaResult.overrides,
    activeStores,
    marketHistory.storage === 'local' ? undefined : marketHistory.histories
  );
  for (const item of commodities) item.usdaBenchmark = usdaResult.provenance[item.ingredient.id];
  const splurgeAlerts = commodities.filter((c) => c.isSplurgeAlert);
  const { recommendedTrio, allRankedDishes } = rankMealPrepDishes(
    commodities,
    pinnedIngredientIds,
    onHandIngredientIds,
    targetServings,
    {
      macroGoal: options?.macroGoal,
      dietaryConstraints: options?.dietaryConstraints,
      applianceFilter: options?.applianceFilter,
      freezerIngredientIds,
      savedRecipes: options?.savedRecipes,
      now: observedAt,
      pantryMode: options?.pantryMode ?? process.env.PANTRYBOT_PANTRY_ENABLED === 'true',
    }
  );

  const buyBeforeSpike = commodities.filter(
    (c) => c.actionTag === 'BUY_BEFORE_SPIKE'
  );

  const stockUpCycleLows = commodities.filter(
    (c) => c.cycleSignal?.status === 'STOCK_UP_6WK_LOW'
  );

  const cyclePeakWaitList = commodities.filter(
    (c) => c.cycleSignal?.status === 'CYCLE_PEAK_WAIT'
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

  const availableStores: AvailableStoreInfo[] = ALL_STORE_CHAINS.map((chain) => {
    const def = getStoreDefinition(chain);
    const hasActiveOffers = combinedOffers.some((o) => o.store === chain);
    return {
      id: chain,
      name: def.name,
      bannerName: resolveStoreBanner(chain, zipCode),
      brandColor: def.brandColor,
      accentBg: def.accentBg,
      badgeTextColor: def.badgeTextColor,
      hasDigitalCoupons: def.hasDigitalCoupons,
      couponAppLabel: def.couponAppLabel,
      isEverydayLowPrice: def.isEverydayLowPrice,
      hasActiveOffers,
    };
  });

  return {
    zipCode,
    cityLabel,
    adCycleLabel: adCycle.label,
    lastUpdatedIso: new Date().toISOString(),
    freshness: {
      attemptedAtIso,
      liveRetrievedAtIso: liveOffers.length > 0 ? new Date().toISOString() : priorLiveRefresh,
      usableLiveOffers: liveOffers.length,
      estimatedBestPrices: commodities.filter((c) => c.bestOffer.source === 'CURATED_FALLBACK').length,
      sourceOfferCounts: { flipp: flippCount, kroger: krogerCount },
    },
    usda: { status: usdaResult.status, reason: usdaResult.reason, provenance: usdaResult.provenance },
    marketHistory: { storage: marketHistory.storage, archiveStorage, provenance: marketHistory.storage === 'local' ? 'synthetic_seed' : 'verified_live' },
    dataSourcesActive: {
      flippLive: flippCount > 0,
      usdaLive: usdaResult.usdaLive,
      krogerLive: krogerCount > 0,
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY?.trim()),
      sqlitePersisted: sqliteStats.totalHistoricalOfferRows > 0,
      supabaseConfigured: isSupabaseConfigured(),
    },
    sqliteStats,
    nearbyKingSoopersLocations: krogerResult.locations,
    selectedKingSoopersLocationId: krogerResult.selectedLocationId,
    availableStores,
    activeStores,
    freezerInventory,
    commodities,
    splurgeAlerts,
    recommendedTrio,
    allRankedDishes,
    marketRadar: {
      buyBeforeSpike,
      stockUpCycleLows,
      cyclePeakWaitList,
      holdOffDropping,
    },
  };
}
