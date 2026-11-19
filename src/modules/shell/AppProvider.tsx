'use client';

import React, { useRef } from 'react';
import type { ReactNode } from 'react';
import { usePreferencesState } from '@/modules/shell/hooks/usePreferencesState';
import { useDashboardPayload } from '@/modules/shell/hooks/useDashboardPayload';
import { useAccountAndPantry } from '@/modules/shell/hooks/useAccountAndPantry';
import { useShellUi, useShellActions } from '@/modules/shell/hooks/useShellUi';
import { usePlanUi, usePlanActions } from '@/modules/plan/hooks/usePlanUi';
import { useShopUi, useShopCopyAction } from '@/modules/shop/hooks/useShopUi';
import { useDerivedDashboard } from '@/modules/shell/hooks/useDerivedDashboard';
import { useStorageRestore } from '@/modules/shell/hooks/useStorageRestore';
import { usePreferenceActions } from '@/modules/shell/hooks/usePreferenceActions';
import { useLocationState } from '@/modules/shell/hooks/useLocationState';
import { useAppRouter } from '@/modules/shell/app-router';
import { moduleOfPath } from '@/modules/shell/navigation';
import {
  AccountContext, DashboardContext, LocationContext, PlanContext, PreferencesContext, ShellContext, ShopContext,
} from '@/modules/shell/app-context';
import type { DashboardPayload, RecommendedDish } from '@/types/domain';

// v2.0 M3 Phase B.1e: the one place the app's hooks are composed, moved verbatim from MealPrepDashboard (the only edits
// keep each hook's whole result so it can be exposed through its context). It renders no markup of its own. In Phase B.3
// it moves into the route group's layout, so everything below survives navigation between modules. Keep these when
// editing:
//  1. The hook order is unchanged from the dashboard (effects run in the same order: price clock, then the AI fence,
//     then the mount restore), and the first render is the server render (the restore is still an effect).
//  2. The ownership refs, the AI request fence and syncDashboard stay here, never in a module or route component.
interface AppProviderProps {
  initialData: DashboardPayload;
  initialAccountId?: string | null;
  initialPrivateRecipes?: RecommendedDish[];
  children?: ReactNode;
}

