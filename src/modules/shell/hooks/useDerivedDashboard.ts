import { useState, useMemo, useEffect, type RefObject } from 'react';
import { createPantryPriceContext } from '@/lib/pantry/pricing';
import { applyPantryToRecipe } from '@/lib/pantry/recipe';
import { rankMealPrepDishes } from '@/lib/meal-prep-matcher';
import { buildShoppingListAndStoreComparison } from '@/lib/shopping-list';
import type { useAccountAndPantry } from '@/modules/shell/hooks/useAccountAndPantry';
import type {
  CommodityCategory, CookingVesselArchetype, DashboardPayload, DietaryConstraint, MacroGoal, RecommendedDish, StoreChain,
} from '@/types/domain';

// Moved verbatim from MealPrepDashboard (v2.0 M3 Phase B.1a): the price clock and the derived-data chain. It owns no
// state the user can change: everything it reads is passed in, and the customAiDishes inputs are read here because
// the plan's AI choice feeds activeTrio, then the shopping list, so the chain has to sit above both Shop and Plan.
// Keep two things when editing:
//  1. The customAiOwner and customAiContext refs are read during render (sourceTrio), exactly as before, to decide
//     whether a generated plan is stale.
//  2. Hook order: the dashboard calls this where the price clock used to be, so the clock effect still runs before the
//     AI request fence effect and the mount restore effect.
interface DerivedDashboardArgs {
  serverData: DashboardPayload;
  pinnedIds: string[];
  effectiveOnHandIds: string[];
  targetServings: 4 | 6 | 8;
  macroGoal: MacroGoal;
  dietaryConstraints: DietaryConstraint[];
  applianceFilter: CookingVesselArchetype;
  activeStores: StoreChain[];
  storeFilter: 'ALL' | StoreChain;
  currentZip: string;
  savedLibrary: ReturnType<typeof useAccountAndPantry>['savedLibrary'];
  pantryOwner: ReturnType<typeof useAccountAndPantry>['pantry']['owner'];
  pantryGuest: boolean;
  customPrompt: string;
  customAiDishes: RecommendedDish[] | null;
  customAiOwner: RefObject<string | null>;
  customAiContext: RefObject<string>;
  categoryFilter: 'ALL' | CommodityCategory;
  sortMode: 'VALUE_SCORE' | 'LOWEST_PRICE' | 'BIGGEST_DISCOUNT';
  tripMode: 'SPLIT' | StoreChain;
}

