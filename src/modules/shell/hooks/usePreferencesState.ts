import { useState } from 'react';
import { ALL_STORE_CHAINS } from '@/data/store-registry';
import type {
  CookingVesselArchetype, DashboardPayload, DietaryConstraint, MacroGoal, StoreChain,
} from '@/types/domain';

// Moved verbatim from MealPrepDashboard (v2.0 M3 Phase A.5a): plain state only. Handlers, persistence and sync
// stay in the dashboard, so no closure, ordering or effect changes here.
export function usePreferencesState(initialData: Pick<DashboardPayload, 'activeStores'>) {
  const [storeFilter, setStoreFilter] = useState<'ALL' | StoreChain>('ALL');
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [targetServings, setTargetServings] = useState<4 | 6 | 8>(6);
  const [macroGoal, setMacroGoal] = useState<MacroGoal>('ANY');
  const [dietaryConstraints, setDietaryConstraints] = useState<DietaryConstraint[]>([]);
  const [applianceFilter, setApplianceFilter] = useState<CookingVesselArchetype>('ANY');
  const [activeStores, setActiveStores] = useState<StoreChain[]>(() => {
    return initialData.activeStores || ALL_STORE_CHAINS;
  });
  return {
    storeFilter, setStoreFilter, pinnedIds, setPinnedIds, targetServings, setTargetServings,
    macroGoal, setMacroGoal, dietaryConstraints, setDietaryConstraints, applianceFilter, setApplianceFilter,
    activeStores, setActiveStores,
  };
}
