import { cookies } from 'next/headers';
import { createServerSupabaseClient } from './server';
import { isSupabaseConfigured, LOCAL_SESSION_COOKIE_NAME } from './config';
import {
  deleteUserAccountFromSqlite,
  getDefaultUserPreferences,
  getUserFreezerItemsFromSqlite,
  getUserPreferencesFromSqlite,
  getUserProfileFromSqlite,
  getUserSavedRecipesFromSqlite,
  replaceUserFreezerItemsInSqlite,
  replaceUserSavedRecipesInSqlite,
  upsertUserPreferencesToSqlite,
  upsertUserProfileToSqlite,
} from '@/lib/db/sqlite';
import {
  AuthProviderType,
  CloudStorageMode,
  CommodityCategory,
  CookingVesselArchetype,
  DietaryConstraint,
  FreezerItem,
  MacroGoal,
  RecommendedDish,
  StoreChain,
  UserDataExportArchive,
  UserPreferences,
  UserProfile,
  UserSyncPayload,
} from '@/types/domain';
import { ALL_STORE_CHAINS } from '@/data/store-registry';

interface LocalSessionCookiePayload {
  userId: string;
  provider: AuthProviderType;
}

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

interface SupabaseFreezerRow {
  id: string;
  user_id: string;
  canonical_ingredient_id: string;
  ingredient_name: string;
  category: string;
  quantity_lb_or_doz: number;
  unit: string;
  purchase_price_per_unit: number;
  regular_price_per_unit: number;
  total_cost_basis: number;
  estimated_savings: number;
  store: string;
  store_banner: string;
  purchased_at_iso: string;
  notes: string | null;
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

          // Mirror in local SQLite for fast local resilience
          upsertUserProfileToSqlite(profile);

