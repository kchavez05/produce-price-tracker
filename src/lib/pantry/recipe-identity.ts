import cookingData from '@/data/cooking-catalog.json';
import { CookingIngredient } from '@/types/catalog';

const ingredients: readonly CookingIngredient[] = cookingData.ingredients as CookingIngredient[];
const known = new Set(ingredients.map((r) => r.id));
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
  return [...new Set([...availableIds.filter((id) => known.has(id)), ...linkedRecipeIngredientIds(availableIds)])];
}
