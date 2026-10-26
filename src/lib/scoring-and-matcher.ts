import { CANONICAL_INGREDIENTS } from '@/data/canonical-ingredients';
import { ALL_WEEKLY_BASELINE_OFFERS } from '@/data/mead-baseline-offers';
import { MEAL_PREP_BLUEPRINTS } from '@/data/meal-prep-blueprints';
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
  MatchedSlotIngredient,
  NutritionMacros,
  RecommendedDish,
  ScoredCommodity,
  StoreChain,
  StoreOffer,
} from '@/types/domain';
import { fetchLiveFlippOffers } from './connectors/flipp';
import { checkUsdaMarsStatus, fetchKrogerLiveOffers } from './connectors/usda-and-kroger';
import {
  getIngredientHistoryFromSqlite,
  getSqliteDatabaseStats,
  persistLiveOffersToSqlite,
} from './db/sqlite';
import { isSupabaseConfigured } from './supabase/config';

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

function calculateDiscountDepthScore(
  discountVsBaselinePct: number,
  discountVsRegularPct: number
): number {
  const effectiveDiscount = Math.max(discountVsBaselinePct, discountVsRegularPct * 0.9);
  if (effectiveDiscount <= 0) return 10;
  if (effectiveDiscount >= 50) return 100;
  return Math.round(10 + (effectiveDiscount / 50) * 90);
}

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
  > = {},
  activeStores?: StoreChain[]
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

    const {
      priceHistory,
      sixWeekLocalAvg,
      sixWeekLow,
      sixWeekHigh,
      sixWeekMedian,
    } = getIngredientHistoryFromSqlite(ingredient.id);

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
      (bestOffer.normalizedPricePerUnit <= sixWeekLow + 0.05 &&
        discountVsRegularPct >= 32) ||
      discountVsRegularPct >= 42
    ) {
      cycleStatus = 'STOCK_UP_6WK_LOW';
      badgeLabel = '🟢 Stock Up Alert (6-Week Low)';
    }

    // Ticket #21: Virtual Freezer Arbitrage Prompt ("Buy 2: Prep 1, Freeze 1")
    const isFreezableCategory =
      ingredient.category === 'PROTEIN' ||
      ingredient.id === 'butter-salted-unsalted' ||
      ingredient.id === 'shredded-block-cheese';
    const isArbitrageEligible =
      isFreezableCategory &&
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

/**
 * Evaluates all modular Stew, Braise, Chili, Curry, Sheet-Pan, and Casserole blueprints
 * against current local deals, user-pinned ingredient IDs, on-hand/freezer IDs (Ticket #8 & #21),
 * target serving scaler 4/6/8 (Ticket #9), saved library recipes (Ticket #10),
 * and Dietary Preferences, Macro Goals & Cooking Vessel Archetypes (Ticket #22).
 */
