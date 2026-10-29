import { loadInventoryState, resolveCurrentUserProfile } from '@/lib/supabase/session';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { migratePantryInSqlite, mutatePantryInSqlite, readPantryFromSqlite } from '@/lib/db/sqlite';
import { PantryMutation, PantryMutationResult, PantryOwner } from '@/types/pantry';
import { UserProfile } from '@/types/domain';
import { migrateLegacyPantry, PantryMigrationSnapshot } from './migration';
import { PantryError } from './mutations';
import { availablePantryIngredientIds } from './model';

export interface PantryContext { owner: PantryOwner; profile: UserProfile }

export async function resolvePantryContext(): Promise<PantryContext> {
  const { profile } = await resolveCurrentUserProfile();
  if (profile) return { owner: `account:${profile.id}`, profile };
  const guest = await loadInventoryState(true, true);
  if (!guest.profile) throw new PantryError('session_required', 401, 'A private session is required.');
  return { owner: `guest:${guest.profile.id}`, profile: guest.profile };
}

export async function pantryRpc<T>(action: string, payload: object = {}): Promise<T> {
  const client = await createServerSupabaseClient();
  if (!client) throw new PantryError('storage_unavailable', 503, 'Pantry storage is unavailable. Retry when connected.');
  const { data, error } = await client.rpc('pantry_rpc', { p_action: action, p_payload: payload });
  if (error) {
    const known: Record<string, number> = { session_required: 401, invalid_mutation: 400, invalid_entry: 400,
      legacy_changed: 409, migration_required: 409, mutation_id_reused: 409, pantry_upgrade_required: 426 };
    const code = Object.keys(known).find((candidate) => error.message === candidate);
    throw new PantryError(code ?? 'storage_unavailable', code ? known[code] : 503,
      code ?? 'Pantry storage is unavailable. Your pending edits have not been saved.');
  }
  if (!data) throw new PantryError('storage_unavailable', 503, 'Pantry storage did not acknowledge the request.');
  return data as T;
}

export function readPrivatePantry(context: PantryContext): Promise<PantryMigrationSnapshot> {
  return context.profile.isCloudBacked ? pantryRpc('read') : Promise.resolve(readPantryFromSqlite(context.owner));
}

/** The profile must come from the verified session, never a request body. */
export async function readProfilePantryAvailability(profile: UserProfile | null): Promise<string[]> {
  if (!profile) return [];
  const owner: PantryOwner = `${profile.id.startsWith('guest-') ? 'guest' : 'account'}:${profile.id}`;
  const snapshot = await readPrivatePantry({ owner, profile });
  if (snapshot.owner !== owner) throw new PantryError('owner_changed', 409, 'The pantry account changed.');
  return snapshot.legacyMigrationVersion ? availablePantryIngredientIds(snapshot.entries) : [];
}

export async function migratePrivatePantry(context: PantryContext): Promise<PantryMigrationSnapshot> {
  if (!context.profile.isCloudBacked) return migratePantryInSqlite(context.owner);
  const current = await readPrivatePantry(context);
  if (current.owner !== context.owner) throw new PantryError('owner_changed', 409, 'The pantry account changed.');
  if (current.legacyMigrationVersion) return current;
  const prepared = migrateLegacyPantry(current, current.legacySource!, new Date().toISOString());
  return pantryRpc('migrate', { source: prepared.legacySource, entries: prepared.entries });
}

export function mutatePrivatePantry(context: PantryContext, mutation: PantryMutation): Promise<PantryMutationResult> {
  return context.profile.isCloudBacked ? pantryRpc('mutate', mutation) : Promise.resolve(mutatePantryInSqlite(context.owner, mutation));
}
