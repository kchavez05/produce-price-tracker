import { useState } from 'react';
import { pantryCatalog } from '@/lib/pantry/model';
import { recipePantryIngredientId } from '@/lib/pantry/recipe-identity';
import { ALL_STORE_CHAINS } from '@/data/store-registry';
import { dealIdOfPath, dishIdOfPath, itemIdOfPath, pathOf, type AppModule, type Destination, type ShopView, type TabModule } from '@/modules/shell/navigation';
import type { useAccountAndPantry } from '@/modules/shell/hooks/useAccountAndPantry';
import type { useDashboardPayload } from '@/modules/shell/hooks/useDashboardPayload';
import type { useUserSync } from '@/hooks/useUserSync';
import type {
  CookingVesselArchetype, DietaryConstraint, MacroGoal, StoreChain, WeeklySyncCronResult,
} from '@/types/domain';

// Moved verbatim from MealPrepDashboard (v2.0 M3 Phase B.1d; the Pantry became a module in B.3b): the Shell view state (module, modals, the toast, the
// alerts and cron state) and the handlers that touch it. All of it survives navigation (owner decision 1), so the
// provider keeps it, not the Shell components. Keep these when editing:
//  1. The handlers are plain functions recreated every render (not memoized), like the closures they were.
//  2. useShellUi takes no inputs and comes first: showAiSignIn is passed to usePlanActions. useShellActions needs the
//     account, pantry and payload hooks, so it comes after them.
export function useShellUi() {
  // The tab the user was last on, so Settings (which is not a tab) can offer Back. Set by the shell on every tab change.
  const [lastTab, setLastTab] = useState<TabModule>('shop');
  const [arbitrageToast, setArbitrageToast] = useState<string | null>(null);
  const [showStoresModal, setShowStoresModal] = useState(false);
  // v1.0: Weekly Circular Cron & Smart Push Notifications Preview (Ticket #12)
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [cronSyncResult, setCronSyncResult] = useState<WeeklySyncCronResult | null>(null);
  const [cronSyncLoading, setCronSyncLoading] = useState(false);
  const [cronSyncError, setCronSyncError] = useState<string | null>(null);
  const [copiedDigest, setCopiedDigest] = useState(false);
  // v1.3 Tickets #26 - #30: User Account, Cloud Sync & Privacy Controls state
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountIntent, setAccountIntent] = useState<'account' | 'ai'>('account');

  function showAiSignIn() {
    setAccountIntent('ai');
    setShowAccountModal(true);
  }

  return {
    lastTab, setLastTab, arbitrageToast, setArbitrageToast,
    showStoresModal, setShowStoresModal, showAlertsModal, setShowAlertsModal, cronSyncResult, setCronSyncResult,
    cronSyncLoading, setCronSyncLoading, cronSyncError, setCronSyncError, copiedDigest, setCopiedDigest,
    showAccountModal, setShowAccountModal, accountIntent, setAccountIntent, showAiSignIn,
  };
}

type Account = ReturnType<typeof useAccountAndPantry>;
interface ShellActionsArgs {
  pantry: Account['pantry'];
  userSync: Pick<ReturnType<typeof useUserSync>, 'pushCloudSync'>;
  syncDashboard: ReturnType<typeof useDashboardPayload>['syncDashboard'];
  storeFilter: 'ALL' | StoreChain;
  pinnedIds: string[];
  effectiveOnHandIds: string[];
  targetServings: 4 | 6 | 8;
  currentZip: string;
  activeStores: StoreChain[];
  macroGoal: MacroGoal;
  dietaryConstraints: DietaryConstraint[];
  applianceFilter: CookingVesselArchetype;
  showAlertsModal: boolean;
  cronSyncResult: WeeklySyncCronResult | null;
  module: AppModule;
  pathname: string;
  navigate: (path: string) => void;
  setShopView: (view: ShopView) => void;
  setArbitrageToast: (message: string | null) => void;
  setActiveStores: (stores: StoreChain[]) => void;
  setShowAlertsModal: (show: boolean) => void;
  setCronSyncResult: (result: WeeklySyncCronResult | null) => void;
  setCronSyncLoading: (loading: boolean) => void;
  setCronSyncError: (message: string | null) => void;
  setCopiedDigest: (copied: boolean) => void;
}

