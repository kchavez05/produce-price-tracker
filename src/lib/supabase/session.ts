import { randomUUID } from 'node:crypto';
import { getSecureCookieOptions } from '@/lib/security/rate-limit';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from './server';
import { createServerSupabaseAdminClient } from './admin';
import { isSupabaseConfigured, LOCAL_SESSION_COOKIE_NAME, GUEST_SESSION_COOKIE_NAME } from './config';
import {
  deleteUserAccountFromSqlite,
  getDefaultUserPreferences,
  getUserPreferencesFromSqlite,
  createLocalSession,
  getLocalSessionProfile,
  revokeLocalSession,
  getUserSavedRecipesFromSqlite,
  replaceUserSavedRecipesInSqlite,
  hasPantryMigrationInSqlite,
  upsertUserPreferencesToSqlite,
  upsertUserProfileToSqlite,
} from '@/lib/db/sqlite';
import {
  AuthProviderType,
  CloudStorageMode,
  CookingVesselArchetype,
  DietaryConstraint,
  MacroGoal,
  RecommendedDish,
  StoreChain,
  UserDataExportArchive,
  UserPreferences,
  UserProfile,
  UserSyncPayload,
  SyncedUserPreferences,
} from '@/types/domain';
import { ALL_STORE_CHAINS } from '@/data/store-registry';
import { PantryError } from '@/lib/pantry/mutations';
import { withoutDerivedPantryPricing } from '@/lib/pantry/saved-pricing';
import { hasLegacyInventoryFields, withoutLegacyOnHand } from '@/lib/pantry/legacy-sync';

interface SupabasePreferencesRow {
  user_id: string;
  default_zip: string;
  favorite_store_ids: string[] | null;
  macro_goal: string;
  dietary_constraints: string[] | null;
  vessel_archetype: string;
  target_servings: number;
  pinned_ingredient_ids: string[] | null;
  on_hand_ingredient_ids: string[] | null;
  updated_at: string;
}

interface SupabaseSavedRecipeRow {
  id: string;
  user_id: string;
  title: string;
  style: string;
  dish_json: RecommendedDish;
  updated_at: string;
}

export async function resolveCurrentUserProfile(): Promise<{
  profile: UserProfile | null;
  storageMode: CloudStorageMode;
  supabaseConfigured: boolean;
}> {
  const supabaseConfigured = isSupabaseConfigured();

  // 1. Check live Supabase Auth session first if configured
  if (supabaseConfigured) {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const rawProvider = user.app_metadata?.provider;
          const provider: AuthProviderType =
            rawProvider === 'apple' ? 'apple' : 'google';
          const metaName =
            (typeof user.user_metadata?.full_name === 'string' &&
              user.user_metadata.full_name) ||
            (typeof user.user_metadata?.name === 'string' &&
              user.user_metadata.name) ||
            (user.email ? user.email.split('@')[0] : 'PantryBot Shopper');
          const avatarUrl =
            typeof user.user_metadata?.avatar_url === 'string'
              ? user.user_metadata.avatar_url
              : undefined;

          const profile: UserProfile = {
            id: user.id,
            email: user.email || 'shopper@pantrybot.dev',
            displayName: metaName || 'PantryBot Shopper',
            avatarUrl,
            provider,
            createdAtIso: user.created_at || new Date().toISOString(),
            updatedAtIso: user.updated_at || new Date().toISOString(),
            isCloudBacked: true,
          };

          // Auth identities can outlive their application profile (for example
          // after account-data deletion). Reconcile only this verified identity
          // through its RLS client before any inventory reads. DO NOTHING keeps
          // concurrent loads safe and never overwrites existing profile/children
          // or replays local preferences into the cloud.
          try {
            const result = await supabase.from('users').upsert({
              id: profile.id, email: profile.email, display_name: profile.displayName,
              avatar_url: profile.avatarUrl ?? null, provider: profile.provider,
            }, { onConflict: 'id', ignoreDuplicates: true });
            if (result.error) throw new Error('Profile creation was not acknowledged');
          } catch {
            throw new PantryError('storage_unavailable', 503, 'Couldn’t prepare this account. Retry when connected.');
          }

          // Mirror only after the cloud acknowledges the application profile.
          upsertUserProfileToSqlite(profile);

          return {
            profile,
            storageMode: 'SUPABASE_RLS',
            supabaseConfigured: true,
          };
        }
      } catch (error) {
        // A verified account with a failed cloud write must never become a
        // successful local/guest session or acknowledge pending inventory edits.
        if (error instanceof PantryError) throw error;
        // Fall through to local cookie check
      }
    }
  }

  // 2. Check HttpOnly local session cookie (Zero-Key Offline Mode or Local SSO)
  try {
    const cookieStore = await cookies();
    const rawCookie = cookieStore.get(LOCAL_SESSION_COOKIE_NAME)?.value;
    const profile = getLocalSessionProfile(rawCookie);
    if (profile) {
      return { profile, storageMode: 'SQLITE_LOCAL_FALLBACK', supabaseConfigured };
    }
  } catch {
    // Ignore malformed cookie
  }

  return {
    profile: null,
    storageMode: supabaseConfigured ? 'SUPABASE_RLS' : 'SQLITE_LOCAL_FALLBACK',
    supabaseConfigured,
  };
}

