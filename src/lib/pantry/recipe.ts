import { createPantryPriceContext, PantryPriceContext } from './pricing';
import { requiresExactOffer } from './exact-offer';
import { recipeAvailableIngredientIds, recipePantryIngredientId, recipeUseRequirementName } from './recipe-identity';
import { matchedRecipeRequirement, recipeCommodity, recipeUseForRequirement, resolveRecipeUse, recipeIngredientExcluded } from './recipe-use';
import { MatchedSlotIngredient, RecommendedDish, ScoredCommodity } from '@/types/domain';
import { PantryPriceDetail, PantryRequirement, PantryShoppingNeed } from '@/types/pantry';
import { normalizePantryName, pantryCatalog } from './model';
import { evaluatePantryRequirementsByIds } from './requirements';

const finiteNonnegative = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0;
export function pantryRequirementName(requirement: PantryRequirement): string {
  return pantryCatalog.get(requirement.ingredientId)?.name ?? recipeUseRequirementName(requirement.ingredientId) ?? requirement.displayName ?? requirement.ingredientId;
}
export function formatPantryRequirement(requirement: PantryRequirement): string {
  return `${pantryRequirementName(requirement)}${requirement.unit ? ` (${requirement.quantity} ${requirement.unit})` : ''}`;
}
export function unpricedRecipeText(text: string): PantryRequirement {
  return { ingredientId: `unmapped:${normalizePantryName(text)}`, displayName: text, quantity: 1, unit: '' };
}

export function recipePantryRequirements(dish: RecommendedDish): PantryRequirement[] {
  const structured = Array.isArray(dish.pantryRequirements) ? dish.pantryRequirements : [];
  const represented = new Set(structured.filter((requirement) => requirement && typeof requirement.ingredientId === 'string')
    .flatMap((requirement) => [normalizePantryName(pantryRequirementName(requirement)), normalizePantryName(formatPantryRequirement(requirement))]));
  const text = (Array.isArray(dish.pantryStaples) ? dish.pantryStaples : [])
    .filter((value) => typeof value === 'string' && !represented.has(normalizePantryName(value)));
  return [...structured, ...text.map(unpricedRecipeText)];
}

/** Group display quantities, but sum authoritative recipe cents without repricing. */
export function aggregatePantryPriceDetails(rows: readonly PantryPriceDetail[]): PantryShoppingNeed[] {
  const combined = new Map<string, PantryShoppingNeed>();
  for (const row of rows) {
    if (row.priceBasis === 'OPTIONAL' || row.priceBasis === 'ON_HAND') continue;
    // Keep unpriced quantities separate so a partial known subtotal cannot disappear.
    const key = JSON.stringify([row.ingredientId, row.unit, row.quantityBasisVersion ?? '', row.estimatedCost === null]);
    const existing = combined.get(key);
    const quantity = (existing?.quantity ?? 0) + row.quantity;
    const allocatedCents = row.allocatedCents === null ? null : (existing?.priceDetails ?? []).reduce((sum, detail) => sum + (detail.allocatedCents ?? 0), row.allocatedCents);
    if (allocatedCents !== null && !Number.isSafeInteger(allocatedCents)) throw new RangeError('Shopping price exceeds the supported range');
    const cost = allocatedCents === null ? null : allocatedCents / 100;
    combined.set(key, { ...row, quantity: Number.isFinite(quantity) && quantity <= Number.MAX_SAFE_INTEGER ? Number(quantity.toFixed(4)) : 1,
      ...(Number.isFinite(quantity) && quantity <= Number.MAX_SAFE_INTEGER ? {} : { unit: '' }), ingredientName: pantryRequirementName(row),
      estimatedCost: cost, priceBasis: existing && existing.priceBasis !== row.priceBasis ? 'MIXED' : row.priceBasis,
      priceDetails: [...(existing?.priceDetails ?? []), row] });
  }
  return [...combined.values()];
}

export function pantryShoppingNeeds(requirements: readonly PantryRequirement[], availableIds: readonly string[], context: PantryPriceContext = createPantryPriceContext()): PantryShoppingNeed[] {
  return aggregatePantryPriceDetails(evaluatePantryRequirementsByIds(requirements, availableIds, context).pricing.rows);
}