export function useShellActions({
  pantry, userSync, syncDashboard, storeFilter, pinnedIds, effectiveOnHandIds, targetServings, currentZip, activeStores,
  macroGoal, dietaryConstraints, applianceFilter, showAlertsModal, cronSyncResult, module, pathname, navigate, setShopView,
  setArbitrageToast, setActiveStores, setShowAlertsModal, setCronSyncResult, setCronSyncLoading, setCronSyncError, setCopiedDigest,
}: ShellActionsArgs) {
  async function handleForceCloudSync() {
    await pantry.retry();
    await userSync.pushCloudSync({ preferences: { defaultZip: currentZip, favoriteStoreIds: activeStores, macroGoal,
      dietaryConstraints, vesselArchetype: applianceFilter, targetServings, pinnedIngredientIds: pinnedIds } });
  }

  function handleToggleOnHand(ingredientId: string) {
    const pantryId = recipePantryIngredientId(ingredientId);
    const ingredient = pantryCatalog.get(pantryId);
    if (!ingredient) {
      navigateTo({ module: 'pantry' });
      setArbitrageToast('Choose the specific ingredient in Virtual Pantry. Grouped deals do not establish an exact ingredient identity.');
      return;
    }
    const existing = pantry.entries.find((entry) => entry.ingredientId === pantryId);
    void pantry.save({ ...(existing ?? { ingredientId: pantryId, displayName: ingredient.name }), available: !(existing?.available && !existing.deletedAtIso) }, existing?.id)
      .catch((error: unknown) => setArbitrageToast(error instanceof Error ? error.message : 'Could not update the pantry.'));
  }

  async function handleToggleAlertsModal() {
    const nextOpen = !showAlertsModal;
    setShowAlertsModal(nextOpen);
    if (nextOpen && !cronSyncResult) {
      setCronSyncLoading(true);
      try {
        const res = await fetch(
          `/api/cron/weekly-sync?cycle=preview_digest&zip=${encodeURIComponent(currentZip)}`
        );
        if (res.ok) {
          const payload: WeeklySyncCronResult = await res.json();
          setCronSyncResult(payload);
        }
      } catch {
        // Ignore
      } finally {
        setCronSyncLoading(false);
      }
    }
  }

  async function handleTriggerWeeklySync() {
    setCronSyncLoading(true);
    setCronSyncError(null);
    try {
      const res = await fetch('/api/cron/weekly-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cycle: 'manual_sync', zipCode: currentZip }),
      });
      const payload = await res.json();
      if (payload.fridayWeekendDigest) setCronSyncResult(payload);
      if (!res.ok) {
        setCronSyncError(payload.auditStorage === 'unavailable'
          ? 'Prices were checked, but the durable audit could not be saved. Please retry.'
          : 'Weekly refresh failed. Please retry.');
        return;
      }
      await syncDashboard(
        storeFilter, pinnedIds, effectiveOnHandIds, targetServings, currentZip
      );
    } catch {
      setCronSyncError('Weekly refresh could not connect. Please retry.');
    } finally {
      setCronSyncLoading(false);
    }
  }

  function handleCopyMarkdownDigest() {
    const text = cronSyncResult?.fridayWeekendDigest?.markdownDigest;
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedDigest(true);
    setTimeout(() => setCopiedDigest(false), 2500);
  }

  // Move to a module (and, for Shop, a view) by changing the URL. The Shop view is left alone when going to another
  // module, so coming back finds it as it was.
  function navigateTo(destination: Destination) {
    if (destination.module === 'shop') setShopView(destination.view);
    // The URL is the source of truth for the module; moving within a module (Shop to another Shop view) changes no URL.
    // Deal Detail is a path inside Shop (M4-3a), Ingredient Detail one inside Pantry (M4-4b) and Dish Detail one inside Plan (M4-5b):
    // opening one, and leaving one for any other destination in its module, do change it.
    const target = pathOf(destination);
    const leavingDetail = dealIdOfPath(pathname) !== null || itemIdOfPath(pathname) !== null || dishIdOfPath(pathname) !== null;
    const opening = (destination.module === 'shop' && Boolean(destination.deal)) || (destination.module === 'pantry' && Boolean(destination.item)) || (destination.module === 'plan' && Boolean(destination.dish));
    if ((destination.module !== module || leavingDetail || opening) && target !== pathname) navigate(target);
  }

  function handleReviewStockUp() {
    navigateTo({ module: 'pantry' });
    setArbitrageToast('Review your Pantry before stocking up. Record ingredients after purchase.');
  }

  // The stores drawer's "Select All" (moved from an inline handler in the JSX, body unchanged).
  function handleSelectAllStores() {
    setActiveStores(ALL_STORE_CHAINS);
    try {
      localStorage.setItem(
        'pantrybot_active_stores',
        JSON.stringify(ALL_STORE_CHAINS)
      );
    } catch {}
    syncDashboard(
      storeFilter,
      pinnedIds,
      effectiveOnHandIds,
      targetServings,
      currentZip,
      ALL_STORE_CHAINS
    );
  }

  return {
    handleForceCloudSync, handleToggleOnHand, handleToggleAlertsModal, handleTriggerWeeklySync, handleCopyMarkdownDigest,
    handleSelectAllStores, navigateTo, handleReviewStockUp,
  };
}
