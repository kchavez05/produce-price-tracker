import {
  AggregatedShoppingItem,
  RecommendedDish,
  ScoredCommodity,
  StoreChain,
  StoreTripComparison,
} from '@/types/domain';

export function buildShoppingListAndStoreComparison(
  activeDishes: RecommendedDish[],
  commodities: ScoredCommodity[]
): {
  items: AggregatedShoppingItem[];
  pantryChecklist: string[];
  tripComparison: StoreTripComparison;
} {
  const commodityMap = new Map<string, ScoredCommodity>();
  for (const c of commodities) {
    commodityMap.set(c.ingredient.id, c);
  }

  const itemMap = new Map<string, AggregatedShoppingItem>();
  const pantrySet = new Set<string>();
  let estimatedPantryTotal = 0;

  for (const dish of activeDishes) {
    estimatedPantryTotal += dish.estimatedPantryCost || 0;
    for (const p of dish.pantryStaples || []) {
      pantrySet.add(p);
    }

    for (const slotIng of dish.matchedIngredients) {
      const existing = itemMap.get(slotIng.ingredientId);
      if (existing) {
        existing.totalQuantityNeeded = Number(
          (existing.totalQuantityNeeded + slotIng.quantityUsed).toFixed(2)
        );
        existing.usedInDishes.push({
          dishTitle: dish.title,
          quantity: slotIng.quantityUsed,
        });
        existing.optimalTotalCost = Number(
          (existing.totalQuantityNeeded * existing.optimalUnitCost).toFixed(2)
        );
        existing.kingSoopersTotalCost = Number(
          (existing.totalQuantityNeeded * existing.kingSoopersUnitCost).toFixed(2)
        );
        existing.safewayTotalCost = Number(
          (existing.totalQuantityNeeded * existing.safewayUnitCost).toFixed(2)
        );
        existing.regularTotalCost = Number(
          (
            existing.totalQuantityNeeded *
            (existing.regularTotalCost /
              Math.max(0.1, existing.totalQuantityNeeded - slotIng.quantityUsed))
          ).toFixed(2)
        );
        continue;
      }

      const scored = commodityMap.get(slotIng.ingredientId);
      const ksOffer = scored?.kingSoopersOffer || scored?.bestOffer;
      const swOffer = scored?.safewayOffer || scored?.bestOffer;
      const bestOffer = scored?.bestOffer;

      const optimalUnitCost = bestOffer?.normalizedPricePerUnit ?? slotIng.unitCost;
      const ksUnitCost = ksOffer?.normalizedPricePerUnit ?? slotIng.unitCost;
      const swUnitCost = swOffer?.normalizedPricePerUnit ?? slotIng.unitCost;
      const regUnitCost =
        bestOffer?.regularPricePerUnit ??
        Number((slotIng.regularSlotCost / Math.max(0.25, slotIng.quantityUsed)).toFixed(2));

      const optimalStore: StoreChain =
        ksUnitCost <= swUnitCost ? 'KING_SOOPERS' : 'SAFEWAY';

      itemMap.set(slotIng.ingredientId, {
        ingredientId: slotIng.ingredientId,
        ingredientName: slotIng.ingredientName,
        category: scored?.ingredient.category || 'PRODUCE',
        subcategory: scored?.ingredient.subcategory || 'Staple',
        totalQuantityNeeded: slotIng.quantityUsed,
        unit: slotIng.unit,
        usedInDishes: [{ dishTitle: dish.title, quantity: slotIng.quantityUsed }],
        optimalStore,
        optimalUnitCost,
        optimalTotalCost: Number((slotIng.quantityUsed * optimalUnitCost).toFixed(2)),
        optimalRawDealText: bestOffer?.rawPriceText || slotIng.rawDealText,
        optimalDealType: bestOffer?.dealType || slotIng.dealType,
        optimalDealConditions: bestOffer?.dealConditions || slotIng.dealConditions,
        kingSoopersUnitCost: ksUnitCost,
        kingSoopersTotalCost: Number((slotIng.quantityUsed * ksUnitCost).toFixed(2)),
        kingSoopersRawDealText: ksOffer?.rawPriceText || slotIng.rawDealText,
        kingSoopersDealType: ksOffer?.dealType || slotIng.dealType,
        kingSoopersDealConditions: ksOffer?.dealConditions,
        safewayUnitCost: swUnitCost,
        safewayTotalCost: Number((slotIng.quantityUsed * swUnitCost).toFixed(2)),
        safewayRawDealText: swOffer?.rawPriceText || slotIng.rawDealText,
        safewayDealType: swOffer?.dealType || slotIng.dealType,
        safewayDealConditions: swOffer?.dealConditions,
        regularTotalCost: Number((slotIng.quantityUsed * regUnitCost).toFixed(2)),
      });
    }
  }

  const items = Array.from(itemMap.values()).sort((a, b) => {
    const order = { PROTEIN: 0, PRODUCE: 1, DAIRY_EGGS: 2 };
    if (order[a.category] !== order[b.category]) {
      return order[a.category] - order[b.category];
    }
    return b.optimalTotalCost - a.optimalTotalCost;
  });

  const optimalStoreSum = items.reduce((acc, i) => acc + i.optimalTotalCost, 0);
  const ksStoreSum = items.reduce((acc, i) => acc + i.kingSoopersTotalCost, 0);
  const swStoreSum = items.reduce((acc, i) => acc + i.safewayTotalCost, 0);
  const regularStoreSum = items.reduce((acc, i) => acc + i.regularTotalCost, 0);

  const pantryRounded = Number(estimatedPantryTotal.toFixed(2));
  const optimalSplitTotal = Number((optimalStoreSum + pantryRounded).toFixed(2));
  const kingSoopersOnlyTotal = Number((ksStoreSum + pantryRounded).toFixed(2));
  const safewayOnlyTotal = Number((swStoreSum + pantryRounded).toFixed(2));
  const regularShelfTotal = Number((regularStoreSum + pantryRounded).toFixed(2));

  const bestSingleStore: StoreChain =
    kingSoopersOnlyTotal <= safewayOnlyTotal ? 'KING_SOOPERS' : 'SAFEWAY';
  const bestSingleStoreTotal = Math.min(kingSoopersOnlyTotal, safewayOnlyTotal);
  const otherSingleStoreTotal = Math.max(kingSoopersOnlyTotal, safewayOnlyTotal);
  const singleStoreDiff = Number(
    (otherSingleStoreTotal - bestSingleStoreTotal).toFixed(2)
  );
  const extraSavingsFromSplitting = Number(
    Math.max(0, bestSingleStoreTotal - optimalSplitTotal).toFixed(2)
  );

  const bestStoreName =
    bestSingleStore === 'KING_SOOPERS' ? 'King Soopers' : 'Safeway';

  let recommendationHeadline = '';
  let recommendationDetail = '';

  if (extraSavingsFromSplitting >= 3.5) {
    recommendationHeadline = `Splitting stores saves an extra $${extraSavingsFromSplitting.toFixed(2)} this weekend`;
    recommendationDetail = `Optimal 2-store split is $${optimalSplitTotal.toFixed(2)} vs. $${bestSingleStoreTotal.toFixed(2)} at ${bestStoreName} alone ($${singleStoreDiff.toFixed(2)} cheaper than the runner-up store).`;
  } else {
    recommendationHeadline = `1-Stop at ${bestStoreName} is the sweet spot ($${bestSingleStoreTotal.toFixed(2)})`;
    recommendationDetail = `Splitting stores only saves $${extraSavingsFromSplitting.toFixed(2)} more than doing a single trip to ${bestStoreName}—and ${bestStoreName} beats the other chain by $${singleStoreDiff.toFixed(2)}.`;
  }

  return {
    items,
    pantryChecklist: Array.from(pantrySet),
    tripComparison: {
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
    },
  };
}
