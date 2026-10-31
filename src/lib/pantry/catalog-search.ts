import { CookingIngredient } from '@/types/catalog';

const normalized = (text: string) => text.normalize('NFC').trim().replace(/\s+/gu, ' ').toLowerCase();
function matches(ingredient: CookingIngredient, query: string): boolean {
  return [ingredient.name, ...ingredient.aliases].some((text) => normalized(text).includes(query));
}
function hasSpecificQualifier(ingredient: CookingIngredient, query: string): boolean {
  return [ingredient.variety, ingredient.form].some((qualifier) => Boolean(qualifier && query.includes(normalized(qualifier))));
}

/** Presentation only. Grouping and aliases never establish inventory coverage. */
export function searchCookingCatalog(catalog: readonly CookingIngredient[], query: string, limit = 12): CookingIngredient[] {
  const search = normalized(query);
  if (!search || !Number.isInteger(limit) || limit < 1) return [];
  const matching = catalog.filter((ingredient) => ingredient.lifecycle !== 'retired' && matches(ingredient, search));
  const ids = new Map(catalog.map((ingredient) => [ingredient.id, ingredient]));
  return matching.filter((ingredient) => {
    if (ingredient.searchVisibility === 'specific') return hasSpecificQualifier(ingredient, search);
    if (ingredient.searchVisibility !== 'variant') return true;
    const parent = ingredient.parentIngredientId && ids.get(ingredient.parentIngredientId);
    // A variety must retain its parent's form-qualified discovery boundary.
    // Brown rice flour must not leak into a search for brown rice.
    if (parent && parent.searchVisibility === 'specific' && !hasSpecificQualifier(parent, search)) return false;
    // A family/form query shows the primary result. A specific query can reveal
    // a child even when its label includes the same broad search words.
    return !parent || parent.lifecycle === 'retired' || !matches(parent, search);
  }).sort((a, b) => {
    const aExact = normalized(a.name) === search || a.aliases.some((alias) => normalized(alias) === search);
    const bExact = normalized(b.name) === search || b.aliases.some((alias) => normalized(alias) === search);
    return Number(bExact) - Number(aExact) || a.name.localeCompare(b.name, 'en') || a.id.localeCompare(b.id, 'en');
  }).slice(0, limit);
}

export function cookingCatalogVariants(catalog: readonly CookingIngredient[], parentId: string): CookingIngredient[] {
  return catalog.filter((ingredient) => ingredient.lifecycle !== 'retired' && ingredient.parentIngredientId === parentId)
    .sort((a, b) => a.name.localeCompare(b.name, 'en') || a.id.localeCompare(b.id, 'en'));
}

/** Exact positives plus explicitly reviewed, one-hop specific -> general edges. */
export function availableCookingIngredientIds(
  entries: readonly import('@/types/pantry').PantryEntry[],
  catalog: readonly CookingIngredient[],
  compatibility: readonly import('@/types/catalog').CatalogCompatibility[],
): string[] {
  const known = new Set(catalog.map((ingredient) => ingredient.id));
  const active = entries.filter((entry) => !entry.deletedAtIso && entry.ingredientId && known.has(entry.ingredientId));
  const yes = new Set(active.filter((entry) => entry.available).map((entry) => entry.ingredientId!));
  const no = new Set(active.filter((entry) => !entry.available).map((entry) => entry.ingredientId!));
  const result = new Set([...yes].filter((id) => !no.has(id)));
  for (const edge of compatibility) if (yes.has(edge.from) && !no.has(edge.from) && known.has(edge.to) && !no.has(edge.to)) result.add(edge.to);
  return [...result].sort();
}
