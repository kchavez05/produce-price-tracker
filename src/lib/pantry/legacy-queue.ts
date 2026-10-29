import { PantryEntry, PantryMutation, PantryOwner } from '@/types/pantry';
import { LegacyPantrySource, migrateLegacyPantry } from './migration';
import { pantryIdentity } from './model';
import { parseGuestFreezer } from '@/lib/sync/queue';

export function legacyQueueNeedsUpgrade(raw: string | null): boolean {
  if (!raw) return false;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return true;
    return parsed.some((item) => item && typeof item === 'object' && ('freezerItems' in item ||
      (item.preferences && typeof item.preferences === 'object' && 'onHandIngredientIds' in item.preferences)));
  } catch { return true; }
}

async function digest(text: string): Promise<string> {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))))
    .map((value) => value.toString(16).padStart(2, '0')).join('');
}

/** An old absolute snapshot has no trustworthy per-entry base revision. Convert
 * its final intent to revision-zero writes: every existing entry must conflict
 * and receive an explicit choice, rather than overwriting another device. */
export async function prepareLegacyQueueUpgrade(owner: PantryOwner, archive: LegacyPantrySource, raw: string) {
  if (!owner.startsWith('account:') || archive.owner !== owner) throw new Error('Older edits belong to another owner.');
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error('Older pending edits need recovery; their original bytes are preserved.');
  let source = { ...archive };
  const remaining: Record<string, unknown>[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error('Invalid older queue; original bytes preserved.');
    const value = item as Record<string, unknown>;
    if (value.userId !== owner.slice('account:'.length) || typeof value.mutationId !== 'string') throw new Error('Older queue owner mismatch.');
    if (value.mergeMode === true) throw new Error('An older additive import needs recovery before it can be replayed safely. Original data is preserved.');
    if (value.preferences !== undefined && (!value.preferences || typeof value.preferences !== 'object' || Array.isArray(value.preferences))) throw new Error('Invalid older preferences; original data preserved.');
    const preferences = { ...value.preferences as Record<string, unknown> | undefined };
    if (value.freezerItems !== undefined) {
      const freezerItems = parseGuestFreezer(JSON.stringify(value.freezerItems));
      if (!Array.isArray(value.freezerItems) || freezerItems.length !== value.freezerItems.length) throw new Error('Invalid older purchase records; original data preserved.');
      source = { ...source, freezerItems };
    }
    if (preferences.onHandIngredientIds !== undefined) {
      if (!Array.isArray(preferences.onHandIngredientIds) || !preferences.onHandIngredientIds.every((id) => typeof id === 'string')) throw new Error('Invalid older on-hand selections.');
      source = { ...source, onHandIngredientIds: preferences.onHandIngredientIds };
    }
    delete preferences.onHandIngredientIds;
    const { freezerItems: _freezer, preferences: _preferences, ...rest } = value;
    void _freezer; void _preferences;
    if (Object.keys(preferences).length || rest.savedRecipes !== undefined) remaining.push({ ...rest, ...(Object.keys(preferences).length ? { preferences } : {}) });
  }
  const migrate = (legacy: LegacyPantrySource) => migrateLegacyPantry({ owner, entries: [], needsCatalogMatch: [] }, legacy, '1970-01-01T00:00:00Z').entries;
  const before = new Map(migrate(archive).map((entry) => [pantryIdentity(entry), entry]));
  const after = new Map(migrate(source).map((entry) => [pantryIdentity(entry), entry]));
  const mutations: PantryMutation[] = [];
  const preview: PantryEntry[] = [];
  for (const identity of new Set([...before.keys(), ...after.keys()])) {
    const previous = before.get(identity);
    const next = after.get(identity);
    if (JSON.stringify(previous) === JSON.stringify(next)) continue;
    const entry = next ?? previous!;
    const mutationId = `legacy:${await digest(`${raw}:${identity}`)}`;
    mutations.push(next ? { mutationId, entryId: next.id, expectedRevision: 0, operation: 'put', entry: next }
      : { mutationId, entryId: previous!.id, expectedRevision: 0, operation: 'delete' });
    preview.push({ ...entry, ...(next ? {} : { deletedAtIso: entry.updatedAtIso }) });
  }
  return { mutations, remaining, preview };
}
