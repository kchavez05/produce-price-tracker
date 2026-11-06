import { recipeAvailableIngredientIds, recipePantryIngredientId, recipeUseRequirementName } from './recipe-identity';
import { matchedRecipeRequirement, recipeCommodity, recipeUseForRequirement } from './recipe-use';
import { MatchedSlotIngredient, RecommendedDish, ScoredCommodity } from '@/types/domain';
import { PantryRequirement, PantryShoppingNeed } from '@/types/pantry';
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

export function pantryShoppingNeeds(requirements: readonly PantryRequirement[], availableIds: readonly string[]): PantryShoppingNeed[] {
  const combined = new Map<string, PantryRequirement>();
  const available = new Set(recipeAvailableIngredientIds(availableIds));
  for (const original of requirements) {
    const requirement = { ...original, ingredientId: recipePantryIngredientId(original.ingredientId) };
    if (requirement.optional || available.has(requirement.ingredientId)) continue;
    const key = `${requirement.ingredientId}\u0000${requirement.unit}`;
    const existing = combined.get(key);
    const quantity = (existing?.quantity ?? 0) + requirement.quantity;
    combined.set(key, { ...requirement, quantity: Number.isFinite(quantity) && quantity <= Number.MAX_SAFE_INTEGER
      ? Number(quantity.toFixed(4)) : 1, ...(Number.isFinite(quantity) && quantity <= Number.MAX_SAFE_INTEGER ? {} : { unit: '' }) });
  }
  return [...combined.values()].map((requirement) => {
    const price = pantryCatalog.get(requirement.ingredientId)?.staticPrice;
    const known = Boolean(price && price.unit === requirement.unit && finiteNonnegative(requirement.quantity));
    const cost = known ? price!.usdPerUnit * requirement.quantity : null;
    const estimatedCost = cost !== null && Number.isFinite(cost) ? Number(cost.toFixed(2)) : null;
    return { ...requirement, ingredientName: pantryRequirementName(requirement), estimatedCost,
      priceBasis: estimatedCost === null ? 'UNPRICED' as const : 'STATIC_ESTIMATE' as const };
  });
}

/** Derive current availability/cost; never mutate inventory or the saved recipe. */
export function applyPantryToRecipe(
  dish: RecommendedDish,
  availableIds: readonly string[],
  commodities: readonly ScoredCommodity[],
  explicitRequirements?: readonly PantryRequirement[],
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
    if (!use || !['lb', 'doz'].includes(requirement.unit) || !finiteNonnegative(requirement.quantity)) continue;
    if (!represented.has(requirement.ingredientId)) {
      const offer = prices.get(use.marketIngredientId)?.bestOffer;
      sourceMatched.push({ ingredientId: use.marketIngredientId, ingredientName: use.marketIngredientName, slotLabel: use.slotLabel,
        quantityUsed: requirement.quantity, unit: requirement.unit as 'lb' | 'doz', store: offer?.store ?? 'KING_SOOPERS',
        rawDealText: '', dealType: offer?.dealType ?? 'SHELF_OR_MEMBER', unitCost: 0, slotCost: 0, regularSlotCost: 0,
        isUserPinned: false, ...(requirement.optional ? { optional: true } : {}) });
    }
    restored.add(requirement);
  }
  const requirements = sourceRequirements.filter((r) => !restored.has(r)).map((requirement, index): PantryRequirement => {
    if (!requirement || typeof requirement.ingredientId !== 'string') return unpricedRecipeText(`Unmapped ingredient ${index + 1}`);
    const ingredientId = requirement.ingredientId.startsWith('recipe-use:') && !recipeUseForRequirement(dish, requirement.ingredientId)
      ? `unmapped:${requirement.ingredientId}` : recipePantryIngredientId(requirement.ingredientId);
    const price = pantryCatalog.get(ingredientId)?.staticPrice;
    const usable = finiteNonnegative(requirement.quantity) && typeof requirement.unit === 'string' &&
      (!price || Number.isFinite(requirement.quantity * price.usdPerUnit) && requirement.quantity * price.usdPerUnit * 100 <= Number.MAX_SAFE_INTEGER / Math.max(1, sourceRequirements.length));
    return { ...requirement, ingredientId, quantity: usable ? requirement.quantity : 1, unit: usable ? requirement.unit : '' };
  });
  const matched: MatchedSlotIngredient[] = [];
  const marketRequirements: PantryRequirement[] = [];
  let storeCost = 0;
  let regularStoreCost = 0;
  for (const ingredient of sourceMatched) {
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
    matched.push({ ...ingredient, ingredientName: requirement.displayName ?? ingredient.ingredientName, isOnHand, fromVirtualFreezer: false, store: commodity.bestOffer.store,
      rawDealText: isOnHand ? 'Already have' : commodity.bestOffer.rawPriceText,
      dealType: commodity.bestOffer.dealType, dealConditions: commodity.bestOffer.dealConditions,
      unitCost: commodity.bestOffer.normalizedPricePerUnit, slotCost, regularSlotCost });
  }
  const pantry = evaluatePantryRequirementsByIds(requirements, [...available]);
  const coverage = evaluatePantryRequirementsByIds([...marketRequirements, ...requirements], [...available]);
  const servings = typeof dish.servings === 'number' && Number.isFinite(dish.servings) && dish.servings > 0 ? dish.servings : 6;
  const totalBatchCost = Number((storeCost + pantry.estimatedAdditionalCost).toFixed(2));
  const regularBatchCost = Number((regularStoreCost + pantry.estimatedAdditionalCost).toFixed(2));
  return { ...dish, servings, matchedIngredients: matched, pantryRequirements: requirements,
    pantryStaples: requirements.map(formatPantryRequirement), estimatedPantryCost: pantry.estimatedAdditionalCost,
    totalBatchCost, regularBatchCost, totalBatchSavings: Number(Math.max(0, regularBatchCost - totalBatchCost).toFixed(2)),
    costPerServing: Number((totalBatchCost / servings).toFixed(2)), poweredByFreezerCount: 0,
    pantryCoverage: { requiredCount: coverage.requiredCount, availableRequiredCount: coverage.availableRequiredCount,
      optionalCount: coverage.optionalCount, availableOptionalCount: coverage.availableOptionalCount },
    additionalCostEstimateComplete: pantry.estimateComplete,
    missingPriceIngredientIds: pantry.unpricedIngredientIds,
  };
}
