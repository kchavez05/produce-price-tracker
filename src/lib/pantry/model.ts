import { linkedRecipeIngredientIds } from './recipe-identity';
import cookingData from '@/data/cooking-catalog.json';
import { CookingIngredient, CatalogCompatibility } from '@/types/catalog';
import { availableCookingIngredientIds, searchCookingCatalog } from './catalog-search';
import { PantryEntry, PantryEntryInput } from '@/types/pantry';

export const cookingIngredients: readonly CookingIngredient[] = cookingData.ingredients as CookingIngredient[];
/** Rollback changes presentation/derived coverage, never the accepted-ID registry. */
export function cookingCatalogView(version: string) {
  if (version === cookingData.catalogVersion) return { version, ingredients: cookingIngredients, compatibility: cookingData.compatibility as readonly CatalogCompatibility[] };
  const retained = cookingData.retainedCatalogs.find((catalog) => catalog.version === version);
  if (retained) return { version, ingredients: retained.ingredients as CookingIngredient[], compatibility: retained.compatibility as readonly CatalogCompatibility[] };
  throw new Error(`Unsupported cooking catalog version: ${version}`);
}
const activeCatalog = cookingCatalogView(process.env.NEXT_PUBLIC_PANTRYBOT_CATALOG_VERSION || cookingData.catalogVersion);
export const activeCookingIngredients = activeCatalog.ingredients;
export const cookingCompatibility = activeCatalog.compatibility;
export const cookingCatalogVersion = activeCatalog.version;
export const pantryCatalog: ReadonlyMap<string, CookingIngredient> = new Map(cookingIngredients.map((ingredient) => [ingredient.id, ingredient]));

export function normalizePantryName(name: string): string {
  return name.normalize('NFC').trim().replace(/\s+/gu, ' ').toLowerCase();
}

/** Catalog matches are explicit; names, aliases, and market keywords never confer ownership. */
export function pantryIdentity(entry: PantryEntryInput): string {
  return entry.ingredientId ? `catalog:${entry.ingredientId}` : `custom:${normalizePantryName(entry.displayName)}`;
}

export function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return year >= 1 && month >= 1 && month <= 12 && day >= 1 && day <= days[month - 1];
}

type EntryField = keyof PantryEntryInput;
export type PantryValidationResult =
  | { ok: true; value: PantryEntryInput }
  | { ok: false; errors: Partial<Record<EntryField, string>> };

export function validatePantryEntry(input: unknown, allowUnrecognizedCatalogId = false): PantryValidationResult {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { ok: false, errors: { displayName: 'Enter an ingredient.' } };
  }
  const raw = input as Record<string, unknown>;
  const errors: Partial<Record<EntryField, string>> = {};
  const displayName = typeof raw.displayName === 'string' ? raw.displayName.trim().replace(/\s+/gu, ' ') : '';
  if (!displayName || displayName.length > 120) errors.displayName = 'Use an ingredient name of 1–120 characters.';
  if (typeof raw.available !== 'boolean') errors.available = 'Choose Yes or No.';
  if (raw.ingredientId !== undefined && (typeof raw.ingredientId !== 'string' || !/^[a-z0-9][a-z0-9._:-]{0,119}$/.test(raw.ingredientId) || !allowUnrecognizedCatalogId && !pantryCatalog.has(raw.ingredientId))) {
    errors.ingredientId = 'Choose a catalog ingredient or use a custom name.';
  }
  if (raw.location !== undefined && (typeof raw.location !== 'string' || !['PANTRY', 'FRIDGE', 'FREEZER'].includes(raw.location))) {
    errors.location = 'Choose Pantry, Fridge, Freezer, or leave unspecified.';
  }
  if (raw.quantity !== undefined && (typeof raw.quantity !== 'number' || !Number.isFinite(raw.quantity) || raw.quantity < 0)) {
    errors.quantity = 'Enter a finite, nonnegative quantity or leave blank.';
  }
  if (raw.unit !== undefined && (typeof raw.unit !== 'string' || raw.unit.trim().length > 40)) {
    errors.unit = 'Use a unit of up to 40 characters.';
  }
  if (raw.useByDate !== undefined && (typeof raw.useByDate !== 'string' || !isCalendarDate(raw.useByDate))) {
    errors.useByDate = 'Enter a valid calendar date (YYYY-MM-DD) or leave blank.';
  }
  if (Object.keys(errors).length) return { ok: false, errors };
  // Whitelist editable fields: caller-supplied ownership/revisions are never copied.
  return { ok: true, value: {
    displayName,
    available: raw.available as boolean,
    ...(raw.ingredientId !== undefined ? { ingredientId: raw.ingredientId as string } : {}),
    ...(raw.location !== undefined ? { location: raw.location as PantryEntryInput['location'] } : {}),
    ...(raw.quantity !== undefined ? { quantity: raw.quantity as number } : {}),
    ...(typeof raw.unit === 'string' && raw.unit.trim() ? { unit: raw.unit.trim() } : {}),
    ...(raw.useByDate !== undefined ? { useByDate: raw.useByDate as string } : {}),
  } };
}

export function availableRecipeIngredientIds(entries: readonly PantryEntry[]): string[] {
  return linkedRecipeIngredientIds(availableCookingIngredientIds(entries, cookingIngredients, cookingCompatibility));
}

/** Resolve compatibility once, while explicit No entries are still present. */
export function availablePantryIngredientIds(entries: readonly PantryEntry[]): string[] {
  return availableCookingIngredientIds(entries, cookingIngredients, cookingCompatibility);
}

export function searchPantryCatalog(query: string) {
  return searchCookingCatalog(activeCookingIngredients, query);
}

/** New IDs need server acceptance first; unfamiliar existing entries stay editable. */
export function canSavePantryIngredient(input: PantryEntryInput, existing: PantryEntry | undefined, acceptedIds: readonly string[]): boolean {
  return !input.ingredientId || existing?.ingredientId === input.ingredientId || activeCookingIngredients.some((r) => r.id === input.ingredientId && r.lifecycle !== 'retired') && acceptedIds.includes(input.ingredientId);
}