/** Guest data is private to an opaque browser session, never a shared table. */
export async function loadInventoryState(createGuest = false, requireCloud = false): Promise<{
  profile: UserProfile | null;
  savedRecipes: RecommendedDish[];
}> {
  const payload = await loadUserSyncPayload(requireCloud);
  if (payload.profile) return payload;
  let profile: UserProfile | null = null;
  try {
    const cookieStore = await cookies();
    profile = getLocalSessionProfile(cookieStore.get(GUEST_SESSION_COOKIE_NAME)?.value);
    if (!profile && createGuest) {
      const now = new Date().toISOString();
      profile = upsertUserProfileToSqlite({
        id: `guest-${randomUUID()}`, email: '', displayName: 'Guest',
        provider: 'google', createdAtIso: now, updatedAtIso: now, isCloudBacked: false,
      });
      cookieStore.set(GUEST_SESSION_COOKIE_NAME, createLocalSession(profile.id), getSecureCookieOptions());
    }
  } catch (error) {
    if (createGuest) throw error;
  }
  return {
    profile,
    savedRecipes: profile ? getUserSavedRecipesFromSqlite(profile.id) : [],
  };
}

export async function loadUserSyncPayload(requireCloud = false): Promise<UserSyncPayload> {
  const { profile, storageMode, supabaseConfigured } =
    await resolveCurrentUserProfile();

  if (!profile) {
    return {
      authenticated: false,
      storageMode,
      supabaseConfigured,
      profile: null,
      preferences: null,
      savedRecipes: [],
      syncedAtIso: new Date().toISOString(),
    };
  }

  // Attempt Supabase RLS read when cloud-backed
  if (profile.isCloudBacked && supabaseConfigured) {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      try {
        const [prefsRes, recipesRes] = await Promise.all([
          supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', profile.id)
            .maybeSingle(),
          supabase
            .from('user_saved_recipes')
            .select('*')
            .eq('user_id', profile.id)
            .order('updated_at', { ascending: false }),
        ]);

        if (!prefsRes.error && !recipesRes.error) {
          const prefRow = prefsRes.data as SupabasePreferencesRow | null;
          const preferences: UserPreferences = prefRow
            ? {
                userId: profile.id,
                defaultZip: prefRow.default_zip || '80542',
                favoriteStoreIds:
                  Array.isArray(prefRow.favorite_store_ids) &&
                  prefRow.favorite_store_ids.length > 0
                    ? (prefRow.favorite_store_ids as StoreChain[])
                    : [...ALL_STORE_CHAINS],
                macroGoal: (prefRow.macro_goal || 'ANY') as MacroGoal,
                dietaryConstraints: Array.isArray(prefRow.dietary_constraints)
                  ? (prefRow.dietary_constraints as DietaryConstraint[])
                  : [],
                vesselArchetype: (prefRow.vessel_archetype ||
                  'ANY') as CookingVesselArchetype,
                targetServings:
                  prefRow.target_servings === 4 || prefRow.target_servings === 8
                    ? prefRow.target_servings
                    : 6,
                pinnedIngredientIds: Array.isArray(prefRow.pinned_ingredient_ids)
                  ? prefRow.pinned_ingredient_ids
                  : [],
                onHandIngredientIds: Array.isArray(prefRow.on_hand_ingredient_ids)
                  ? prefRow.on_hand_ingredient_ids
                  : [],
                updatedAtIso: prefRow.updated_at || new Date().toISOString(),
              }
            : getDefaultUserPreferences(profile.id);

          const recipeRows = (recipesRes.data || []) as SupabaseSavedRecipeRow[];
          const savedRecipes: RecommendedDish[] = recipeRows.map(
            (r) => withoutDerivedPantryPricing(r.dish_json)
          );

          // Mirror to local SQLite cache
          upsertUserPreferencesToSqlite(preferences);
          replaceUserSavedRecipesInSqlite(profile.id, savedRecipes);

          return {
            authenticated: true,
            storageMode: 'SUPABASE_RLS',
            supabaseConfigured: true,
            profile,
            preferences: withoutLegacyOnHand(preferences),
            savedRecipes,
            syncedAtIso: new Date().toISOString(),
          };
        }
        if (requireCloud) throw new Error('Unable to load current cloud state');
      } catch (error) {
        if (requireCloud) throw error;
        // Read-only requests may use the last cached state while offline.
      }
    }
    if (requireCloud) throw new Error('Cloud storage unavailable');
  }

  // SQLite Multi-Tenant Fallback
  const preferences = getUserPreferencesFromSqlite(profile.id);
  const savedRecipes = getUserSavedRecipesFromSqlite(profile.id);

  return {
    authenticated: true,
    storageMode,
    supabaseConfigured,
    profile,
    preferences: withoutLegacyOnHand(preferences),
    savedRecipes,
    syncedAtIso: new Date().toISOString(),
  };
}