export function rankMealPrepDishes(
  scoredCommodities: ScoredCommodity[],
  pinnedIngredientIds: string[] = [],
  onHandIngredientIds: string[] = [],
  targetServings: number = 6,
  options?: {
    macroGoal?: MacroGoal;
    dietaryConstraints?: DietaryConstraint[];
    applianceFilter?: CookingVesselArchetype;
    freezerIngredientIds?: string[];
    savedRecipes?: RecommendedDish[];
  }
): {
  recommendedTrio: RecommendedDish[];
  allRankedDishes: RecommendedDish[];
} {
  const commodityMap = new Map<string, ScoredCommodity>();
  for (const sc of scoredCommodities) {
    commodityMap.set(sc.ingredient.id, sc);
  }

  const macroGoal: MacroGoal = options?.macroGoal || 'ANY';
  const dietaryConstraints: DietaryConstraint[] = options?.dietaryConstraints || [];
  const applianceFilter: CookingVesselArchetype = options?.applianceFilter || 'ANY';
  const freezerSet = new Set(options?.freezerIngredientIds || []);
  const pinnedSet = new Set(pinnedIngredientIds);
  const onHandSet = new Set([
    ...onHandIngredientIds,
    ...(options?.freezerIngredientIds || []),
  ]);

  const savedDishesRaw = options?.savedRecipes || [];
  const savedIdsSet = new Set(savedDishesRaw.map((d) => d.id));

  const evaluated: RecommendedDish[] = [];

  for (const blueprint of MEAL_PREP_BLUEPRINTS) {
    // Check strict dietary constraint compatibility (Ticket #22)
    const needsPescatarian = dietaryConstraints.includes('VEGETARIAN_PESCATARIAN');
    const needsDairyFree = dietaryConstraints.includes('DAIRY_FREE');
    const needsGlutenFree = dietaryConstraints.includes('GLUTEN_FREE');

    if (
      needsPescatarian &&
      !blueprint.dietaryTags?.includes('VEGETARIAN_PESCATARIAN')
    ) {
      continue;
    }

    if (
      needsDairyFree &&
      !blueprint.dietaryTags?.includes('DAIRY_FREE') &&
      blueprint.dairyFreeAdaptable === false
    ) {
      continue;
    }

    if (
      needsGlutenFree &&
      !blueprint.dietaryTags?.includes('GLUTEN_FREE') &&
      blueprint.glutenFreeAdaptable === false
    ) {
      continue;
    }

    const scaleFactor = targetServings / blueprint.servings;
    const matchedIngredients: MatchedSlotIngredient[] = [];
    let storeIngredientCost = 0;
    let regularStoreCost = 0;
    let scoreSum = 0;
    let pinnedHits = 0;
    let onHandHits = 0;
    let poweredByFreezerCount = 0;
    const adaptationNotes: string[] = [];

    for (const slot of blueprint.slots) {
      // If DAIRY_FREE is requested and this is a dairy topper/finish slot, omit it cleanly
      if (needsDairyFree && slot.isDairySlot) {
        adaptationNotes.push(`Omitted ${slot.label.toLowerCase()} for Dairy-Free profile`);
        continue;
      }

      // If LOW_CARB_KETO is active and slot has low-carb vegetable swaps, use them
      const activeCandidateIds =
        macroGoal === 'LOW_CARB_KETO' &&
        slot.lowCarbCandidateIds &&
        slot.lowCarbCandidateIds.length > 0
          ? slot.lowCarbCandidateIds
          : slot.candidateIngredientIds;

      if (
        macroGoal === 'LOW_CARB_KETO' &&
        slot.lowCarbCandidateIds &&
        slot.lowCarbCandidateIds.length > 0
      ) {
        adaptationNotes.push(
          `Swapped ${slot.label.toLowerCase()} to low-carb vegetables for Keto/Low-Carb mode`
        );
      }

      const candidates = activeCandidateIds
        .map((id) => commodityMap.get(id))
        .filter((c): c is ScoredCommodity => Boolean(c));

      if (candidates.length === 0) continue;

      // Sort candidates: Pinned first, then On-Hand in Freezer/Pantry ($0 marginal cost), then highest valueScore
      candidates.sort((a, b) => {
        const aPinned = pinnedSet.has(a.ingredient.id) ? 1 : 0;
        const bPinned = pinnedSet.has(b.ingredient.id) ? 1 : 0;
        if (aPinned !== bPinned) return bPinned - aPinned;

        const aOnHand = onHandSet.has(a.ingredient.id) ? 1 : 0;
        const bOnHand = onHandSet.has(b.ingredient.id) ? 1 : 0;
        if (aOnHand !== bOnHand) return bOnHand - aOnHand;

        return b.valueScore - a.valueScore;
      });

      const chosen = candidates[0];
      const isUserPinned = pinnedSet.has(chosen.ingredient.id);
      const isOnHand = onHandSet.has(chosen.ingredient.id);
      const fromVirtualFreezer = freezerSet.has(chosen.ingredient.id);
      if (isUserPinned) pinnedHits += 1;
      if (isOnHand) onHandHits += 1;
      if (fromVirtualFreezer) poweredByFreezerCount += 1;

      const scaledQty = Number((slot.quantityRequired * scaleFactor).toFixed(2));
      const rawSlotCost = Number(
        (chosen.bestOffer.normalizedPricePerUnit * scaledQty).toFixed(2)
      );
      // Ticket #8 & #21: If item is already On-Hand in Virtual Freezer/Pantry, marginal out-of-pocket cost is $0.00!
      const slotCost = isOnHand ? 0 : rawSlotCost;
      const regularSlotCost = Number(
        (chosen.bestOffer.regularPricePerUnit * scaledQty).toFixed(2)
      );

      storeIngredientCost += slotCost;
      regularStoreCost += regularSlotCost;
      scoreSum += chosen.valueScore;

      matchedIngredients.push({
        slotLabel: slot.label,
        ingredientId: chosen.ingredient.id,
        ingredientName: chosen.ingredient.name,
        quantityUsed: scaledQty,
        unit: chosen.ingredient.standardUnit,
        store: chosen.bestOffer.store,
        rawDealText: fromVirtualFreezer
          ? `❄️ From Virtual Freezer ($0 out-of-pocket • Banked val $${rawSlotCost.toFixed(2)})`
          : isOnHand
            ? `❄️ In Freezer/Pantry ($0 out-of-pocket • Store val $${rawSlotCost.toFixed(2)})`
            : chosen.bestOffer.rawPriceText,
        dealType: chosen.bestOffer.dealType,
        dealConditions: chosen.bestOffer.dealConditions,
        unitCost: chosen.bestOffer.normalizedPricePerUnit,
        slotCost,
        regularSlotCost,
        isUserPinned,
        isOnHand,
        fromVirtualFreezer,
      });
    }

    // Dynamically adjust macros if adapted for Low-Carb/Keto or Dairy-Free
    const adjustedMacros: NutritionMacros = { ...blueprint.macrosPerServing };
    if (macroGoal === 'LOW_CARB_KETO' && blueprint.lowCarbAdaptable) {
      adjustedMacros.carbsGrams = Math.min(adjustedMacros.carbsGrams, 15);
      adjustedMacros.calories = Math.max(0, adjustedMacros.calories - 55);
    }
    if (needsDairyFree && !blueprint.dietaryTags?.includes('DAIRY_FREE')) {
      adjustedMacros.fatGrams = Math.max(0, adjustedMacros.fatGrams - 5);
      adjustedMacros.calories = Math.max(0, adjustedMacros.calories - 45);
    }

    const activeDietaryTags = new Set<DietaryConstraint>(blueprint.dietaryTags || []);
    if (needsDairyFree || blueprint.dietaryTags?.includes('DAIRY_FREE')) {
      activeDietaryTags.add('DAIRY_FREE');
    }
    if (needsGlutenFree || blueprint.glutenFreeAdaptable) {
      activeDietaryTags.add('GLUTEN_FREE');
    }

    const macroBadges: string[] = [];
    if (adjustedMacros.proteinGrams >= 40) {
      macroBadges.push(`💪 High-Protein (${adjustedMacros.proteinGrams}g)`);
    }
    if (adjustedMacros.carbsGrams <= 20) {
      macroBadges.push(`🥑 Keto / Low-Carb (${adjustedMacros.carbsGrams}g Net Carbs)`);
    }
    if (adjustedMacros.calories <= 460) {
      macroBadges.push(`🔥 Calorie-Conscious (${adjustedMacros.calories} kcal)`);
    }
    if (activeDietaryTags.has('GLUTEN_FREE')) {
      macroBadges.push('🌾 Gluten-Free');
    }
    if (activeDietaryTags.has('DAIRY_FREE')) {
      macroBadges.push('🥛 Dairy-Free');
    }

    const scaledPantryCost = Number(
      (blueprint.estimatedPantryCost * scaleFactor).toFixed(2)
    );
    const totalBatchCost = Number(
      (storeIngredientCost + scaledPantryCost).toFixed(2)
    );
    const regularBatchCost = Number(
      (regularStoreCost + scaledPantryCost).toFixed(2)
    );
    const totalBatchSavings = Number(
      Math.max(0, regularBatchCost - totalBatchCost).toFixed(2)
    );
    const costPerServing = Number((totalBatchCost / targetServings).toFixed(2));

    const avgIngredientScore =
      matchedIngredients.length > 0 ? scoreSum / matchedIngredients.length : 50;
    const costEfficiencyBonus = Math.max(0, (3.25 - costPerServing) * 14);
    const pinnedBonus = pinnedHits * 25;
    const onHandBonus = onHandHits * 30;

    let profileBonus = 0;
    if (macroGoal === 'HIGH_PROTEIN' && adjustedMacros.proteinGrams >= 40) {
      profileBonus += 25;
    } else if (macroGoal === 'LOW_CARB_KETO' && adjustedMacros.carbsGrams <= 20) {
      profileBonus += 28;
    } else if (macroGoal === 'CALORIE_CONSCIOUS' && adjustedMacros.calories <= 460) {
      profileBonus += 25;
    }

    if (
      applianceFilter !== 'ANY' &&
      blueprint.vesselArchetype === applianceFilter
    ) {
      profileBonus += 45;
    }

    const dishMatchScore = Math.round(
      avgIngredientScore +
        costEfficiencyBonus +
        pinnedBonus +
        onHandBonus +
        profileBonus
    );

    evaluated.push({
      id: blueprint.id,
      title: blueprint.title,
      subtitle: blueprint.subtitle,
      style: blueprint.style,
      appliance: blueprint.appliance,
      vesselArchetype: blueprint.vesselArchetype,
      servings: targetServings,
      prepTimeMinutes: blueprint.prepTimeMinutes,
      cookTimeMinutes: blueprint.cookTimeMinutes,
      freezerFriendly: blueprint.freezerFriendly,
      flavorProfile: blueprint.flavorProfile,
      macrosPerServing: adjustedMacros,
      dietaryTags: Array.from(activeDietaryTags),
      macroBadges,
      adaptationNote:
        adaptationNotes.length > 0 ? adaptationNotes.join(' • ') : undefined,
      matchedIngredients,
      pantryStaples: blueprint.pantryStaples,
      estimatedPantryCost: scaledPantryCost,
      totalBatchCost,
      regularBatchCost,
      totalBatchSavings,
      costPerServing,
      dishMatchScore,
      steps: blueprint.steps,
      reheatTip: blueprint.reheatTip,
      aiGenerated: false,
      savedInLibrary: savedIdsSet.has(blueprint.id),
      poweredByFreezerCount,
    });
  }

  // Merge any custom AI-generated recipes saved into SQLite (Ticket #10)
  for (const saved of savedDishesRaw) {
    if (!evaluated.some((e) => e.id === saved.id)) {
      evaluated.push({
        ...saved,
        savedInLibrary: true,
      });
    }
  }

  evaluated.sort((a, b) => b.dishMatchScore - a.dishMatchScore);

  const recommendedTrio: RecommendedDish[] = [];
  const usedPrimaryProteins = new Set<string>();

  for (const dish of evaluated) {
    if (recommendedTrio.length >= 3) break;
    const primaryProteinId = dish.matchedIngredients[0]?.ingredientId || dish.id;
    const hasPinnedOrOnHand = dish.matchedIngredients.some(
      (m) => m.isUserPinned || m.isOnHand
    );

    if (!usedPrimaryProteins.has(primaryProteinId) || hasPinnedOrOnHand) {
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
  const zipCode = options?.zipCode || process.env.NEXT_PUBLIC_DEFAULT_ZIP || '80542';
  const storeFilter = options?.storeFilter || 'ALL';
  const activeStores = options?.activeStores;
  const pinnedIngredientIds = options?.pinnedIngredientIds || [];
  const onHandIngredientIds = options?.onHandIngredientIds || [];
  const targetServings = options?.targetServings || 6;

  const [flippResult, usdaResult, krogerResult, cityLabel] = await Promise.all([
    fetchLiveFlippOffers(zipCode),
    checkUsdaMarsStatus(),
    fetchKrogerLiveOffers(options?.kingSoopersLocationId),
    resolveCityStateFromZip(zipCode),
  ]);

  if (flippResult.offers.length > 0 || krogerResult.offers.length > 0) {
    persistLiveOffersToSqlite([...flippResult.offers, ...krogerResult.offers]);
  }

  const combinedOffers: StoreOffer[] = [
    ...flippResult.offers,
    ...krogerResult.offers,
    ...ALL_WEEKLY_BASELINE_OFFERS,
  ];

  const freezerInventory = options?.freezerInventory || [];
  const freezerIngredientIds = freezerInventory
    .filter((f) => f.quantityLbOrDoz > 0)
    .map((f) => f.canonicalIngredientId);

  const commodities = scoreAllCommodities(
    combinedOffers,
    storeFilter,
    usdaResult.overrides,
    activeStores
  );
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
    adCycleLabel: 'Wed Oct 14 – Tue Oct 20, 2026 (Active Weekend Cycle)',
    lastUpdatedIso: new Date().toISOString(),
    dataSourcesActive: {
      flippLive: flippResult.liveSuccess,
      usdaLive: usdaResult.usdaLive,
      krogerLive: krogerResult.krogerLive,
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
