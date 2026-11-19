import type { Dispatch, SetStateAction } from 'react';
import type React from 'react';
import type { useUserSync } from '@/hooks/useUserSync';
import type { useDashboardPayload } from '@/modules/shell/hooks/useDashboardPayload';
import type {
  CookingVesselArchetype, DietaryConstraint, MacroGoal, RecommendedDish, StoreChain,
} from '@/types/domain';

// Moved verbatim from MealPrepDashboard (v2.0 M3 Phase A.5d): the preference and location actions. Every handler is
// a plain function recreated on each render (not memoized), reading the current values passed in `args`, exactly
// like the closures they were. Each does the same four steps: set state, persist locally, push to the cloud, and
// refetch through syncDashboard. Nothing here owns state; the dashboard still does.
interface PreferenceActionsArgs {
  storeFilter: 'ALL' | StoreChain;
  pinnedIds: string[];
  effectiveOnHandIds: string[];
  targetServings: 4 | 6 | 8;
  currentZip: string;
  activeStores: StoreChain[];
  macroGoal: MacroGoal;
  dietaryConstraints: DietaryConstraint[];
  applianceFilter: CookingVesselArchetype;
  zipInput: string;
  userSync: Pick<ReturnType<typeof useUserSync>, 'pushCloudSync'>;
  syncDashboard: ReturnType<typeof useDashboardPayload>['syncDashboard'];
  setMacroGoal: (goal: MacroGoal) => void;
  setDietaryConstraints: (constraints: DietaryConstraint[]) => void;
  setApplianceFilter: (vessel: CookingVesselArchetype) => void;
  setActiveStores: Dispatch<SetStateAction<StoreChain[]>>;
  setPinnedIds: (ids: string[]) => void;
  setTargetServings: (servings: 4 | 6 | 8) => void;
  setStoreFilter: (store: 'ALL' | StoreChain) => void;
  setCurrentZip: (zip: string) => void;
  setZipInput: (zip: string) => void;
  setZipError: (error: string | null) => void;
  setZipLoading: (loading: boolean) => void;
  setShowZipModal: (show: boolean) => void;
  setCustomAiDishes: (dishes: RecommendedDish[] | null) => void;
  setTripMode: (mode: 'SPLIT' | StoreChain) => void;
}