export async function persistUserSyncState(options: {
  profile: UserProfile;
  preferences?: Partial<SyncedUserPreferences>;
  savedRecipes?: RecommendedDish[];
  mergeMode?: boolean;
}): Promise<UserSyncPayload> {
  const { profile, preferences, savedRecipes, mergeMode } = options;
  if (hasLegacyInventoryFields(options)) {
    throw new PantryError('pantry_upgrade_required', 426, 'Reload to manage inventory in Virtual Pantry.');
  }
  const now = new Date().toISOString();

  // 1. Update SQLite Multi-Tenant Store
  const currentPrefs = getUserPreferencesFromSqlite(profile.id);
  const incomingPinned = Array.isArray(preferences?.pinnedIngredientIds)
    ? preferences.pinnedIngredientIds
    : null;

  const nextPrefs: UserPreferences = {
    userId: profile.id,
    defaultZip: preferences?.defaultZip || currentPrefs.defaultZip || '80542',
    favoriteStoreIds:
      Array.isArray(preferences?.favoriteStoreIds) &&
      preferences.favoriteStoreIds.length > 0
        ? preferences.favoriteStoreIds
        : currentPrefs.favoriteStoreIds,
    macroGoal: preferences?.macroGoal || currentPrefs.macroGoal || 'ANY',
    dietaryConstraints: Array.isArray(preferences?.dietaryConstraints)
      ? preferences.dietaryConstraints
      : currentPrefs.dietaryConstraints,
    vesselArchetype:
      preferences?.vesselArchetype || currentPrefs.vesselArchetype || 'ANY',
    targetServings:
      preferences?.targetServings &&
      [4, 6, 8].includes(preferences.targetServings)
        ? preferences.targetServings
        : currentPrefs.targetServings || 6,
    pinnedIngredientIds: mergeMode
      ? Array.from(
          new Set([
            ...currentPrefs.pinnedIngredientIds,
            ...(incomingPinned ?? []),
          ])
        )
      : (incomingPinned ?? currentPrefs.pinnedIngredientIds),
    onHandIngredientIds: currentPrefs.onHandIngredientIds,
    updatedAtIso: now,
  };

  upsertUserPreferencesToSqlite(nextPrefs);

  let nextRecipes = getUserSavedRecipesFromSqlite(profile.id);
  if (savedRecipes) {
    if (mergeMode) {
      const byId = new Map<string, RecommendedDish>();
      for (const r of nextRecipes) byId.set(r.id, r);
      for (const r of savedRecipes) byId.set(r.id, r);
      nextRecipes = replaceUserSavedRecipesInSqlite(
        profile.id,
        Array.from(byId.values())
      );
    } else {
      nextRecipes = replaceUserSavedRecipesInSqlite(profile.id, savedRecipes);
    }
  }

  // A successful response means the cloud acknowledged every requested write.
  // Supabase returns errors as values; awaiting a query alone does not check them.
  if (profile.isCloudBacked && isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    if (!supabase) throw new Error('Cloud sync unavailable');
    const check = async <T extends { error: { message: string } | null }>(query: PromiseLike<T>): Promise<T> => {
      const result = await query;
      if (result.error?.message === 'pantry_upgrade_required') throw new PantryError('pantry_upgrade_required', 426, 'Reload to manage inventory in Virtual Pantry.');
      if (result.error) throw new Error(`Cloud sync failed: ${result.error.message}`);
      return result;
    };
    await check(supabase.from('users').upsert({
      id: profile.id, email: profile.email, display_name: profile.displayName,
      avatar_url: profile.avatarUrl || null, provider: profile.provider, updated_at: now,
    }));
    await check(supabase.from('user_preferences').upsert({
      user_id: profile.id, default_zip: nextPrefs.defaultZip,
      favorite_store_ids: nextPrefs.favoriteStoreIds, macro_goal: nextPrefs.macroGoal,
      dietary_constraints: nextPrefs.dietaryConstraints, vessel_archetype: nextPrefs.vesselArchetype,
      target_servings: nextPrefs.targetServings, pinned_ingredient_ids: nextPrefs.pinnedIngredientIds,
      updated_at: now,
    }));
    if (savedRecipes) {
      if (nextRecipes.length > 0) {
        await check(supabase.from('user_saved_recipes').upsert(nextRecipes.map((dish) => ({
          id: dish.id, user_id: profile.id, title: dish.title, style: dish.style,
          dish_json: dish, updated_at: now,
        })), { onConflict: 'user_id,id' }));
      }
      const { data } = await check(supabase.from('user_saved_recipes').select('id').eq('user_id', profile.id));
      const activeIds = new Set(nextRecipes.map((r) => r.id));
      const staleIds = (data || []).map((r: { id: string }) => r.id).filter((id: string) => !activeIds.has(id));
      if (staleIds.length) {
        await check(supabase.from('user_saved_recipes').delete().eq('user_id', profile.id).in('id', staleIds));
      }
    }
  }

  return {
    authenticated: true,
    storageMode: profile.isCloudBacked
      ? 'SUPABASE_RLS'
      : 'SQLITE_LOCAL_FALLBACK',
    supabaseConfigured: isSupabaseConfigured(),
    profile,
    preferences: withoutLegacyOnHand(nextPrefs),
    savedRecipes: nextRecipes,
    syncedAtIso: now,
  };
}

