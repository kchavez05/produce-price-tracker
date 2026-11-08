import { qualifiedExactCommodity } from './pantry/commodity-offers';
import { requiresExactOffer } from './pantry/exact-offer';
import {
  ALL_STORE_CHAINS,
  resolveStoreBanner,
} from '@/data/store-registry';
import {
  AggregatedShoppingItem,
  DealType,
  RecommendedDish,
  ScoredCommodity,
  StoreChain,
  StoreTripComparison,
} from '@/types/domain';
import { PantryRequirement, PantryShoppingNeed } from '@/types/pantry';
import { recipeAvailableIngredientIds, recipePantryIngredientId } from '@/lib/pantry/recipe-identity';
import { applyPantryToRecipe, formatPantryRequirement, pantryShoppingNeeds, recipePantryRequirements } from '@/lib/pantry/recipe';
import { recipeCommodity, resolveRecipeUse, matchedRecipeRequirement, recipeIngredientExcluded } from '@/lib/pantry/recipe-use';
import { recipeUseRequirementId } from '@/lib/pantry/recipe-identity';

export function buildShoppingListAndStoreComparison(
  activeDishes: RecommendedDish[],
  commodities: ScoredCommodity[],
  onHandIngredientIds: string[] = [],
  zipCode: string = '80542',
  activeStoresList?: StoreChain[],
  pantryMode = activeDishes.some((dish) => Array.isArray(dish.pantryRequirements)),
): {
  items: AggregatedShoppingItem[];
  pantryChecklist: string[];
  tripComparison: StoreTripComparison;
  pantryNeeds: PantryShoppingNeed[];
} {
  const legacyRequirements: PantryRequirement[] = [];
  if (!pantryMode) {
    const source = new Map(commodities.map((c) => [c.ingredient.id, c]));
    activeDishes = activeDishes.map((dish) => ({ ...dish, matchedIngredients: dish.matchedIngredients.flatMap((item) => {
      if (!requiresExactOffer(item.ingredientId) && !recipeIngredientExcluded(dish.id,item.ingredientId)) return [item];
      const excluded = recipeIngredientExcluded(dish.id,item.ingredientId);
      if (!excluded && (item.isOnHand || onHandIngredientIds.includes(item.ingredientId))) return [item];
      const qualified = recipeCommodity(dish,item,source.get(item.ingredientId));
      if (!qualified || !Number.isFinite(item.quantityUsed) || item.quantityUsed < 0) {
        legacyRequirements.push(matchedRecipeRequirement(dish,item));
        return [];
      }
      return [{ ...item, store: qualified.bestOffer.store, unitCost: qualified.bestOffer.normalizedPricePerUnit,
        slotCost: Number((item.quantityUsed * qualified.bestOffer.normalizedPricePerUnit).toFixed(2)),
        rawDealText: `${qualified.bestOffer.rawTitle} — ${qualified.bestOffer.rawPriceText}` }];
    }) }));
  }
  commodities = commodities.flatMap((c) => { const qualified = qualifiedExactCommodity(c); return qualified ? [qualified] : []; });
  // Project only reviewed recipe uses. Store prices retain their original offer provenance;
  // separate scopes cannot aggregate into a cheaper, incompatible vegetable requirement.
  if (pantryMode) {
    const original = new Map(commodities.map((c) => [c.ingredient.id, c]));
    const scoped = new Map<string, ScoredCommodity>();
    activeDishes = activeDishes.map((input) => {
      const dish = applyPantryToRecipe(input, onHandIngredientIds, commodities);
      return { ...dish, matchedIngredients: dish.matchedIngredients.map((ingredient) => {
        const use = resolveRecipeUse(dish, ingredient);
        const commodity = recipeCommodity(dish, ingredient, original.get(ingredient.ingredientId));
        if (!use || !commodity) return ingredient;
        const id = recipeUseRequirementId(use);
        scoped.set(id, { ...commodity, ingredient: { ...commodity.ingredient, id, name: use.displayName } });
        return { ...ingredient, ingredientId: id, ingredientName: use.displayName };
      }) };
    });
    commodities = [...commodities, ...scoped.values()];
  }
  const commodityMap = new Map<string, ScoredCommodity>();
  for (const c of commodities) {
    commodityMap.set(c.ingredient.id, c);
  }
  function hasVerifiedPrice(ingredientId: string, chain: StoreChain): boolean {
    const scored = commodityMap.get(ingredientId);
    const offer = scored?.storeOffers?.[chain] ||
      (chain === 'KING_SOOPERS' ? scored?.kingSoopersOffer : undefined) ||
      (chain === 'SAFEWAY' ? scored?.safewayOffer : undefined);
    return Boolean(offer && offer.source !== 'CURATED_FALLBACK');
  }
  const onHandSet = new Set(pantryMode ? recipeAvailableIngredientIds(onHandIngredientIds) : onHandIngredientIds);

  const activeStores: StoreChain[] =
    activeStoresList && activeStoresList.length > 0
      ? activeStoresList
      : ALL_STORE_CHAINS;

  const itemMap = new Map<string, AggregatedShoppingItem>();
  const pantrySet = new Set<string>();
  let estimatedPantryTotal = 0;
  const requirements: PantryRequirement[] = [];
  const missingScopedStorePrices = new Set<string>();

  for (const dish of activeDishes) {
    if (pantryMode) {
      requirements.push(...recipePantryRequirements(dish));
    } else {
      estimatedPantryTotal += dish.estimatedPantryCost || 0;
      for (const p of dish.pantryStaples || []) pantrySet.add(p);
    }

    for (const slotIng of dish.matchedIngredients) {
      const isOnHand = pantryMode ? onHandSet.has(slotIng.ingredientId) : Boolean(slotIng.isOnHand || onHandSet.has(slotIng.ingredientId));
      if (pantryMode && (isOnHand || slotIng.optional)) continue;
      if (pantryMode && (!commodityMap.has(slotIng.ingredientId) || !Number.isFinite(slotIng.quantityUsed) || slotIng.quantityUsed < 0 ||
        commodityMap.get(slotIng.ingredientId)?.ingredient.standardUnit !== slotIng.unit)) {
        requirements.push({ ingredientId: recipePantryIngredientId(slotIng.ingredientId), displayName: slotIng.ingredientName,
          quantity: Number.isFinite(slotIng.quantityUsed) && slotIng.quantityUsed >= 0 ? slotIng.quantityUsed : 1,
          unit: Number.isFinite(slotIng.quantityUsed) && slotIng.quantityUsed >= 0 ? slotIng.unit : '' });
        continue;
      }
      const existing = itemMap.get(slotIng.ingredientId);

      if (existing) {
        const prevQty = existing.totalQuantityNeeded;
        existing.totalQuantityNeeded = Number(
          (existing.totalQuantityNeeded + slotIng.quantityUsed).toFixed(2)
        );
        existing.usedInDishes.push({
          dishTitle: dish.title,
          quantity: slotIng.quantityUsed,
        });
        existing.isOnHand = isOnHand;

        existing.optimalTotalCost = isOnHand
          ? 0
          : Number((existing.totalQuantityNeeded * existing.optimalUnitCost).toFixed(2));
        existing.kingSoopersTotalCost = isOnHand
          ? 0
          : Number((existing.totalQuantityNeeded * existing.kingSoopersUnitCost).toFixed(2));
        existing.safewayTotalCost = isOnHand
          ? 0
          : Number((existing.totalQuantityNeeded * existing.safewayUnitCost).toFixed(2));

        if (existing.storePricing) {
          for (const s of ALL_STORE_CHAINS) {
            const sp = existing.storePricing[s];
            if (sp) {
              sp.totalCost = isOnHand
                ? 0
                : Number((existing.totalQuantityNeeded * sp.unitCost).toFixed(2));
            }
          }
        }

        const regUnit = existing.regularTotalCost / Math.max(0.1, prevQty);
        existing.regularTotalCost = Number(
          (existing.totalQuantityNeeded * regUnit).toFixed(2)
        );
        continue;
      }

      const scored = commodityMap.get(slotIng.ingredientId);
      const offersByStore = scored?.storeOffers || {};

      // Compute pricing across all store chains
      const storePricing: Partial<
        Record<
          StoreChain,
          {
            unitCost: number;
            totalCost: number;
            rawDealText: string;
            dealType: DealType;
            dealConditions?: string;
          }
        >
      > = {};

      for (const chain of ALL_STORE_CHAINS) {
        const offer =
          offersByStore[chain] ||
          (chain === 'KING_SOOPERS' ? scored?.kingSoopersOffer : undefined) ||
          (chain === 'SAFEWAY' ? scored?.safewayOffer : undefined);

        const unitCost = offer?.normalizedPricePerUnit ?? slotIng.unitCost;
        const scopedEstimate = pantryMode && (slotIng.ingredientId.startsWith('recipe-use:') || requiresExactOffer(slotIng.ingredientId)) && !offer;
        if (scopedEstimate && activeStores.includes(chain)) missingScopedStorePrices.add(slotIng.ingredientId);
        const totalCost = isOnHand
          ? 0
          : Number((slotIng.quantityUsed * unitCost).toFixed(2));

        storePricing[chain] = {
          ...(pantryMode && (slotIng.ingredientId.startsWith('recipe-use:') || requiresExactOffer(slotIng.ingredientId)) ? { ingredientName: (offer ?? scored?.bestOffer)?.rawTitle } : {}),
          unitCost,
          totalCost,
          rawDealText: isOnHand
            ? '❄️ Already On-Hand in Freezer/Pantry ($0.00 out-of-pocket)'
            : scopedEstimate ? `Price unavailable at this store; estimate from ${slotIng.store}` : offer?.rawPriceText || slotIng.rawDealText,
          dealType: scopedEstimate ? 'SHELF_OR_MEMBER' : offer?.dealType || slotIng.dealType,
          dealConditions: scopedEstimate ? undefined : offer?.dealConditions || slotIng.dealConditions,
        };
      }

      // Determine optimal store from the active store pool
      let optimalStore: StoreChain = activeStores[0] || 'ALDI';
      let minUnitCost = Infinity;

      const liveStores = activeStores.filter((chain) => {
        return hasVerifiedPrice(slotIng.ingredientId, chain);
      });
      for (const chain of (liveStores.length > 0 ? liveStores : activeStores)) {
        const p = storePricing[chain];
        if (p && p.unitCost < minUnitCost) {
          minUnitCost = p.unitCost;
          optimalStore = chain;
        }
      }

      const bestStorePricing = storePricing[optimalStore]!;
      const ksPricing = storePricing['KING_SOOPERS']!;
      const swPricing = storePricing['SAFEWAY']!;

      const regUnitCost =
        scored?.bestOffer?.regularPricePerUnit ??
        Number((slotIng.regularSlotCost / Math.max(0.25, slotIng.quantityUsed)).toFixed(2));

      itemMap.set(slotIng.ingredientId, {
        ingredientId: slotIng.ingredientId,
        ingredientName: slotIng.ingredientName,
        category: scored?.ingredient.category || 'PRODUCE',
        subcategory: scored?.ingredient.subcategory || 'Staple',
        totalQuantityNeeded: slotIng.quantityUsed,
        unit: slotIng.unit,
        usedInDishes: [{ dishTitle: dish.title, quantity: slotIng.quantityUsed }],
        isOnHand,
        optimalStore,
        optimalUnitCost: minUnitCost < Infinity ? minUnitCost : slotIng.unitCost,
        optimalTotalCost: isOnHand
          ? 0
          : Number((slotIng.quantityUsed * (minUnitCost < Infinity ? minUnitCost : slotIng.unitCost)).toFixed(2)),
        optimalRawDealText: bestStorePricing.rawDealText,
        optimalDealType: bestStorePricing.dealType,
        optimalDealConditions: bestStorePricing.dealConditions,
        storePricing,
        // Legacy backward compatibility
        kingSoopersUnitCost: ksPricing.unitCost,
        kingSoopersTotalCost: ksPricing.totalCost,
        kingSoopersRawDealText: ksPricing.rawDealText,
        kingSoopersDealType: ksPricing.dealType,
        kingSoopersDealConditions: ksPricing.dealConditions,
        safewayUnitCost: swPricing.unitCost,
        safewayTotalCost: swPricing.totalCost,
        safewayRawDealText: swPricing.rawDealText,
        safewayDealType: swPricing.dealType,
        safewayDealConditions: swPricing.dealConditions,
        regularTotalCost: Number((slotIng.quantityUsed * regUnitCost).toFixed(2)),
      });
    }
  }

  const pantryNeeds = (pantryMode || legacyRequirements.length) ? pantryShoppingNeeds([...requirements,...legacyRequirements], [...onHandSet]) : [];
  if (pantryMode) {
    estimatedPantryTotal = pantryNeeds.reduce((sum, need) => sum + (need.estimatedCost ?? 0), 0);
    for (const need of pantryNeeds) pantrySet.add(`${formatPantryRequirement(need)} — ${need.estimatedCost === null ? 'price unavailable' : `$${need.estimatedCost.toFixed(2)} fixed estimate`}`);
  }
  if (!pantryMode) for (const need of pantryNeeds) pantrySet.add(`${formatPantryRequirement(need)} — price unavailable`);
  const missingPriceIngredientIds = [...new Set([...pantryNeeds.filter((need) => need.estimatedCost === null).map((need) => need.ingredientId), ...missingScopedStorePrices])];
  const items = Array.from(itemMap.values()).sort((a, b) => {
    if (a.isOnHand !== b.isOnHand) return a.isOnHand ? 1 : -1;
    const order = { PROTEIN: 0, PRODUCE: 1, DAIRY_EGGS: 2 };
    if (order[a.category] !== order[b.category]) {
      return order[a.category] - order[b.category];
    }
    return b.optimalTotalCost - a.optimalTotalCost;
  });

  const pantryRounded = Number(estimatedPantryTotal.toFixed(2));
  const optimalStoreSum = items.reduce((acc, i) => acc + i.optimalTotalCost, 0);
  const optimalSplitTotal = Number((optimalStoreSum + pantryRounded).toFixed(2));
  const regularStoreSum = items.reduce((acc, i) => acc + i.regularTotalCost, 0);
  const regularShelfTotal = Number((regularStoreSum + pantryRounded).toFixed(2));

  // Compute store totals across all chains
  const storeTotals: Partial<Record<StoreChain, number>> = {};
  for (const chain of ALL_STORE_CHAINS) {
    const chainSum = items.reduce((acc, i) => {
      const p = i.storePricing?.[chain];
      return acc + (p?.totalCost ?? i.optimalTotalCost);
    }, 0);
    storeTotals[chain] = Number((chainSum + pantryRounded).toFixed(2));
  }

  const kingSoopersOnlyTotal = storeTotals['KING_SOOPERS'] || 0;
  const safewayOnlyTotal = storeTotals['SAFEWAY'] || 0;

  // Compute ranked 1-stop leaderboard
  const singleStoreRankings = activeStores
    .map((chain) => {
      const total = storeTotals[chain] || 0;
      return {
        store: chain,
        storeName: resolveStoreBanner(chain, zipCode),
        total,
        verifiedItemCount: items.filter((item) => !item.isOnHand && hasVerifiedPrice(item.ingredientId, chain)).length,
        diffFromBest: 0,
        isBest: false,
      };
    })
    .sort((a, b) => b.verifiedItemCount - a.verifiedItemCount || a.total - b.total);

  const bestSingle = singleStoreRankings[0];
  const bestSingleStore: StoreChain = bestSingle?.store || 'ALDI';
  const bestSingleStoreTotal = bestSingle?.total || 0;

  for (const r of singleStoreRankings) {
    r.diffFromBest = Number((r.total - bestSingleStoreTotal).toFixed(2));
    r.isBest = r.store === bestSingleStore;
  }

  // Calculate Optimal 2-Store Split among active stores
  let bestTwoPair: [StoreChain, StoreChain] = [activeStores[0], activeStores[1] || activeStores[0]];
  let bestTwoSplitTotal = Infinity;
  let bestTwoVerifiedCount = -1;
  let bestTwoCounts: Record<StoreChain, number> = {} as Record<StoreChain, number>;

  for (let i = 0; i < activeStores.length; i++) {
    for (let j = i + 1; j < activeStores.length; j++) {
      const storeA = activeStores[i];
      const storeB = activeStores[j];
      let pairSum = 0;
      let verifiedCount = 0;
      const counts: Record<string, number> = { [storeA]: 0, [storeB]: 0 };

      for (const item of items) {
        if (item.isOnHand) continue;
        const costA = item.storePricing?.[storeA]?.totalCost ?? item.optimalTotalCost;
        const costB = item.storePricing?.[storeB]?.totalCost ?? item.optimalTotalCost;
        const verifiedA = hasVerifiedPrice(item.ingredientId, storeA);
        const verifiedB = hasVerifiedPrice(item.ingredientId, storeB);
        if (verifiedA || verifiedB) verifiedCount++;
        if ((verifiedA && !verifiedB) || (verifiedA === verifiedB && costA <= costB)) {
          pairSum += costA;
          counts[storeA]++;
        } else {
          pairSum += costB;
          counts[storeB]++;
        }
      }

      const totalWithPantry = Number((pairSum + pantryRounded).toFixed(2));
      if (verifiedCount > bestTwoVerifiedCount ||
          (verifiedCount === bestTwoVerifiedCount && totalWithPantry < bestTwoSplitTotal)) {
        bestTwoVerifiedCount = verifiedCount;
        bestTwoSplitTotal = totalWithPantry;
        bestTwoPair = [storeA, storeB];
        bestTwoCounts = counts as Record<StoreChain, number>;
      }
    }
  }

  const nameA = resolveStoreBanner(bestTwoPair[0], zipCode);
  const nameB = resolveStoreBanner(bestTwoPair[1], zipCode);
  const countA = bestTwoCounts[bestTwoPair[0]] || 0;
  const countB = bestTwoCounts[bestTwoPair[1]] || 0;

  const savingsVsBestSingle = Number(
    Math.max(0, bestSingleStoreTotal - bestTwoSplitTotal).toFixed(2)
  );

  const bestTwoStoreSplit = {
    stores: bestTwoPair,
    storeNames: [nameA, nameB] as [string, string],
    total: bestTwoSplitTotal < Infinity ? bestTwoSplitTotal : optimalSplitTotal,
    savingsVsBestSingle,
    splitSummary: `Buy ${countA} items at ${nameA} and ${countB} items at ${nameB}`,
  };

  const extraSavingsFromSplitting = savingsVsBestSingle;
  const bestStoreName = resolveStoreBanner(bestSingleStore, zipCode);

  let recommendationHeadline = '';
  let recommendationDetail = '';

  if (bestTwoVerifiedCount > (bestSingle?.verifiedItemCount ?? 0)) {
    recommendationHeadline = `Splitting ${nameA} + ${nameB} covers more items with verified prices`;
    recommendationDetail = `The split budget is $${bestTwoSplitTotal.toFixed(2)}; historical estimates are used only where this pair has no live coverage.`;
  } else if (extraSavingsFromSplitting >= 3.5) {
    recommendationHeadline = `Splitting ${nameA} + ${nameB} saves an extra $${extraSavingsFromSplitting.toFixed(2)} this weekend`;
    recommendationDetail = `Optimal 2-store split is $${bestTwoSplitTotal.toFixed(2)} vs. $${bestSingleStoreTotal.toFixed(2)} at ${bestStoreName} alone.`;
  } else {
    recommendationHeadline = `1-Stop at ${bestStoreName} is the sweet spot ($${bestSingleStoreTotal.toFixed(2)})`;
    recommendationDetail = `Splitting stores only saves $${extraSavingsFromSplitting.toFixed(2)} more than doing a single trip to ${bestStoreName}.`;
  }

  if (missingScopedStorePrices.size) recommendationDetail += ' Some store prices are unavailable; estimates from another store are labeled and are not verified offers at this store.';

  return {
    items,
    pantryChecklist: Array.from(pantrySet),
    pantryNeeds,
    tripComparison: {
      ...((pantryMode || legacyRequirements.length > 0) ? { additionalCostEstimateComplete: missingPriceIngredientIds.length === 0, missingPriceIngredientIds } : {}),
      optimalSplitTotal,
      kingSoopersOnlyTotal,
      safewayOnlyTotal,
      regularShelfTotal,
      estimatedPantryTotal: pantryRounded,
      bestSingleStore,
      bestSingleStoreTotal,
      extraSavingsFromSplitting,
      recommendationHeadline,
      recommendationDetail,
      storeTotals,
      singleStoreRankings,
      bestTwoStoreSplit,
    },
  };
}