          return {
            profile,
            storageMode: 'SUPABASE_RLS',
            supabaseConfigured: true,
          };
        }
      } catch {
        // Fall through to local cookie check
      }
    }
  }

  // 2. Check HttpOnly local session cookie (Zero-Key Offline Mode or Local SSO)
  try {
    const cookieStore = await cookies();
    const rawCookie = cookieStore.get(LOCAL_SESSION_COOKIE_NAME)?.value;
    if (rawCookie) {
      const parsed = JSON.parse(rawCookie) as LocalSessionCookiePayload;
      if (parsed && typeof parsed.userId === 'string') {
        let profile = getUserProfileFromSqlite(parsed.userId);
        if (!profile) {
          const now = new Date().toISOString();
          const provider: AuthProviderType =
            parsed.provider === 'apple' ? 'apple' : 'google';
          profile = upsertUserProfileToSqlite({
            id: parsed.userId,
            email:
              provider === 'apple'
                ? 'shopper@privaterelay.appleid.com'
                : 'shopper@pantrybot.dev',
            displayName:
              provider === 'apple' ? 'Apple Meal Prepper' : 'Google Meal Prepper',
            provider,
            createdAtIso: now,
            updatedAtIso: now,
            isCloudBacked: false,
          });
        }
        return {
          profile,
          storageMode: 'SQLITE_LOCAL_FALLBACK',
          supabaseConfigured,
        };
      }
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

export async function loadUserSyncPayload(): Promise<UserSyncPayload> {
  const { profile, storageMode, supabaseConfigured } =
    await resolveCurrentUserProfile();

  if (!profile) {
    return {
      authenticated: false,
      storageMode,
      supabaseConfigured,
      profile: null,
      preferences: null,
      freezerItems: [],
      savedRecipes: [],
      syncedAtIso: new Date().toISOString(),
    };
  }

  // Attempt Supabase RLS read when cloud-backed
  if (profile.isCloudBacked && supabaseConfigured) {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      try {
        const [prefsRes, freezerRes, recipesRes] = await Promise.all([
          supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', profile.id)
            .maybeSingle(),
          supabase
            .from('user_freezer_items')
            .select('*')
            .eq('user_id', profile.id)
            .order('purchased_at_iso', { ascending: false }),
          supabase
            .from('user_saved_recipes')
            .select('*')
            .eq('user_id', profile.id)
            .order('updated_at', { ascending: false }),
        ]);

        if (!prefsRes.error && !freezerRes.error && !recipesRes.error) {
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

          const freezerRows = (freezerRes.data || []) as SupabaseFreezerRow[];
          const freezerItems: FreezerItem[] = freezerRows.map((r) => ({
            id: r.id,
            canonicalIngredientId: r.canonical_ingredient_id,
            ingredientName: r.ingredient_name,
            category: r.category as CommodityCategory,
            quantityLbOrDoz: Number(r.quantity_lb_or_doz),
            unit: (r.unit === 'doz' ? 'doz' : 'lb') as 'lb' | 'doz',
            purchasePricePerUnit: Number(r.purchase_price_per_unit),
            regularPricePerUnit: Number(r.regular_price_per_unit),
            totalCostBasis: Number(r.total_cost_basis),
            estimatedSavings: Number(r.estimated_savings),
            store: r.store as StoreChain,
            storeBanner: r.store_banner,
            purchasedAtIso: r.purchased_at_iso,
            notes: r.notes || undefined,
          }));

          const recipeRows = (recipesRes.data || []) as SupabaseSavedRecipeRow[];
          const savedRecipes: RecommendedDish[] = recipeRows.map(
            (r) => r.dish_json
          );

          // Mirror to local SQLite cache
          upsertUserPreferencesToSqlite(preferences);
          replaceUserFreezerItemsInSqlite(profile.id, freezerItems);
          replaceUserSavedRecipesInSqlite(profile.id, savedRecipes);

          return {
            authenticated: true,
            storageMode: 'SUPABASE_RLS',
            supabaseConfigured: true,
            profile,
            preferences,
            freezerItems,
            savedRecipes,
            syncedAtIso: new Date().toISOString(),
          };
        }
      } catch {
        // Fall through to SQLite fallback
      }
    }
  }

  // SQLite Multi-Tenant Fallback
  const preferences = getUserPreferencesFromSqlite(profile.id);
  const freezerItems = getUserFreezerItemsFromSqlite(profile.id);
  const savedRecipes = getUserSavedRecipesFromSqlite(profile.id);

  return {
    authenticated: true,
    storageMode,
    supabaseConfigured,
    profile,
    preferences,
    freezerItems,
    savedRecipes,
    syncedAtIso: new Date().toISOString(),
  };
}

export async function persistUserSyncState(options: {
  profile: UserProfile;
  preferences?: Partial<UserPreferences>;
  freezerItems?: FreezerItem[];
  savedRecipes?: RecommendedDish[];
  mergeMode?: boolean;
}): Promise<UserSyncPayload> {
  const { profile, preferences, freezerItems, savedRecipes, mergeMode } = options;
  const now = new Date().toISOString();

  // 1. Update SQLite Multi-Tenant Store
  const currentPrefs = getUserPreferencesFromSqlite(profile.id);
  const incomingPinned = Array.isArray(preferences?.pinnedIngredientIds)
    ? preferences.pinnedIngredientIds
    : null;
  const incomingOnHand = Array.isArray(preferences?.onHandIngredientIds)
    ? preferences.onHandIngredientIds
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
      preferences?.targetServings || currentPrefs.targetServings || 6,
    pinnedIngredientIds: mergeMode
      ? Array.from(
          new Set([
            ...currentPrefs.pinnedIngredientIds,
            ...(incomingPinned ?? []),
          ])
        )
      : (incomingPinned ?? currentPrefs.pinnedIngredientIds),
    onHandIngredientIds: mergeMode
      ? Array.from(
          new Set([
            ...currentPrefs.onHandIngredientIds,
            ...(incomingOnHand ?? []),
          ])
        )
      : (incomingOnHand ?? currentPrefs.onHandIngredientIds),
    updatedAtIso: now,
  };

  upsertUserPreferencesToSqlite(nextPrefs);

  let nextFreezer = getUserFreezerItemsFromSqlite(profile.id);
  if (Array.isArray(freezerItems)) {
    if (mergeMode) {
      const byCanonical = new Map<string, FreezerItem>();
      for (const existing of nextFreezer) {
        byCanonical.set(existing.canonicalIngredientId, existing);
      }
      for (const incoming of freezerItems) {
        if (incoming.quantityLbOrDoz <= 0) continue;
        const match = byCanonical.get(incoming.canonicalIngredientId);
        if (!match) {
          byCanonical.set(incoming.canonicalIngredientId, incoming);
        } else {
          // Accumulate stock and compute weighted-average unit prices
          const totalQty = Number(
            (match.quantityLbOrDoz + incoming.quantityLbOrDoz).toFixed(2)
          );
          const weightedPurchasePrice =
            totalQty > 0
              ? (match.quantityLbOrDoz * match.purchasePricePerUnit +
                  incoming.quantityLbOrDoz * incoming.purchasePricePerUnit) /
                totalQty
              : 0;
          const weightedRegularPrice =
            totalQty > 0
              ? (match.quantityLbOrDoz * match.regularPricePerUnit +
                  incoming.quantityLbOrDoz * incoming.regularPricePerUnit) /
                totalQty
              : 0;
          const totalCostBasis = Number(
            (totalQty * weightedPurchasePrice).toFixed(2)
          );
          const estimatedSavings = Number(
            Math.max(
              0,
              totalQty * (weightedRegularPrice - weightedPurchasePrice)
            ).toFixed(2)
          );
          byCanonical.set(incoming.canonicalIngredientId, {
            ...incoming,
            id: match.id,
            quantityLbOrDoz: totalQty,
            totalCostBasis,
            estimatedSavings,
            purchasePricePerUnit: Number(weightedPurchasePrice.toFixed(4)),
            regularPricePerUnit: Number(weightedRegularPrice.toFixed(4)),
          });
        }
      }
      nextFreezer = replaceUserFreezerItemsInSqlite(
        profile.id,
        Array.from(byCanonical.values())
      );
    } else {
      nextFreezer = replaceUserFreezerItemsInSqlite(profile.id, freezerItems);
    }
  }

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

  // 2. Sync to Supabase Postgres RLS if cloud-backed
  if (profile.isCloudBacked && isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('users').upsert({
          id: profile.id,
          email: profile.email,
          display_name: profile.displayName,
          avatar_url: profile.avatarUrl || null,
          provider: profile.provider,
          updated_at: now,
        });

        await supabase.from('user_preferences').upsert({
          user_id: profile.id,
          default_zip: nextPrefs.defaultZip,
          favorite_store_ids: nextPrefs.favoriteStoreIds,
          macro_goal: nextPrefs.macroGoal,
          dietary_constraints: nextPrefs.dietaryConstraints,
          vessel_archetype: nextPrefs.vesselArchetype,
          target_servings: nextPrefs.targetServings,
          pinned_ingredient_ids: nextPrefs.pinnedIngredientIds,
          on_hand_ingredient_ids: nextPrefs.onHandIngredientIds,
          updated_at: now,
        });

        if (freezerItems) {
          await supabase
            .from('user_freezer_items')
            .delete()
            .eq('user_id', profile.id);

          if (nextFreezer.length > 0) {
            await supabase.from('user_freezer_items').insert(
              nextFreezer.map((f) => ({
                id: f.id,
                user_id: profile.id,
                canonical_ingredient_id: f.canonicalIngredientId,
                ingredient_name: f.ingredientName,
                category: f.category,
                quantity_lb_or_doz: f.quantityLbOrDoz,
                unit: f.unit,
                purchase_price_per_unit: f.purchasePricePerUnit,
                regular_price_per_unit: f.regularPricePerUnit,
                total_cost_basis: f.totalCostBasis,
                estimated_savings: f.estimatedSavings,
                store: f.store,
                store_banner: f.storeBanner,
                purchased_at_iso: f.purchasedAtIso,
                notes: f.notes || null,
                updated_at: now,
              }))
            );
          }
        }
      } catch {
        // Fallback already persisted in SQLite
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
    preferences: nextPrefs,
    freezerItems: nextFreezer,
    savedRecipes: nextRecipes,
    syncedAtIso: now,
  };
}

