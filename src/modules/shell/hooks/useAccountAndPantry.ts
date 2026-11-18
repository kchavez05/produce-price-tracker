import { useCallback, useMemo, useRef, useState, type RefObject } from 'react';
import { usePantry } from '@/hooks/usePantry';
import { useUserSync } from '@/hooks/useUserSync';
import { availablePantryIngredientIds } from '@/lib/pantry/model';
import type {
  CookingVesselArchetype, DietaryConstraint, MacroGoal, RecommendedDish, StoreChain, UserSyncPayload,
} from '@/types/domain';

// Moved verbatim from MealPrepDashboard (v2.0 M3 Phase A.5c): cloud hydration, the account sync hook, the private
// pantry wiring and the saved-recipe library. Nothing here changes who owns data:
//  - the pantry owner ref is assigned during every render, as before;
//  - savedRecipeIds is rebuilt every render (not memoized), as before;
//  - the account-bound queue and owner logic stay inside usePantry and useUserSync.
// `syncAcknowledged` is created by the dashboard because the payload hook that fills it must be called after this
// hook (it needs the pantry owner ref and the on-hand ids returned here).
interface PreferenceSetters {
  setCurrentZip: (zip: string) => void;
  setZipInput: (zip: string) => void;
  setActiveStores: (stores: StoreChain[]) => void;
  setMacroGoal: (goal: MacroGoal) => void;
  setDietaryConstraints: (constraints: DietaryConstraint[]) => void;
  setApplianceFilter: (vessel: CookingVesselArchetype) => void;
  setTargetServings: (servings: 4 | 6 | 8) => void;
  setPinnedIds: (ids: string[]) => void;
}

export function useAccountAndPantry(
  initialAccountId: string | null,
  initialPrivateRecipes: RecommendedDish[],
  setters: PreferenceSetters,
  syncAcknowledged: RefObject<() => void>,
) {
  const {
    setCurrentZip, setZipInput, setActiveStores, setMacroGoal, setDietaryConstraints, setApplianceFilter,
    setTargetServings, setPinnedIds,
  } = setters;
  const [savedLibrary, setSavedLibrary] = useState<{ owner: string; recipes: RecommendedDish[] }>(() => ({ owner: initialAccountId ? `account:${initialAccountId}` : 'guest:ssr', recipes: initialPrivateRecipes }));

  const handleCloudHydrated = useCallback((payload: UserSyncPayload) => {
    if (!payload.authenticated || !payload.preferences) return;
    const prefs = payload.preferences;
    if (prefs.defaultZip && /^\d{5}$/.test(prefs.defaultZip)) {
      setCurrentZip(prefs.defaultZip);
      setZipInput(prefs.defaultZip);
    }
    if (
      Array.isArray(prefs.favoriteStoreIds) &&
      prefs.favoriteStoreIds.length > 0
    ) {
      setActiveStores(prefs.favoriteStoreIds);
    }
    if (prefs.macroGoal) setMacroGoal(prefs.macroGoal);
    if (Array.isArray(prefs.dietaryConstraints)) {
      setDietaryConstraints(prefs.dietaryConstraints);
    }
    if (prefs.vesselArchetype) setApplianceFilter(prefs.vesselArchetype);
    if (prefs.targetServings) setTargetServings(prefs.targetServings);
    if (Array.isArray(prefs.pinnedIngredientIds)) {
      setPinnedIds(prefs.pinnedIngredientIds);
    }

    setSavedLibrary({ owner: `account:${payload.profile!.id}`, recipes: payload.savedRecipes || [] });
    // The setters come from the preference and location hooks, so the lint rule cannot see that they are stable
    // useState setters. Listing them keeps the callback identity unchanged (they never change).
  }, [setCurrentZip, setZipInput, setActiveStores, setMacroGoal, setDietaryConstraints, setApplianceFilter, setTargetServings, setPinnedIds]);

  // useUserSync is created before the pantry and the payload hook, which the acknowledgment callback needs, so it
  // calls through this ref; the dashboard assigns it each render, right after useDashboardPayload.
  const userSync = useUserSync({
    onCloudStateHydrated: handleCloudHydrated,
    onSyncAcknowledged: () => syncAcknowledged.current(),
  });
  const pantryAccountId = userSync.lastSyncedIso !== null ? userSync.profile?.id ?? null : initialAccountId;
  const pantry = usePantry(true, pantryAccountId);
  const savedRecipeIds = savedLibrary.owner === pantry.owner || (savedLibrary.owner === 'guest:ssr' && pantry.guest)
      ? Object.fromEntries(savedLibrary.recipes.map((dish) => [dish.id, true])) : {};
  const pantryOwnerRef = useRef(pantry.owner);
  pantryOwnerRef.current = pantry.owner;

  // Availability comes only from the private Pantry.
  const effectiveOnHandIds = useMemo(() => availablePantryIngredientIds(pantry.entries), [pantry.entries]);
  const canUseAi = userSync.profile?.isCloudBacked === true && pantry.owner === `account:${userSync.profile.id}`;

  return { userSync, pantry, pantryAccountId, pantryOwnerRef, effectiveOnHandIds, savedLibrary, setSavedLibrary, savedRecipeIds, canUseAi };
}
