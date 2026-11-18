import { useState, type RefObject } from 'react';
import type { usePantry } from '@/hooks/usePantry';
import type {
  CookingVesselArchetype, DashboardPayload, DietaryConstraint, MacroGoal, StoreChain,
} from '@/types/domain';

// Moved verbatim from MealPrepDashboard (v2.0 M3 Phase A.5b). The dashboard payload state and syncDashboard.
// Two things must not change when editing this file:
//  1. syncDashboard is recreated on every render (not memoized) and its nine arguments default to the values of
//     `current`, which the dashboard rebuilds each render, so a call reads the same values as before the move.
//  2. The ownership guard: discard a response only when a known pantry owner changed while the request was in
//     flight (#780); a request that started with no owner carried no pantry data and is applied.
export interface DashboardPayloadCurrent {
  storeFilter: 'ALL' | StoreChain;
  pinnedIds: string[];
  effectiveOnHandIds: string[];
  targetServings: 4 | 6 | 8;
  currentZip: string;
  activeStores: StoreChain[];
  macroGoal: MacroGoal;
  dietaryConstraints: DietaryConstraint[];
  applianceFilter: CookingVesselArchetype;
}

export function useDashboardPayload(
  initialData: DashboardPayload,
  pantryOwnerRef: RefObject<ReturnType<typeof usePantry>['owner']>,
  current: DashboardPayloadCurrent,
  setCurrentZip: (zip: string) => void,
) {
  const [serverData, setData] = useState<DashboardPayload>(initialData);

  async function syncDashboard(
    nextStore: 'ALL' | StoreChain = current.storeFilter,
    nextPinned: string[] = current.pinnedIds,
    nextOnHand: string[] = current.effectiveOnHandIds,
    nextServings: 4 | 6 | 8 = current.targetServings,
    nextZip: string = current.currentZip,
    nextActiveStores: StoreChain[] = current.activeStores,
    nextMacroGoal: MacroGoal = current.macroGoal,
    nextDietary: DietaryConstraint[] = current.dietaryConstraints,
    nextVessel: CookingVesselArchetype = current.applianceFilter
  ) {
    const requestOwner = pantryOwnerRef.current;
    try {
      const params = new URLSearchParams({
        zip: nextZip,
        store: nextStore,
        stores: nextActiveStores.join(','),
        pinned: nextPinned.join(','),
        onHand: nextOnHand.join(','),
        servings: String(nextServings),
        macroGoal: nextMacroGoal,
        dietary: nextDietary.join(','),
        vessel: nextVessel,
      });
      const res = await fetch(`/api/dashboard?${params.toString()}`);
      if (res.ok) {
        const updated: DashboardPayload = await res.json();
        // A request started before the pantry loaded has no owner (null) and carried no pantry data, so the owner
        // becoming known is not an identity change. Only discard when a known owner changed in flight (#780).
        if (requestOwner !== null && pantryOwnerRef.current !== requestOwner) return;
        setData(updated);
        setCurrentZip(updated.zipCode);
      }
    } catch {
      // Ignore network hiccup
    }
  }

  return { serverData, syncDashboard };
}
