import { useEffect, type Dispatch, type SetStateAction } from 'react';
import type {
  CookingVesselArchetype, DashboardPayload, DietaryConstraint, MacroGoal, StoreChain,
} from '@/types/domain';
import type { useDashboardPayload } from '@/modules/shell/hooks/useDashboardPayload';

// Moved verbatim from MealPrepDashboard (v2.0 M3 Phase A.6a): the mount effect that restores the five localStorage
// keys (checklist, clipped coupons, nutrition profile, active stores, ZIP) and refetches the dashboard for a saved
// ZIP. It runs once, on the first render's values, as an effect (not an initializer) so the first render stays
// hydration-safe. Its eslint-disable moves with it unchanged; resolving it is A.6b (spec decision 3).
interface StorageRestoreArgs {
  data: Pick<DashboardPayload, 'zipCode'>;
  storeFilter: 'ALL' | StoreChain;
  pinnedIds: string[];
  effectiveOnHandIds: string[];
  targetServings: 4 | 6 | 8;
  activeStores: StoreChain[];
  macroGoal: MacroGoal;
  dietaryConstraints: DietaryConstraint[];
  applianceFilter: CookingVesselArchetype;
  setCheckedItems: Dispatch<SetStateAction<Record<string, boolean>>>;
  setClippedCoupons: Dispatch<SetStateAction<Record<string, boolean>>>;
  setMacroGoal: (goal: MacroGoal) => void;
  setDietaryConstraints: (constraints: DietaryConstraint[]) => void;
  setApplianceFilter: (vessel: CookingVesselArchetype) => void;
  setActiveStores: (stores: StoreChain[]) => void;
  setCurrentZip: (zip: string) => void;
  setZipInput: (zip: string) => void;
  syncDashboard: ReturnType<typeof useDashboardPayload>['syncDashboard'];
}

export function useStorageRestore({
  data, storeFilter, pinnedIds, effectiveOnHandIds, targetServings, activeStores, macroGoal, dietaryConstraints,
  applianceFilter, setCheckedItems, setClippedCoupons, setMacroGoal, setDietaryConstraints, setApplianceFilter,
  setActiveStores, setCurrentZip, setZipInput, syncDashboard,
}: StorageRestoreArgs) {
  useEffect(() => {
    try {
      const savedChecked = localStorage.getItem('mead_checked_items_v03');
      if (savedChecked) setCheckedItems(JSON.parse(savedChecked));
      const savedClipped = localStorage.getItem('mead_clipped_coupons_v03');
      if (savedClipped) setClippedCoupons(JSON.parse(savedClipped));

      let loadedMacroGoal = macroGoal;
      let loadedDietaryConstraints = dietaryConstraints;
      let loadedApplianceFilter = applianceFilter;
      const savedProfile = localStorage.getItem('pantrybot_nutrition_profile_v12');
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        if (parsed.macroGoal) {
          setMacroGoal(parsed.macroGoal);
          loadedMacroGoal = parsed.macroGoal;
        }
        if (Array.isArray(parsed.dietaryConstraints)) {
          setDietaryConstraints(parsed.dietaryConstraints);
          loadedDietaryConstraints = parsed.dietaryConstraints;
        }
        if (parsed.applianceFilter) {
          setApplianceFilter(parsed.applianceFilter);
          loadedApplianceFilter = parsed.applianceFilter;
        }
      }

      let loadedActiveStores = activeStores;
      const savedActiveStores = localStorage.getItem('pantrybot_active_stores');
      if (savedActiveStores) {
        try {
          const parsed = JSON.parse(savedActiveStores);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setActiveStores(parsed);
            loadedActiveStores = parsed;
          }
        } catch {
          // Ignore
        }
      }

      const savedZip = localStorage.getItem('pantrybot_user_zip');
      if (savedZip && /^\d{5}$/.test(savedZip) && savedZip !== data.zipCode) {
        setCurrentZip(savedZip);
        setZipInput(savedZip);
        syncDashboard(
          storeFilter,
          pinnedIds,
          effectiveOnHandIds,
          targetServings,
          savedZip,
          loadedActiveStores,
          loadedMacroGoal,
          loadedDietaryConstraints,
          loadedApplianceFilter
        );
      }
    } catch {
      // Ignore storage errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

}
