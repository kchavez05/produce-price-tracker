import { pantryCatalog } from '@/lib/pantry/model';
import { AiGenerationError } from './errors';
import { RECIPE_OUTPUT_SCHEMA } from './recipe-schema';
import type { GeneratedDish, RecipeJsonSchema } from './types';

// Bounded, application-owned validation for this contract, not a general JSON Schema engine.
function matches(value: unknown, schema: RecipeJsonSchema): boolean {
  if (schema.type === 'string') return typeof value === 'string' && value.length <= 16_000 && (!schema.enum || schema.enum.includes(value));
  if (schema.type === 'number') return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1_000_000;
  if (schema.type === 'boolean') return typeof value === 'boolean';
  if (schema.type === 'array') return Array.isArray(value) && value.length <= 64 && !!schema.items && value.every(item => matches(item, schema.items!));
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (schema.required ?? []).every(key => Object.hasOwn(record, key)) &&
    Object.entries(schema.properties ?? {}).every(([key, child]) => !Object.hasOwn(record, key) || matches(record[key], child));
}
export function parseGeneratedDishes(text: string, targetServings: number): GeneratedDish[] {
  const invalid = () => { throw new AiGenerationError('INVALID_RESPONSE'); };
  if (typeof text !== 'string' || text.length > 256_000) return invalid();
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { return invalid(); }
  if (!matches(parsed, RECIPE_OUTPUT_SCHEMA) || !Array.isArray(parsed) || parsed.length !== 3) return invalid();
  // The complete fixed schema above checks every field needed by GeneratedDish.
  const dishes = parsed as GeneratedDish[];
  const titles = new Set<string>();
  for (const dish of dishes) {
    const title = dish.title.trim().toLowerCase();
    if (!title || titles.has(title) || dish.servings !== targetServings || dish.steps.length === 0) return invalid();
    titles.add(title);
    for (const ingredient of dish.matchedIngredients) {
      if (!pantryCatalog.has(ingredient.ingredientId) || ingredient.quantityUsed <= 0) return invalid();
    }
    for (const ingredient of dish.pantryRequirements) {
      if (ingredient.quantity <= 0 || !pantryCatalog.has(ingredient.ingredientId) &&
        !(ingredient.ingredientId.startsWith('unmapped:') && ingredient.ingredientId.length > 9 && ingredient.displayName?.trim())) return invalid();
    }
  }
  return dishes;
}
