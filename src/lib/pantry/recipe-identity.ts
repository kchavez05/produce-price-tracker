import cookingData from '@/data/cooking-catalog.json';
import { CookingIngredient, ScopedRecipeUse } from '@/types/catalog';

const ingredients: readonly CookingIngredient[] = cookingData.ingredients as CookingIngredient[];
const known = new Set(ingredients.map((r) => r.id));
export const scopedRecipeUses: readonly ScopedRecipeUse[] = cookingData.scopedRecipeUses;
export const recipeUseRequirementId = (use: ScopedRecipeUse): string => `recipe-use:${use.id}`;
const scopedNames = new Map(scopedRecipeUses.map((use) => [recipeUseRequirementId(use), use.displayName]));
export const recipeUseRequirementName = (id: string): string | undefined => scopedNames.get(id);
const links = new Map<string, string>([
  ...ingredients.flatMap((r): [string, string][] => r.recipeIngredientId ? [[r.recipeIngredientId, r.id]] : []),
  ...cookingData.recipeLinks.map((r): [string, string] => [r.marketIngredientId, r.pantryIngredientId]),
]);

/** A reviewed recipe-use relationship; never fuzzy source/market identity matching. */
export function recipePantryIngredientId(recipeId: string): string {
  return links.get(recipeId) ?? recipeId;
}

export function linkedRecipeIngredientIds(availableIds: readonly string[]): string[] {
  const available = new Set(availableIds.filter((id) => known.has(id)));
  return [...links].filter(([, pantryId]) => available.has(pantryId)).map(([recipeId]) => recipeId);
}

/** Input is resolved positive pantry evidence: explicit No was already applied. */
export function recipeAvailableIngredientIds(availableIds: readonly string[]): string[] {
  // Synthetic recipe IDs and old mixed market IDs can never manufacture pantry evidence.
  const positive = new Set(availableIds.filter((id) => known.has(id)));
  return [...new Set([...positive, ...linkedRecipeIngredientIds([...positive]),
    ...scopedRecipeUses.filter((use) => use.pantryIngredientIds.some((id) => positive.has(id))).map(recipeUseRequirementId)])];
}
