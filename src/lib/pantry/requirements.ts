import { createPantryPriceContext, PantryPriceContext, pricePantryRequirements } from './pricing';
import { recipeAvailableIngredientIds, recipePantryIngredientId } from './recipe-identity';
import { PantryEntry, PantryRequirement } from '@/types/pantry';
import { availablePantryIngredientIds } from './model';

/**
 * Uses exact identities and reviewed one-hop coverage with explicit No precedence. Optional quantities/dates on the user's
 * entry never influence coverage. Unknown required identities remain uncovered.
 */
export function evaluatePantryRequirements(
  requirements: readonly PantryRequirement[],
  entries: readonly PantryEntry[],
  context: PantryPriceContext = createPantryPriceContext(),
) {
  return evaluatePantryRequirementsByIds(requirements, availablePantryIngredientIds(entries), context);
}

export function evaluatePantryRequirementsByIds(requirements: readonly PantryRequirement[], availableIds: readonly string[], context: PantryPriceContext = createPantryPriceContext()) {
  requirements = requirements.map((r) => ({ ...r, ingredientId: recipePantryIngredientId(r.ingredientId) }));
  const available = new Set(recipeAvailableIngredientIds(availableIds));
  const requiredIds = new Set<string>();
  const optionalIds = new Set<string>();
  const needToBuy: PantryRequirement[] = [];
  const unpricedIngredientIds = new Set<string>();

  // An identity appearing in required and optional slots counts as required only.
  for (const requirement of requirements) {
    if (!Number.isFinite(requirement.quantity) || requirement.quantity < 0 || requirement.quantity > Number.MAX_SAFE_INTEGER) {
      throw new Error('Recipe quantities must be finite and nonnegative');
    }
    if (!requirement.optional) requiredIds.add(requirement.ingredientId);
    else optionalIds.add(requirement.ingredientId);
  }
  for (const id of requiredIds) optionalIds.delete(id);
  for (const requirement of requirements) {
    if (requirement.optional || available.has(requirement.ingredientId)) continue;
    needToBuy.push({ ...requirement });
  }
  const pricing = pricePantryRequirements(requirements, available, context);
  for (const row of pricing.rows) if (row.priceBasis === 'UNPRICED') unpricedIngredientIds.add(row.ingredientId);

  return {
    requiredCount: requiredIds.size,
    availableRequiredCount: [...requiredIds].filter((id) => available.has(id)).length,
    optionalCount: optionalIds.size,
    availableOptionalCount: [...optionalIds].filter((id) => available.has(id)).length,
    needToBuy,
    estimatedAdditionalCost: pricing.total,
    estimateComplete: unpricedIngredientIds.size === 0,
    unpricedIngredientIds: [...unpricedIngredientIds],
    pricing,
    priceBasis: pricing.rows.some((row) => row.priceBasis === 'OBSERVED') ? 'OBSERVED' as const : 'STATIC_ESTIMATE' as const,
  };
}