export function usePreferenceActions({
  storeFilter, pinnedIds, effectiveOnHandIds, targetServings, currentZip, activeStores, macroGoal, dietaryConstraints,
  applianceFilter, zipInput, userSync, syncDashboard,
  setMacroGoal, setDietaryConstraints, setApplianceFilter, setActiveStores, setPinnedIds, setTargetServings,
  setStoreFilter, setCurrentZip, setZipInput, setZipError, setZipLoading, setShowZipModal, setCustomAiDishes, setTripMode,
}: PreferenceActionsArgs) {
  function persistProfileToLocalStorage(
    nextMacro: MacroGoal,
    nextDietary: DietaryConstraint[],
    nextVessel: CookingVesselArchetype
  ) {
    try {
      localStorage.setItem(
        'pantrybot_nutrition_profile_v12',
        JSON.stringify({
          macroGoal: nextMacro,
          dietaryConstraints: nextDietary,
          applianceFilter: nextVessel,
        })
      );
    } catch {
      // Ignore
    }
  }

  // v1.2 Ticket #22 Handlers: Macro Goal, Dietary Constraints, Cooking Vessel
  function handleMacroGoalChange(nextMacro: MacroGoal) {
    setMacroGoal(nextMacro);
    setCustomAiDishes(null);
    persistProfileToLocalStorage(nextMacro, dietaryConstraints, applianceFilter);
    userSync.pushCloudSync({
      preferences: {
        macroGoal: nextMacro,
        dietaryConstraints,
        vesselArchetype: applianceFilter,
      },
    });
    syncDashboard(
      storeFilter,
      pinnedIds,
      effectiveOnHandIds,
      targetServings,
      currentZip,
      activeStores,
      nextMacro,
      dietaryConstraints,
      applianceFilter
    );
  }

  function handleToggleDietaryConstraint(constraint: DietaryConstraint) {
    const exists = dietaryConstraints.includes(constraint);
    const nextDietary = exists
      ? dietaryConstraints.filter((c) => c !== constraint)
      : [...dietaryConstraints, constraint];
    setDietaryConstraints(nextDietary);
    setCustomAiDishes(null);
    persistProfileToLocalStorage(macroGoal, nextDietary, applianceFilter);
    userSync.pushCloudSync({
      preferences: {
        macroGoal,
        dietaryConstraints: nextDietary,
        vesselArchetype: applianceFilter,
      },
    });
    syncDashboard(
      storeFilter,
      pinnedIds,
      effectiveOnHandIds,
      targetServings,
      currentZip,
      activeStores,
      macroGoal,
      nextDietary,
      applianceFilter
    );
  }

  function handleVesselChange(nextVessel: CookingVesselArchetype) {
    setApplianceFilter(nextVessel);
    setCustomAiDishes(null);
    persistProfileToLocalStorage(macroGoal, dietaryConstraints, nextVessel);
    userSync.pushCloudSync({
      preferences: {
        macroGoal,
        dietaryConstraints,
        vesselArchetype: nextVessel,
      },
    });
    syncDashboard(
      storeFilter,
      pinnedIds,
      effectiveOnHandIds,
      targetServings,
      currentZip,
      activeStores,
      macroGoal,
      dietaryConstraints,
      nextVessel
    );
  }

  // The next store list is computed from the current render's list and the side effects run once, outside the state
  // updater: React may call an updater twice (StrictMode), which used to repeat the storage write, the cloud push
  // and the refetch (#808). Discrete clicks re-render between events, so `activeStores` is current at each click.
  function handleToggleActiveStore(store: StoreChain) {
    let next: StoreChain[];
    if (activeStores.includes(store)) {
      if (activeStores.length <= 1) return;
      next = activeStores.filter((s) => s !== store);
    } else {
      next = [...activeStores, store];
    }
    setActiveStores(next);
    try {
      localStorage.setItem('pantrybot_active_stores', JSON.stringify(next));
    } catch {
      // Ignore
    }
    userSync.pushCloudSync({
      preferences: {
        favoriteStoreIds: next,
      },
    });
    syncDashboard(
      storeFilter,
      pinnedIds,
      effectiveOnHandIds,
      targetServings,
      currentZip,
      next
    );
  }

  function handleTogglePin(ingredientId: string) {
    const exists = pinnedIds.includes(ingredientId);
    const nextPinned = exists
      ? pinnedIds.filter((id) => id !== ingredientId)
      : [...pinnedIds, ingredientId];
    setPinnedIds(nextPinned);
    setCustomAiDishes(null);
    syncDashboard(storeFilter, nextPinned, effectiveOnHandIds, targetServings);
  }

  function handleServingsChange(nextServings: 4 | 6 | 8) {
    setTargetServings(nextServings);
    setCustomAiDishes(null);
    syncDashboard(storeFilter, pinnedIds, effectiveOnHandIds, nextServings);
  }

  function handleStoreChange(nextStore: 'ALL' | StoreChain) {
    setStoreFilter(nextStore);
    if (nextStore === 'ALL') {
      setTripMode('SPLIT');
    } else {
      setTripMode(nextStore);
    }
    setCustomAiDishes(null);
    syncDashboard(
      nextStore,
      pinnedIds,
      effectiveOnHandIds,
      targetServings,
      currentZip,
      activeStores
    );
  }

  // Clear the profile filters (moved from the Meal Plan header's inline click handler; the cloud push was added for #807).
  function handleClearProfileFilters() {
    setMacroGoal('ANY');
    setDietaryConstraints([]);
    setApplianceFilter('ANY');
    setCustomAiDishes(null);
    persistProfileToLocalStorage('ANY', [], 'ANY');
    // Like the other profile handlers, save the cleared profile to the cloud so it is not restored on the next load (#807).
    userSync.pushCloudSync({
      preferences: {
        macroGoal: 'ANY',
        dietaryConstraints: [],
        vesselArchetype: 'ANY',
      },
    });
    syncDashboard(
      storeFilter,
      pinnedIds,
      effectiveOnHandIds,
      targetServings,
      currentZip,
      activeStores,
      'ANY',
      [],
      'ANY'
    );
  }

  async function handleZipSubmit(e?: React.FormEvent, overrideZip?: string) {
    if (e) e.preventDefault();
    const cleanZip = (overrideZip || zipInput).trim();
    if (!/^\d{5}$/.test(cleanZip)) {
      setZipError('Please enter a valid 5-digit US ZIP code.');
      return;
    }
    setZipError(null);
    setZipLoading(true);
    try {
      localStorage.setItem('pantrybot_user_zip', cleanZip);
      setCurrentZip(cleanZip);
      setZipInput(cleanZip);
      userSync.pushCloudSync({
        preferences: {
          defaultZip: cleanZip,
        },
      });
      await syncDashboard(
        storeFilter,
        pinnedIds,
        effectiveOnHandIds,
        targetServings,
        cleanZip
      );
      setShowZipModal(false);
    } catch {
      setZipError('Failed to load deals for this zip code.');
    } finally {
      setZipLoading(false);
    }
  }

  return {
    handleMacroGoalChange, handleToggleDietaryConstraint, handleVesselChange, handleToggleActiveStore, handleTogglePin,
    handleServingsChange, handleStoreChange, handleClearProfileFilters, handleZipSubmit,
  };
}