export async function buildUserDataExportArchive(
  profile: UserProfile
): Promise<UserDataExportArchive> {
  const payload = await loadUserSyncPayload(profile.isCloudBacked);
  if (payload.profile?.id !== profile.id) throw new PantryError('owner_changed', 409, 'The export account changed. Retry from the original account.');
  const { legacyInventoryForExport } = await import('@/lib/pantry/legacy-export.server');
  const legacy = await legacyInventoryForExport(profile);
  const preferences = { ...(payload.preferences || getDefaultUserPreferences(profile.id)), onHandIngredientIds: legacy.onHandIngredientIds };

  let virtualPantry: import('@/lib/pantry/migration').PantryMigrationSnapshot | undefined;
  if (profile.isCloudBacked) {
    const { pantryRpc } = await import('@/lib/pantry/server');
    virtualPantry = await pantryRpc('read');
  } else {
    const { readPantryFromSqlite } = await import('@/lib/db/sqlite');
    if (hasPantryMigrationInSqlite(profile.id)) virtualPantry = readPantryFromSqlite(`account:${profile.id}`);
  }

  return {
    schemaVersion: '1.3.0',
    exportedAtIso: new Date().toISOString(),
    application: 'PantryBot (pantrybot.dev)',
    piiPolicy:
      'Strict Minimization (id, email, display_name, and user-configured grocery preferences only)',
    profile,
    preferences,
    virtualFreezerInventory: legacy.freezerItems,
    savedMealPrepRecipes: payload.savedRecipes,
    ...(virtualPantry?.legacyMigrationVersion ? { virtualPantry } : {}),
  };
}

export async function purgeUserAccountAndData(profile: UserProfile): Promise<void> {
  // 1. Verify ownership again before privileged deletion. Auth owns the profile,
  // pantry and personal AI usage cascades; deleting only public.users misses usage.
  if (profile.isCloudBacked) {
    if (!isSupabaseConfigured()) throw new Error('Cloud account deletion unavailable');
    const supabase = await createServerSupabaseClient();
    const admin = createServerSupabaseAdminClient();
    if (!supabase || !admin) throw new Error('Cloud account deletion unavailable');
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user || user.id !== profile.id) throw new Error('Cloud account ownership could not be verified');
    // Revocation precedes hard deletion. Existing JWTs cannot authorize AI because
    // paid routes freshly verify Auth; RLS children also cascade from this identity.
    const signedOut = await supabase.auth.signOut({ scope: 'global' });
    if (signedOut.error) throw new Error('Could not revoke the account session');
    const deleted = await admin.auth.admin.deleteUser(user.id, false);
    if (deleted.error) throw new Error('Cloud account deletion failed');
  }

  // 2. Delete from local SQLite multi-tenant tables
  deleteUserAccountFromSqlite(profile.id);

  // 3. Clear local session cookie
  try {
    const cookieStore = await cookies();
    revokeLocalSession(cookieStore.get(LOCAL_SESSION_COOKIE_NAME)?.value);
    cookieStore.delete(LOCAL_SESSION_COOKIE_NAME);
  } catch {
    // Ignore
  }
}
