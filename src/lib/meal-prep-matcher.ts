import { createPantryPriceContext, PantryPriceContext } from '@/lib/pantry/pricing';
import { MEAL_PREP_BLUEPRINTS } from '@/data/meal-prep-blueprints';
import { currentAdCycle } from '@/lib/offer-freshness';
import { selectRecipeStaples } from '@/data/recipe-staples';
import { applyPantryToRecipe, recipePantryRequirements } from '@/lib/pantry/recipe';
import { evaluatePantryRequirementsByIds } from '@/lib/pantry/requirements';
import { recipeAvailableIngredientIds, recipeUseRequirementId } from '@/lib/pantry/recipe-identity';
import { requiresExactOffer } from '@/lib/pantry/exact-offer';
import { pantryCatalog } from '@/lib/pantry/model';
import { recipeIngredientExcluded, recipeUseForSlot, scopedRecipeCommodity } from '@/lib/pantry/recipe-use';
import { CookingVesselArchetype, DietaryConstraint, MacroGoal, MatchedSlotIngredient, NutritionMacros, RecommendedDish, ScoredCommodity } from '@/types/domain';

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
    now?: Date;
    pantryMode?: boolean;
    pantryPriceContext?: PantryPriceContext;
  }
): {
  recommendedTrio: RecommendedDish[];
  allRankedDishes: RecommendedDish[];
} {
  if (!Number.isFinite(targetServings) || targetServings <= 0) targetServings = 6;
  const commodityMap = new Map<string, ScoredCommodity>();
  for (const sc of scoredCommodities) {
    commodityMap.set(sc.ingredient.id, sc);
  }

  const macroGoal: MacroGoal = options?.macroGoal || 'ANY';
  const dietaryConstraints: DietaryConstraint[] = options?.dietaryConstraints || [];
  const applianceFilter: CookingVesselArchetype = options?.applianceFilter || 'ANY';
  const pantryPriceContext = options?.pantryPriceContext ?? createPantryPriceContext({ nowIso: (options?.now ?? new Date()).toISOString() });
  const freezerSet = new Set(options?.pantryMode ? [] : options?.freezerIngredientIds || []);
  const pinnedSet = new Set(pinnedIngredientIds);
  const onHandSet = new Set([
    ...(options?.pantryMode ? recipeAvailableIngredientIds(onHandIngredientIds) : onHandIngredientIds),
    ...(options?.pantryMode ? [] : options?.freezerIngredientIds || []),
  ]);

  const savedDishesRaw = options?.savedRecipes || [];
  const savedIdsSet = new Set(savedDishesRaw.map((d) => d.id));

  const evaluated: RecommendedDish[] = [];

  for (const blueprint of MEAL_PREP_BLUEPRINTS) {
    if (options?.pantryMode && dietaryConstraints.includes('NUT_FREE') && !blueprint.dietaryTags?.includes('NUT_FREE')) continue;
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
    const missingRequirements = [];

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

      // Pantry evidence does not depend on a market quote. Consider an owned
      // reviewed alternative before dropping candidates absent from this store pool.
      const reviewedRequirement = (id: string) => {
        const use = recipeUseForSlot(blueprint.id, slot.label, id);
        if (use) return { marketIngredientId: id, ingredientId: recipeUseRequirementId(use), displayName: use.displayName };
        if (requiresExactOffer(id) && !recipeIngredientExcluded(blueprint.id, id)) {
          return { marketIngredientId: id, ingredientId: id, displayName: pantryCatalog.get(id)?.name ?? id };
        }
      };
      const ownedWithoutCommodity = options?.pantryMode ? activeCandidateIds
        .map(reviewedRequirement)
        .filter((requirement) => requirement && !commodityMap.has(requirement.marketIngredientId) && onHandSet.has(requirement.ingredientId))
        .sort((a, b) => Number(Boolean(b && pinnedSet.has(b.marketIngredientId))) - Number(Boolean(a && pinnedSet.has(a.marketIngredientId))))[0] : undefined;
      const hasPricedPin = activeCandidateIds.some((id) => commodityMap.has(id) && pinnedSet.has(id));
      if (ownedWithoutCommodity && (pinnedSet.has(ownedWithoutCommodity.marketIngredientId) || !hasPricedPin)) {
        missingRequirements.push({ ingredientId: ownedWithoutCommodity.ingredientId, displayName: ownedWithoutCommodity.displayName,
          quantity: Number((slot.quantityRequired * scaleFactor).toFixed(2)), unit: 'lb', ...(slot.optional ? { optional: true } : {}) });
        if (pinnedSet.has(ownedWithoutCommodity.marketIngredientId)) pinnedHits += 1;
        continue;
      }

      const usablePrices = new Set<string>();
      const candidateAvailabilityId = (id: string) => {
        const use = options?.pantryMode ? recipeUseForSlot(blueprint.id, slot.label, id) : undefined;
        return use ? recipeUseRequirementId(use) : id;
      };
      const candidates = activeCandidateIds
        .map((id) => commodityMap.get(id))
        .filter((c): c is ScoredCommodity => Boolean(c))
        .map((candidate) => {
          const use = options?.pantryMode ? recipeUseForSlot(blueprint.id, slot.label, candidate.ingredient.id) : undefined;
          const priced = use ? scopedRecipeCommodity(use, candidate) : candidate;
          if (priced) usablePrices.add(candidate.ingredient.id);
          return priced ?? { ...candidate, valueScore: 0 };
        });

      if (candidates.length === 0) {
        if (options?.pantryMode) {
          const requirements = activeCandidateIds.map(reviewedRequirement).filter((requirement) => Boolean(requirement));
          const requirement = requirements.find((r) => r && onHandSet.has(r.ingredientId)) ?? requirements[0];
          missingRequirements.push({ ingredientId: requirement?.ingredientId ?? `unmapped:${blueprint.id}:${slot.slotKey}`,
            displayName: requirement?.displayName ?? slot.label, quantity: Number((slot.quantityRequired * scaleFactor).toFixed(2)), unit: requirement ? 'lb' : '',
            ...(slot.optional ? { optional: true } : {}) });
        }
        continue;
      }

      // Sort candidates: Pinned first, then On-Hand in Freezer/Pantry ($0 marginal cost), then highest valueScore
      candidates.sort((a, b) => {
        const aPinned = pinnedSet.has(a.ingredient.id) ? 1 : 0;
        const bPinned = pinnedSet.has(b.ingredient.id) ? 1 : 0;
        if (aPinned !== bPinned) return bPinned - aPinned;

        const aOnHand = onHandSet.has(candidateAvailabilityId(a.ingredient.id)) ? 1 : 0;
        const bOnHand = onHandSet.has(candidateAvailabilityId(b.ingredient.id)) ? 1 : 0;
        if (aOnHand !== bOnHand) return bOnHand - aOnHand;
        if (options?.pantryMode && usablePrices.has(a.ingredient.id) !== usablePrices.has(b.ingredient.id)) return usablePrices.has(a.ingredient.id) ? -1 : 1;

        return b.valueScore - a.valueScore;
      });

      const chosen = candidates[0];
      const isUserPinned = pinnedSet.has(chosen.ingredient.id);
      const isOnHand = onHandSet.has(candidateAvailabilityId(chosen.ingredient.id));
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
        (options?.pantryMode && isOnHand ? 0 : chosen.bestOffer.regularPricePerUnit * scaledQty).toFixed(2)
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
        rawDealText: options?.pantryMode && isOnHand ? 'Already have' : fromVirtualFreezer
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
        ...(slot.optional ? { optional: true } : {}),
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

    const pantryRequirements = options?.pantryMode ? selectRecipeStaples(blueprint.id, [...onHandSet], targetServings, dietaryConstraints, pinnedIngredientIds).concat(missingRequirements) : undefined;
    const stapleEstimate = pantryRequirements ? evaluatePantryRequirementsByIds(pantryRequirements, [...onHandSet], pantryPriceContext) : null;
    const scaledPantryCost = stapleEstimate?.estimatedAdditionalCost ?? Number((blueprint.estimatedPantryCost * scaleFactor).toFixed(2));
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
    const onHandBonus = (onHandHits + (stapleEstimate?.availableRequiredCount ?? 0)) * 30;

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

    const dish: RecommendedDish = {
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
      dietaryTags: Array.from(activeDietaryTags).filter((tag) => tag !== 'GLUTEN_FREE' || !pantryRequirements?.some((requirement) => ['all-purpose-flour', 'whole-wheat-flour', 'worcestershire-sauce'].includes(requirement.ingredientId))),
      macroBadges: macroBadges.filter((badge) => badge !== '🌾 Gluten-Free' || !pantryRequirements?.some((requirement) => ['all-purpose-flour', 'whole-wheat-flour', 'worcestershire-sauce'].includes(requirement.ingredientId))),
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
    };
    const current = options?.pantryMode ? applyPantryToRecipe(dish, [...onHandSet], scoredCommodities, pantryRequirements, pantryPriceContext) : dish;
    if (options?.pantryMode) current.dishMatchScore = Math.round(dishMatchScore - costEfficiencyBonus +
      (current.additionalCostEstimateComplete === false ? 0 : Math.max(0, (3.25 - current.costPerServing) * 14)));
    evaluated.push(current);
  }

  // Merge any custom AI-generated recipes saved into SQLite (Ticket #10)
  for (const saved of savedDishesRaw) {
    if (options?.pantryMode && (dietaryConstraints.some((constraint) => !saved.dietaryTags?.includes(constraint)) ||
      (applianceFilter !== 'ANY' && saved.vesselArchetype !== applianceFilter))) continue;
    if (!evaluated.some((e) => e.id === saved.id)) {
      const scaled = options?.pantryMode && Number.isFinite(saved.servings) && saved.servings > 0 ? targetServings / saved.servings : 1;
      const current = options?.pantryMode ? applyPantryToRecipe({ ...saved, servings: targetServings,
        matchedIngredients: (Array.isArray(saved.matchedIngredients) ? saved.matchedIngredients : []).map((ingredient) => ({ ...ingredient, quantityUsed: ingredient.quantityUsed * scaled })),
        pantryRequirements: recipePantryRequirements(saved).map((requirement) => ({ ...requirement, quantity: requirement.quantity * scaled })),
        pantryStaples: [],
      }, [...onHandSet], scoredCommodities, undefined, pantryPriceContext) : saved;
      evaluated.push({
        ...current,
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

  // Keep the strongest match; cycle the remaining slots through existing recipes.
  // Use calendar weeks, not elapsed local hours, so DST never shifts the rollover.
  const cycleStart = currentAdCycle(options?.now).start;
  const week = Math.floor(Date.parse(`${cycleStart}T00:00:00Z`) / (7 * 86400000));
  const alternatives = [
    ...recommendedTrio.slice(1),
    ...evaluated.filter((dish) => !recommendedTrio.some((chosen) => chosen.id === dish.id)),
  ];
  const rotatingTrio = recommendedTrio.slice(0, 1);
  if (alternatives.length > 0) {
    const offset = ((week * 2) % alternatives.length + alternatives.length) % alternatives.length;
    for (let index = 0; index < Math.min(2, alternatives.length); index += 1) {
      rotatingTrio.push(alternatives[(offset + index) % alternatives.length]);
    }
  }

  return {
    recommendedTrio: rotatingTrio,
    allRankedDishes: evaluated,
  };
}
