import { recipeAvailableIngredientIds, recipePantryIngredientId } from './recipe-identity';
import { PantryEntry, PantryRequirement } from '@/types/pantry';
import { pantryCatalog, availablePantryIngredientIds } from './model';

/**
 * Uses exact identities and reviewed one-hop coverage with explicit No precedence. Optional quantities/dates on the user's
 * entry never influence coverage. Unknown required identities remain uncovered.
 */
export function evaluatePantryRequirements(
  requirements: readonly PantryRequirement[],
  entries: readonly PantryEntry[],
) {
  return evaluatePantryRequirementsByIds(requirements, availablePantryIngredientIds(entries));
}

export function evaluatePantryRequirementsByIds(requirements: readonly PantryRequirement[], availableIds: readonly string[]) {
  requirements = requirements.map((r) => ({ ...r, ingredientId: recipePantryIngredientId(r.ingredientId) }));
  const available = new Set(recipeAvailableIngredientIds(availableIds));
  const requiredIds = new Set<string>();
  const optionalIds = new Set<string>();
  const needToBuy: PantryRequirement[] = [];
  const unpricedIngredientIds = new Set<string>();
  let estimatedCents = 0;

  // An identity appearing in required and optional slots counts as required only.
  for (const requirement of requirements) {
    if (!Number.isFinite(requirement.quantity) || requirement.quantity < 0) {
      throw new Error('Recipe quantities must be finite and nonnegative');
    }
    if (!requirement.optional) requiredIds.add(requirement.ingredientId);
    else optionalIds.add(requirement.ingredientId);
  }
  for (const id of requiredIds) optionalIds.delete(id);
  for (const requirement of requirements) {
    if (requirement.optional || available.has(requirement.ingredientId)) continue;
    needToBuy.push({ ...requirement });
    const price = pantryCatalog.get(requirement.ingredientId)?.staticPrice;
    if (!price || price.unit !== requirement.unit) {
      unpricedIngredientIds.add(requirement.ingredientId);
      continue;
    }
    const cents = price.usdPerUnit * requirement.quantity * 100;
    if (!Number.isFinite(cents) || cents > Number.MAX_SAFE_INTEGER - estimatedCents) {
      throw new Error('Recipe cost exceeds the supported range');
    }
    estimatedCents += cents;
  }

  return {
    requiredCount: requiredIds.size,
    availableRequiredCount: [...requiredIds].filter((id) => available.has(id)).length,
    optionalCount: optionalIds.size,
    availableOptionalCount: [...optionalIds].filter((id) => available.has(id)).length,
    needToBuy,
    estimatedAdditionalCost: Math.round(estimatedCents) / 100,
    estimateComplete: unpricedIngredientIds.size === 0,
    unpricedIngredientIds: [...unpricedIngredientIds],
    priceBasis: 'STATIC_ESTIMATE' as const,
  };
}