export function useDerivedDashboard({
  serverData, pinnedIds, effectiveOnHandIds, targetServings, macroGoal, dietaryConstraints, applianceFilter, activeStores,
  storeFilter, currentZip, savedLibrary, pantryOwner, pantryGuest, customPrompt, customAiDishes, customAiOwner, customAiContext,
  categoryFilter, sortMode, tripMode,
}: DerivedDashboardArgs) {
  const [priceClock, setPriceClock] = useState(serverData.lastUpdatedIso);
  useEffect(() => {
    const refresh = () => setPriceClock(new Date().toISOString());
    refresh();
    const timer = window.setInterval(refresh, 60_000);
    window.addEventListener('focus', refresh);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, []);
  // No live source, contract or admission is configured. One snapshot serves every view.
  const pantryPriceContext = useMemo(() => createPantryPriceContext({
    nowIso: priceClock || new Date().toISOString(), marketId: currentZip,
    selectedLocationIds: [],
  }), [priceClock, currentZip]);
  const mealContextSignature = JSON.stringify({ available: [...effectiveOnHandIds].sort(), pinned: [...pinnedIds].sort(),
    targetServings, macroGoal, dietary: [...dietaryConstraints].sort(), vessel: applianceFilter,
    stores: [...activeStores].sort(), storeFilter, zip: currentZip, customPreference: customPrompt });

  const data = useMemo(() => {

    const ranked = rankMealPrepDishes(serverData.commodities, pinnedIds, effectiveOnHandIds, targetServings, {
      macroGoal, dietaryConstraints, applianceFilter,
      pantryPriceContext,
      savedRecipes: savedLibrary.owner === pantryOwner || (savedLibrary.owner === 'guest:ssr' && pantryGuest) ? savedLibrary.recipes : [],
      now: new Date(serverData.lastUpdatedIso || Date.now()),
    });
    return { ...serverData, ...ranked };
  }, [serverData, pinnedIds, effectiveOnHandIds, targetServings, macroGoal, dietaryConstraints, applianceFilter, savedLibrary, pantryOwner, pantryGuest, pantryPriceContext]);

  const filteredCommodities = useMemo(() => {
    const list = data.commodities.filter((c) => {
      if (categoryFilter === 'ALL') return true;
      return c.ingredient.category === categoryFilter;
    });

    return [...list].sort((a, b) => {
      if (sortMode === 'LOWEST_PRICE') {
        return a.bestOffer.normalizedPricePerUnit - b.bestOffer.normalizedPricePerUnit;
      }
      if (sortMode === 'BIGGEST_DISCOUNT') {
        return b.discountVsRegularPct - a.discountVsRegularPct;
      }
      return b.valueScore - a.valueScore;
    });
  }, [data.commodities, categoryFilter, sortMode]);

  const sourceTrio = ((customAiOwner.current !== pantryOwner || customAiContext.current !== mealContextSignature)
    ? null : customAiDishes) || data.recommendedTrio;
  const activeTrio = useMemo(() => sourceTrio.map((dish) =>
    applyPantryToRecipe(dish, effectiveOnHandIds, data.commodities, undefined, pantryPriceContext)),
  [sourceTrio, effectiveOnHandIds, data.commodities, pantryPriceContext]);

  const trioTotals = useMemo(() => {
    const totalBatchCost = activeTrio.reduce((acc, d) => acc + d.totalBatchCost, 0);
    const totalRegularCost = activeTrio.reduce((acc, d) => acc + d.regularBatchCost, 0);
    const totalSavings = Math.max(0, totalRegularCost - totalBatchCost);
    const totalServings =
      activeTrio.reduce((acc, d) => acc + d.servings, 0) || targetServings * 3;
    const avgPerServing = totalBatchCost / totalServings;

    return {
      totalBatchCost: totalBatchCost.toFixed(2),
      totalRegularCost: totalRegularCost.toFixed(2),
      totalSavings: totalSavings.toFixed(2),
      totalServings,
      avgPerServing: avgPerServing.toFixed(2),
    };
  }, [activeTrio, targetServings]);

  // v0.3 + v0.4 + v1.1 + v1.2 Aggregated Shopping List, Coupon Pre-Flight, and Store Trip Optimizer
  const shoppingPlan = useMemo(
    () =>
      buildShoppingListAndStoreComparison(
        activeTrio,
        data.commodities,
        effectiveOnHandIds,
        data.zipCode || currentZip,
        activeStores,
        pantryPriceContext,
      ),
    [
      activeTrio,
      data.commodities,
      effectiveOnHandIds,
      data.zipCode,
      currentZip,
      activeStores,
      pantryPriceContext,
    ]
  );

  const resolvedShoppingItems = useMemo(() => {
    return shoppingPlan.items.map((item) => {
      const store: StoreChain =
        tripMode === 'SPLIT' ? item.optimalStore : tripMode;

      const sp = item.storePricing?.[store];
      const unitCost =
        sp?.unitCost ??
        (store === 'KING_SOOPERS'
          ? item.kingSoopersUnitCost
          : store === 'SAFEWAY'
            ? item.safewayUnitCost
            : item.optimalUnitCost);
      const totalCost = item.isOnHand
        ? 0
        : sp?.totalCost ??
          (store === 'KING_SOOPERS'
            ? item.kingSoopersTotalCost
            : store === 'SAFEWAY'
              ? item.safewayTotalCost
              : item.optimalTotalCost);
      const rawDealText = item.isOnHand
        ? 'Already have'
        : sp?.rawDealText ??
          (store === 'KING_SOOPERS'
            ? item.kingSoopersRawDealText
            : store === 'SAFEWAY'
              ? item.safewayRawDealText
              : item.optimalRawDealText);
      const dealType =
        sp?.dealType ??
        (store === 'KING_SOOPERS'
          ? item.kingSoopersDealType
          : store === 'SAFEWAY'
            ? item.safewayDealType
            : item.optimalDealType);
      const dealConditions =
        sp?.dealConditions ??
        (store === 'KING_SOOPERS'
          ? item.kingSoopersDealConditions
          : store === 'SAFEWAY'
            ? item.safewayDealConditions
            : item.optimalDealConditions);

      return {
        ...item,
        ingredientName: sp?.ingredientName ?? item.ingredientName,
        activeStore: store,
        activeUnitCost: unitCost,
        activeTotalCost: totalCost,
        activeRawDealText: rawDealText,
        activeDealType: dealType,
        activeDealConditions: dealConditions,
      };
    });
  }, [shoppingPlan.items, tripMode]);

  const digitalCouponItems = useMemo(
    () =>
      resolvedShoppingItems.filter(
        (i) =>
          !i.isOnHand &&
          (i.activeDealType === 'DIGITAL_COUPON' || i.activeDealType === 'MULTI_BUY')
      ),
    [resolvedShoppingItems]
  );

  return { data, filteredCommodities, activeTrio, trioTotals, shoppingPlan, resolvedShoppingItems, digitalCouponItems,
    mealContextSignature };
}