/** Derive current availability/cost; never mutate inventory or the saved recipe. */
export function applyPantryToRecipe(
  dish: RecommendedDish,
  availableIds: readonly string[],
  commodities: readonly ScoredCommodity[],
  explicitRequirements?: readonly PantryRequirement[],
  context: PantryPriceContext = createPantryPriceContext(),
): RecommendedDish {
  const available = new Set(recipeAvailableIngredientIds(availableIds));
  const prices = new Map(commodities.map((commodity) => [commodity.ingredient.id, commodity]));
  const sourceRequirements = explicitRequirements ?? recipePantryRequirements(dish);
  const sourceMatched = [...(Array.isArray(dish.matchedIngredients) ? dish.matchedIngredients : [])];
  const represented = new Set(sourceMatched.filter((ingredient) => ingredient && typeof ingredient.ingredientId === 'string')
    .map((ingredient) => matchedRecipeRequirement(dish, ingredient).ingredientId));
  const restored = new Set<PantryRequirement>();
  // An unpriced scoped requirement retains its exact rule ID, so later prices/availability
  // can be evaluated again without saving stale costs or guessing from its display text.
  for (const requirement of sourceRequirements) {
    if (!requirement || typeof requirement.ingredientId !== 'string') continue;
    const use = recipeUseForRequirement(dish, requirement.ingredientId);
    const exact = requiresExactOffer(requirement.ingredientId) && !recipeIngredientExcluded(dish.id, requirement.ingredientId);
    if ((!use && !exact) || !['lb', 'doz'].includes(requirement.unit) || !finiteNonnegative(requirement.quantity)) continue;
    const marketId = use?.marketIngredientId ?? requirement.ingredientId;
    if (!represented.has(requirement.ingredientId)) {
      const offer = prices.get(marketId)?.bestOffer;
      sourceMatched.push({ ingredientId: marketId, ingredientName: use?.marketIngredientName ?? requirement.displayName ?? marketId, slotLabel: use?.slotLabel ?? requirement.displayName ?? marketId,
        quantityUsed: requirement.quantity, unit: requirement.unit as 'lb' | 'doz', store: offer?.store ?? 'KING_SOOPERS',
        rawDealText: '', dealType: offer?.dealType ?? 'SHELF_OR_MEMBER', unitCost: 0, slotCost: 0, regularSlotCost: 0,
        isUserPinned: false, ...(requirement.optional ? { optional: true } : {}) });
    }
    restored.add(requirement);
  }
  const requirements = sourceRequirements.filter((r) => !restored.has(r)).map((requirement, index): PantryRequirement => {
    if (!requirement || typeof requirement.ingredientId !== 'string') return unpricedRecipeText(`Unmapped ingredient ${index + 1}`);
    const ingredientId = recipeIngredientExcluded(dish.id, requirement.ingredientId) ? `unmapped:recipe:${dish.id}:${requirement.ingredientId}` : requirement.ingredientId.startsWith('recipe-use:') && !recipeUseForRequirement(dish, requirement.ingredientId)
      ? `unmapped:${requirement.ingredientId}` : recipePantryIngredientId(requirement.ingredientId);
    const price = pantryCatalog.get(ingredientId)?.staticPrice;
    const usable = finiteNonnegative(requirement.quantity) && requirement.quantity <= Number.MAX_SAFE_INTEGER && typeof requirement.unit === 'string' &&
      (!price || Number.isFinite(requirement.quantity * price.usdPerUnit) && requirement.quantity * price.usdPerUnit * 100 <= Number.MAX_SAFE_INTEGER / Math.max(1, sourceRequirements.length));
    return { ...requirement, ingredientId, quantity: usable ? requirement.quantity : 1, unit: usable ? requirement.unit : '' };
  });
  const matched: MatchedSlotIngredient[] = [];
  const marketRequirements: PantryRequirement[] = [];
  let storeCost = 0;
  let regularStoreCost = 0;
  for (const sourceIngredient of sourceMatched) {
    const { fromVirtualFreezer: _retired, ...ingredient } = sourceIngredient ?? {};
    if (!ingredient || typeof ingredient.ingredientId !== 'string') { requirements.push(unpricedRecipeText('Unmapped recipe ingredient')); continue; }
    const commodity = recipeCommodity(dish, ingredient, prices.get(ingredient.ingredientId));
    const validQuantity = finiteNonnegative(ingredient.quantityUsed);
    const known = commodity && validQuantity && commodity.ingredient.standardUnit === ingredient.unit && finiteNonnegative(commodity.bestOffer.normalizedPricePerUnit)
      && Number.isFinite(ingredient.quantityUsed * commodity.bestOffer.normalizedPricePerUnit)
      && (storeCost + ingredient.quantityUsed * commodity.bestOffer.normalizedPricePerUnit) * 100 <= Number.MAX_SAFE_INTEGER;
    const requirement = matchedRecipeRequirement(dish, ingredient);
    if (!known) { requirements.push(requirement); continue; }
    marketRequirements.push(requirement);
    const isOnHand = available.has(requirement.ingredientId);
    const slotCost = isOnHand || ingredient.optional ? 0 : Number((ingredient.quantityUsed * commodity.bestOffer.normalizedPricePerUnit).toFixed(2));
    const regularUnit = finiteNonnegative(commodity.bestOffer.regularPricePerUnit)
      && Number.isFinite(ingredient.quantityUsed * commodity.bestOffer.regularPricePerUnit)
      && (regularStoreCost + ingredient.quantityUsed * commodity.bestOffer.regularPricePerUnit) * 100 <= Number.MAX_SAFE_INTEGER
      ? commodity.bestOffer.regularPricePerUnit : commodity.bestOffer.normalizedPricePerUnit;
    const regularSlotCost = isOnHand || ingredient.optional ? 0 : Number((ingredient.quantityUsed * regularUnit).toFixed(2));
    storeCost += slotCost; regularStoreCost += regularSlotCost;
    matched.push({ ...ingredient, ingredientName: requirement.displayName ?? ingredient.ingredientName, isOnHand, store: commodity.bestOffer.store,
      rawDealText: isOnHand ? 'Already have' : (resolveRecipeUse(dish, ingredient) || requiresExactOffer(ingredient.ingredientId)) ? `${commodity.bestOffer.rawTitle} — ${commodity.bestOffer.rawPriceText}` : commodity.bestOffer.rawPriceText,
      dealType: commodity.bestOffer.dealType, dealConditions: commodity.bestOffer.dealConditions,
      unitCost: commodity.bestOffer.normalizedPricePerUnit, slotCost, regularSlotCost });
  }
  const pantry = evaluatePantryRequirementsByIds(requirements, [...available], context);
  const coverage = evaluatePantryRequirementsByIds([...marketRequirements, ...requirements], [...available], context);
  const servings = typeof dish.servings === 'number' && Number.isFinite(dish.servings) && dish.servings > 0 ? dish.servings : 6;
  const totalBatchCost = Number((storeCost + pantry.estimatedAdditionalCost).toFixed(2));
  const regularBatchCost = Number((regularStoreCost + pantry.estimatedAdditionalCost).toFixed(2));
  const { poweredByFreezerCount: _retired, ...currentDish } = dish;
  return { ...currentDish, servings, matchedIngredients: matched, pantryRequirements: requirements,
    pantryPricing: pantry.pricing,
    pantryStaples: requirements.map(formatPantryRequirement), estimatedPantryCost: pantry.estimatedAdditionalCost,
    totalBatchCost, regularBatchCost, totalBatchSavings: Number(Math.max(0, regularBatchCost - totalBatchCost).toFixed(2)),
    costPerServing: Number((totalBatchCost / servings).toFixed(2)),
    pantryCoverage: { requiredCount: coverage.requiredCount, availableRequiredCount: coverage.availableRequiredCount,
      optionalCount: coverage.optionalCount, availableOptionalCount: coverage.availableOptionalCount },
    additionalCostEstimateComplete: pantry.estimateComplete,
    missingPriceIngredientIds: pantry.unpricedIngredientIds,
  };
}
