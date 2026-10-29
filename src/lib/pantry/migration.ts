import { CANONICAL_INGREDIENTS } from '@/data/canonical-ingredients';
import { FreezerItem } from '@/types/domain';
import { PantryEntry, PantryEntryInput, PantryOwner } from '@/types/pantry';
import { pantryCatalog, pantryIdentity } from './model';

export interface LegacyPantrySource {
  owner: PantryOwner;
  freezerItems: readonly FreezerItem[];
  onHandIngredientIds: readonly string[];
}

export interface PantryMigrationSnapshot {
  owner: PantryOwner;
  entries: readonly PantryEntry[];
  /** Store separately from editable pantry fields; do not discard or sum purchase lots. */
  legacySource?: LegacyPantrySource;
  legacyMigrationVersion?: 1;
  needsCatalogMatch: readonly string[];
}

const canonicalNames = new Map(CANONICAL_INGREDIENTS.map((ingredient) => [ingredient.id, ingredient.name]));

function legacyIdentity(id: string, name?: string): PantryEntryInput {
  const verified = pantryCatalog.get(id);
  return {
    ...(verified?.recipeIngredientId === id ? { ingredientId: verified.id } : {}),
    displayName: verified?.name ?? canonicalNames.get(id) ?? (name?.trim() || `Legacy ingredient (${id})`),
    available: false,
  };
}

/**
 * Pure preparation only. Persist the complete result and completion marker in ONE
 * owner-scoped transaction (or one guest-cache replacement) before enabling UI.
 * Never feed it an unscoped shared freezer table or infer an owner for old caches.
 */
export function migrateLegacyPantry(
  current: PantryMigrationSnapshot,
  source: LegacyPantrySource,
  nowIso: string,
): PantryMigrationSnapshot {
  if (source.owner !== current.owner) throw new Error('Pantry migration owner mismatch');
  if (current.legacyMigrationVersion === 1) return current;

  const entries = current.entries.map((entry) => ({ ...entry }));
  const originalIdentities = new Set(entries.map(pantryIdentity));
  const byIdentity = new Map(entries.map((entry) => [pantryIdentity(entry), entry]));
  const unmatched = new Set(current.needsCatalogMatch);
  const add = (input: PantryEntryInput) => {
    const identity = pantryIdentity(input);
    // Preserve new-model edits and tombstones if migration resumes after interruption.
    if (originalIdentities.has(identity)) return;
    const prior = byIdentity.get(identity);
    if (prior) {
      prior.available ||= input.available;
      // A manual selection has no metadata; the first freezer lot retains context.
      if (!prior.location && input.location) {
        prior.location = input.location;
        prior.quantity = input.quantity;
        prior.unit = input.unit;
      }
      return;
    }
    const entry: PantryEntry = {
      ...input,
      id: `legacy:${encodeURIComponent(current.owner)}:${encodeURIComponent(identity)}`,
      revision: 0,
      updatedAtIso: nowIso,
    };
    entries.push(entry);
    byIdentity.set(identity, entry);
    if (!input.ingredientId) unmatched.add(entry.id);
  };

  // Stable ordering chooses a deterministic representative lot without adding units.
  const sortedLots = [...source.freezerItems].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const sourceNames = new Map<string, string>();
  for (const item of sortedLots) {
    if (!sourceNames.has(item.canonicalIngredientId)) sourceNames.set(item.canonicalIngredientId, item.ingredientName);
    const validQuantity = Number.isFinite(item.quantityLbOrDoz) && item.quantityLbOrDoz >= 0;
    add({
      ...legacyIdentity(item.canonicalIngredientId, sourceNames.get(item.canonicalIngredientId)),
      available: validQuantity && item.quantityLbOrDoz > 0,
      location: 'FREEZER',
      ...(validQuantity ? { quantity: item.quantityLbOrDoz } : {}),
      unit: item.unit,
    });
  }
  for (const id of source.onHandIngredientIds) add({ ...legacyIdentity(id, sourceNames.get(id)), available: true });

  return {
    owner: current.owner,
    entries,
    legacySource: {
      owner: source.owner,
      freezerItems: source.freezerItems.map((item) => ({ ...item })),
      onHandIngredientIds: [...source.onHandIngredientIds],
    },
    legacyMigrationVersion: 1,
    needsCatalogMatch: [...unmatched],
  };
}
