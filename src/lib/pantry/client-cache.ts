import { PantryEntry, PantryOwner } from '@/types/pantry';
import { PantryMigrationSnapshot } from './migration';
import { pantryIdentity, validatePantryEntry } from './model';

export const guestPantryKey = 'pantrybot_private_guest_pantry_v16';
export const pantryCacheKey = (owner: PantryOwner) => `pantrybot_pantry_cache_v16:${owner}`;
export type PantryStorage = Pick<Storage, 'getItem' | 'setItem'>;

export function parsePantrySnapshot(raw: unknown, owner?: PantryOwner): PantryMigrationSnapshot {
  if (!raw || typeof raw !== 'object') throw new Error('The saved pantry could not be read. Its original data has been preserved.');
  const value = raw as Record<string, unknown>;
  if (typeof value.owner !== 'string' || !/^(account|guest):.+/.test(value.owner) || (owner && value.owner !== owner) || !Array.isArray(value.entries)) {
    throw new Error('The saved pantry owner does not match this session.');
  }
  const entries: PantryEntry[] = value.entries.map((item: unknown) => {
    if (!item || typeof item !== 'object') throw new Error('Invalid saved pantry entry; original data retained.');
    const row = item as Record<string, unknown>;
    const validated = validatePantryEntry(row);
    if (!validated.ok || typeof row.id !== 'string' || !Number.isSafeInteger(row.revision) || (row.revision as number) < 1 || typeof row.updatedAtIso !== 'string' || (row.deletedAtIso !== undefined && typeof row.deletedAtIso !== 'string')) {
      throw new Error('Invalid saved pantry details; original data retained.');
    }
    return { ...validated.value, id: row.id, revision: row.revision as number, updatedAtIso: row.updatedAtIso,
      ...(row.deletedAtIso !== undefined ? { deletedAtIso: row.deletedAtIso as string } : {}) };
  });
  if (new Set(entries.map((entry) => entry.id)).size !== entries.length || new Set(entries.map(pantryIdentity)).size !== entries.length) {
    throw new Error('Duplicate saved pantry identities need recovery; original data retained.');
  }
  return { ...(raw as PantryMigrationSnapshot), owner: value.owner as PantryOwner, entries };
}

export function cachePantrySnapshot(storage: PantryStorage, snapshot: PantryMigrationSnapshot): void {
  const key = pantryCacheKey(snapshot.owner);
  const raw = storage.getItem(key);
  if (raw) {
    try { parsePantrySnapshot(JSON.parse(raw), snapshot.owner); }
    catch { storage.setItem(`${key}:recovery:${crypto.randomUUID()}`, raw); }
  }
  storage.setItem(key, JSON.stringify(snapshot));
}

export function readGuestPantry(storage: PantryStorage): PantryMigrationSnapshot {
  const raw = storage.getItem(guestPantryKey);
  if (raw) {
    const guest = parsePantrySnapshot(JSON.parse(raw));
    if (!guest.owner.startsWith('guest:')) throw new Error('The private guest pantry has an invalid owner.');
    return guest;
  }
  const owner: PantryOwner = `guest:local-${crypto.randomUUID()}`;
  const guest: PantryMigrationSnapshot = { owner, entries: [], legacyMigrationVersion: 1, needsCatalogMatch: [], legacySource: { owner, freezerItems: [], onHandIngredientIds: [] } };
  storage.setItem(guestPantryKey, JSON.stringify(guest));
  return guest;
}

export function mergeAcknowledgedEntry(snapshot: PantryMigrationSnapshot, entry: PantryEntry): PantryMigrationSnapshot {
  const current = snapshot.entries.find((item) => item.id === entry.id);
  if (current && current.revision > entry.revision) return snapshot;
  return { ...snapshot, entries: [...snapshot.entries.filter((item) => item.id !== entry.id), entry] };
}
