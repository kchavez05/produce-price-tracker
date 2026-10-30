import { CookingIngredient } from '../../src/types/catalog';
import { sha256 } from './catalog-curation';

type MarketItem = { id: string; name: string; standardUnit: string; category?: string; subcategory?: string; matchKeywords?: readonly string[]; excludeKeywords?: readonly string[] };
type RecipeLink = { marketIngredientId: string; pantryIngredientId: string };
const object = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every((id) => typeof id === 'string');
export const marketCatalogFingerprint = (market: readonly MarketItem[]) => sha256(market.map(({ id, name, standardUnit, category, subcategory, matchKeywords, excludeKeywords }) => ({ id, name, standardUnit, category, subcategory, matchKeywords, excludeKeywords })).sort((a, b) => a.id.localeCompare(b.id, 'en')));

/** A complete applicability audit is required; new catalog rows cannot skip review. */
export function validateMarketLinkAudit(raw: unknown, catalog: { contentHash: string; ingredients: readonly CookingIngredient[] }, links: readonly RecipeLink[], market: readonly MarketItem[]) {
  if (!object(raw) || raw.formatVersion !== 1 || raw.catalogHash !== catalog.contentHash || raw.marketCatalogHash !== marketCatalogFingerprint(market) || raw.recipeLinksHash !== sha256(links)) throw new Error('Market-link applicability audit is stale; review both catalogs and approved links');
  if (!strings(raw.linkedIngredientIds) || !object(raw.noMarketItem) || !strings(raw.noMarketItem.ingredientIds) || typeof raw.noMarketItem.reason !== 'string' || !raw.noMarketItem.reason.trim()) throw new Error('Market-link audit requires linked IDs and reasoned no-market classifications');
  const marketIds = new Set(market.map((r) => r.id));
  const known = new Set(catalog.ingredients.map((r) => r.id));
  const actual = new Set<string>();
  for (const row of catalog.ingredients) if (row.recipeIngredientId) {
    if (!marketIds.has(row.recipeIngredientId)) throw new Error('Catalog recipe link references an unknown market item');
    actual.add(row.id);
  }
  for (const link of links) {
    if (!marketIds.has(link.marketIngredientId) || !known.has(link.pantryIngredientId)) throw new Error('Recipe-use link references an unknown identity');
    actual.add(link.pantryIngredientId);
  }
  const classified = [...raw.linkedIngredientIds, ...raw.noMarketItem.ingredientIds];
  if (classified.length !== known.size || new Set(classified).size !== classified.length || classified.some((id) => !known.has(id))) throw new Error('Every pantry identity must have exactly one market applicability classification');
  if (raw.linkedIngredientIds.length !== actual.size || raw.linkedIngredientIds.some((id) => !actual.has(id))) throw new Error('Applicable market links are missing or differ from the audit');
  return { linked: actual.size, noMarketItem: raw.noMarketItem.ingredientIds.length };
}