export default function AppProvider({ initialData, initialAccountId = null, initialPrivateRecipes = [], children }: AppProviderProps) {
  // The URL is the source of truth for the module (B.3c); the router seam keeps these hooks testable without Next.js.
  const router = useAppRouter();
  const currentModule = moduleOfPath(router.pathname);
  const preferences = usePreferencesState(initialData);
  const {
    storeFilter, setStoreFilter, pinnedIds, setPinnedIds, targetServings, setTargetServings,
    macroGoal, setMacroGoal, dietaryConstraints, setDietaryConstraints, applianceFilter, setApplianceFilter,
    activeStores, setActiveStores,
  } = preferences;

  const location = useLocationState(initialData);
  const { currentZip, setCurrentZip, setShowZipModal, zipInput, setZipInput, setZipLoading, setZipError } = location;
  const shellUi = useShellUi();
  const {
    setArbitrageToast, showAlertsModal, setShowAlertsModal, cronSyncResult, setCronSyncResult,
    setCronSyncLoading, setCronSyncError, setCopiedDigest, showAiSignIn
  } = shellUi;
  const shopUi = useShopUi();
  const {
    setShopView, categoryFilter, sortMode, setCopiedChecklist, tripMode, setTripMode, setCheckedItems, checkedItems,
    setClippedCoupons
  } = shopUi;
  // v1.2 Ticket #22: Dietary Preferences, Macro Targets & Cooking Vessel Archetypes

  const planUi = usePlanUi(initialData);
  const {
    setExpandedDishIds, customPrompt, setAiLoading, setAiBannerMessage, customAiDishes, setCustomAiDishes,
    customAiOwner, customAiContext
  } = planUi;
  // useUserSync is created inside useAccountAndPantry, before the payload hook its acknowledgment callback needs, so
  // it calls through this ref; the dashboard assigns it each render, right after useDashboardPayload.
  const syncAcknowledged = useRef<() => void>(() => undefined);
  const account = useAccountAndPantry(
    initialAccountId, initialPrivateRecipes,
    { setCurrentZip, setZipInput, setActiveStores, setMacroGoal, setDietaryConstraints, setApplianceFilter, setTargetServings, setPinnedIds },
    syncAcknowledged,
  );
  const {
    userSync, pantry, pantryOwnerRef, effectiveOnHandIds, savedLibrary, setSavedLibrary, savedRecipeIds,
    canUseAi
  } = account;
  const { serverData, syncDashboard } = useDashboardPayload(
    initialData, pantryOwnerRef,
    { storeFilter, pinnedIds, effectiveOnHandIds, targetServings, currentZip, activeStores, macroGoal, dietaryConstraints, applianceFilter },
    setCurrentZip,
  );
  syncAcknowledged.current = () => {
    void syncDashboard(storeFilter, pinnedIds, effectiveOnHandIds, targetServings);
  };
  const derived = useDerivedDashboard({
    serverData, pinnedIds, effectiveOnHandIds, targetServings, macroGoal, dietaryConstraints, applianceFilter, activeStores,
    storeFilter, currentZip, savedLibrary, pantryOwner: pantry.owner, pantryGuest: pantry.guest, customPrompt, customAiDishes,
    customAiOwner, customAiContext, categoryFilter, sortMode, tripMode,
  });
  const { data, activeTrio, shoppingPlan, resolvedShoppingItems, mealContextSignature } = derived;
  const shopCopy = useShopCopyAction({
    resolvedShoppingItems, shoppingPlan, activeTrio, currentZip, cityLabel: data.cityLabel, tripMode, checkedItems,
    setCopiedChecklist,
  });
  const planActions = usePlanActions({
    pantryOwner: pantry.owner, pantryOwnerRef, canUseAi, savedRecipeIds, setSavedLibrary, syncDashboard, showAiSignIn,
    mealContextSignature, activeTrio, pinnedIds, effectiveOnHandIds, targetServings, customPrompt, storeFilter, currentZip,
    cityLabel: data.cityLabel, macroGoal, dietaryConstraints, applianceFilter, customAiOwner, customAiContext, setAiLoading,
    setAiBannerMessage, setCustomAiDishes, setExpandedDishIds,
  });

  useStorageRestore({
    data, storeFilter, pinnedIds, effectiveOnHandIds, targetServings, activeStores, macroGoal, dietaryConstraints, applianceFilter,
    setCheckedItems, setClippedCoupons, setMacroGoal, setDietaryConstraints, setApplianceFilter, setActiveStores,
    setCurrentZip, setZipInput, syncDashboard,
  });

  const preferenceActions = usePreferenceActions({
    storeFilter, pinnedIds, effectiveOnHandIds, targetServings, currentZip, activeStores, macroGoal, dietaryConstraints,
    applianceFilter, zipInput, userSync, syncDashboard,
    setMacroGoal, setDietaryConstraints, setApplianceFilter, setActiveStores, setPinnedIds, setTargetServings,
    setStoreFilter, setCurrentZip, setZipInput, setZipError, setZipLoading, setShowZipModal, setCustomAiDishes, setTripMode,
  });
  const {
    handleMacroGoalChange, handleToggleDietaryConstraint, handleVesselChange, handleToggleActiveStore, handleTogglePin,
    handleServingsChange, handleStoreChange, handleClearProfileFilters, handleZipSubmit,
  } = preferenceActions;

  const shellActions = useShellActions({
    pantry, userSync, syncDashboard, storeFilter, pinnedIds, effectiveOnHandIds, targetServings, currentZip, activeStores,
    macroGoal, dietaryConstraints, applianceFilter, showAlertsModal, cronSyncResult, module: currentModule,
    navigate: router.push, setShopView, setArbitrageToast, setActiveStores, setShowAlertsModal, setCronSyncResult,
    setCronSyncLoading, setCronSyncError, setCopiedDigest,
  });

  return (
    <PreferencesContext.Provider value={{ ...preferences, handleMacroGoalChange, handleToggleDietaryConstraint, handleVesselChange,
      handleToggleActiveStore, handleTogglePin, handleServingsChange, handleStoreChange, handleClearProfileFilters }}>
      <LocationContext.Provider value={{ ...location, handleZipSubmit }}>
        <AccountContext.Provider value={account}>
          <DashboardContext.Provider value={{ ...derived, serverData, syncDashboard }}>
            <PlanContext.Provider value={{ ...planUi, ...planActions }}>
              <ShopContext.Provider value={{ ...shopUi, ...shopCopy }}>
                <ShellContext.Provider value={{ ...shellUi, ...shellActions, module: currentModule }}>
                  {children}
                </ShellContext.Provider>
              </ShopContext.Provider>
            </PlanContext.Provider>
          </DashboardContext.Provider>
        </AccountContext.Provider>
      </LocationContext.Provider>
    </PreferencesContext.Provider>
  );
}