export async function buildUserDataExportArchive(
  profile: UserProfile
): Promise<UserDataExportArchive> {
  const payload = await loadUserSyncPayload();
  const preferences =
    payload.preferences || getDefaultUserPreferences(profile.id);

  return {
    schemaVersion: '1.3.0',
    exportedAtIso: new Date().toISOString(),
    application: 'PantryBot (pantrybot.dev)',
    piiPolicy:
      'Strict Minimization (id, email, display_name, and user-configured grocery preferences only)',
    profile,
    preferences,
    virtualFreezerInventory: payload.freezerItems,
    savedMealPrepRecipes: payload.savedRecipes,
  };
}

export async function purgeUserAccountAndData(profile: UserProfile): Promise<void> {
  // 1. Delete from Supabase RLS tables and sign out if cloud-backed
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      try {
        await supabase
          .from('user_saved_recipes')
          .delete()
          .eq('user_id', profile.id);
        await supabase
          .from('user_freezer_items')
          .delete()
          .eq('user_id', profile.id);
        await supabase
          .from('user_preferences')
          .delete()
          .eq('user_id', profile.id);
        await supabase.from('users').delete().eq('id', profile.id);
        await supabase.auth.signOut();
      } catch {
        // Continue to local SQLite purge
      }
    }
  }

  // 2. Delete from local SQLite multi-tenant tables
  deleteUserAccountFromSqlite(profile.id);

  // 3. Clear local session cookie
  try {
    const cookieStore = await cookies();
    cookieStore.delete(LOCAL_SESSION_COOKIE_NAME);
  } catch {
    // Ignore
  }
}
