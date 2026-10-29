import { PANTRY_INGREDIENTS } from '@/data/pantry-ingredients';
import { PantryCatalogIngredient, PantryEntry, PantryEntryInput } from '@/types/pantry';

export const pantryCatalog: ReadonlyMap<string, PantryCatalogIngredient> = new Map(PANTRY_INGREDIENTS.map((ingredient) => [ingredient.id, ingredient]));

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

export function validatePantryEntry(input: unknown): PantryValidationResult {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { ok: false, errors: { displayName: 'Enter an ingredient.' } };
  }
  const raw = input as Record<string, unknown>;
  const errors: Partial<Record<EntryField, string>> = {};
  const displayName = typeof raw.displayName === 'string' ? raw.displayName.trim().replace(/\s+/gu, ' ') : '';
  if (!displayName || displayName.length > 120) errors.displayName = 'Use an ingredient name of 1–120 characters.';
  if (typeof raw.available !== 'boolean') errors.available = 'Choose Yes or No.';
  if (raw.ingredientId !== undefined && (typeof raw.ingredientId !== 'string' || !pantryCatalog.has(raw.ingredientId))) {
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
  return [...new Set(entries.flatMap((entry) => {
    const recipeId = entry.ingredientId && pantryCatalog.get(entry.ingredientId)?.recipeIngredientId;
    return entry.available && !entry.deletedAtIso && recipeId ? [recipeId] : [];
  }))];
}

export function availablePantryIngredientIds(entries: readonly PantryEntry[]): string[] {
  return [...new Set([...availableRecipeIngredientIds(entries), ...entries.flatMap((entry) =>
    entry.available && !entry.deletedAtIso && entry.ingredientId && pantryCatalog.has(entry.ingredientId) ? [entry.ingredientId] : [])])];
}

export function searchPantryCatalog(query: string) {
  const normalized = normalizePantryName(query);
  if (!normalized) return [];
  return PANTRY_INGREDIENTS.filter((ingredient) => [ingredient.name, ...ingredient.aliases]
    .some((name) => normalizePantryName(name).includes(normalized)));
}
