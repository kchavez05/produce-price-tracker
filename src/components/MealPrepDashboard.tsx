'use client';


import { recipePantryIngredientId } from '@/lib/pantry/recipe-identity';


import React, { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { pantryCatalog } from '@/lib/pantry/model';
const VirtualPantry = dynamic(() => import('@/components/VirtualPantry'));
import {
  DashboardPayload,
  RecommendedDish,
  WeeklySyncCronResult,
} from '@/types/domain';
import {
  ALL_STORE_CHAINS,
} from '@/data/store-registry';
import ZipPanel from '@/modules/shell/ZipPanel';
import StoresPanel from '@/modules/shell/StoresPanel';
import AlertsPanel from '@/modules/shell/AlertsPanel';
import RadarSection from '@/modules/shop/RadarSection';
import TripSection from '@/modules/shop/TripSection';
import BoardAlerts from '@/modules/shop/BoardAlerts';
import BoardControls from '@/modules/shop/BoardControls';
import BoardLeaderboard from '@/modules/shop/BoardLeaderboard';
import { usePreferencesState } from '@/modules/shell/hooks/usePreferencesState';
import { useDashboardPayload } from '@/modules/shell/hooks/useDashboardPayload';
import { useAccountAndPantry } from '@/modules/shell/hooks/useAccountAndPantry';
import { usePlanUi, usePlanActions } from '@/modules/plan/hooks/usePlanUi';
import { useShopUi, useShopCopyAction } from '@/modules/shop/hooks/useShopUi';
import { useDerivedDashboard } from '@/modules/shell/hooks/useDerivedDashboard';
import { useStorageRestore } from '@/modules/shell/hooks/useStorageRestore';
import { usePreferenceActions } from '@/modules/shell/hooks/usePreferenceActions';
import { useLocationState } from '@/modules/shell/hooks/useLocationState';
import HeaderPrimary from '@/modules/shell/HeaderPrimary';
import StoreFilterBar from '@/modules/shell/StoreFilterBar';
import FreshnessNotice from '@/modules/shell/FreshnessNotice';
import PrimaryNav from '@/modules/shell/PrimaryNav';
import PlanDishes from '@/modules/plan/PlanDishes';
import PlanBlueprints from '@/modules/plan/PlanBlueprints';
import PlanHeader from '@/modules/plan/PlanHeader';
import AccountModal from '@/components/AccountModal';
import {
  DoorOpen,
} from 'lucide-react';

interface Props {
  initialData: DashboardPayload;
  barcodeEnabled?: boolean; speechConfigured?: boolean;
  cameraEnabled?: boolean;
  initialAccountId?: string | null;
  initialPrivateRecipes?: RecommendedDish[];
}

export default function MealPrepDashboard({ initialData, barcodeEnabled = false, speechConfigured = false, cameraEnabled = false, initialAccountId = null, initialPrivateRecipes = [] }: Props) {
  const {
    storeFilter, setStoreFilter, pinnedIds, setPinnedIds, targetServings, setTargetServings,
    macroGoal, setMacroGoal, dietaryConstraints, setDietaryConstraints, applianceFilter, setApplianceFilter,
    activeStores, setActiveStores,
  } = usePreferencesState(initialData);
  const {
    currentZip, setCurrentZip, showZipModal, setShowZipModal, zipInput, setZipInput,
    zipLoading, setZipLoading, zipError, setZipError,
  } = useLocationState(initialData);
  const [activeTab, setActiveTab] = useState<
    'BOARD' | 'MEAL_PLAN' | 'SHOPPING_LIST' | 'RADAR'
  >('BOARD');
  const {
    categoryFilter, setCategoryFilter, sortMode, setSortMode, copiedChecklist, setCopiedChecklist,
    showPrintSlipModal, setShowPrintSlipModal, tripMode, setTripMode, setCheckedItems, checkedItems,
    clippedCoupons, setClippedCoupons, toggleCheckedItem, toggleClippedCoupon, handlePrintShoppingSlip,
  } = useShopUi();
  const [showPantry, setShowPantry] = useState(false);
  const pantryTrigger = useRef<HTMLButtonElement>(null);
  const [arbitrageToast, setArbitrageToast] = useState<string | null>(null);

  // v1.2 Ticket #22: Dietary Preferences, Macro Targets & Cooking Vessel Archetypes

  const {
    expandedDishIds, setExpandedDishIds, showAllBlueprints, setShowAllBlueprints, customPrompt, setCustomPrompt,
    aiLoading, setAiLoading, aiBannerMessage, setAiBannerMessage, customAiDishes, setCustomAiDishes, customAiOwner,
    customAiContext,
  } = usePlanUi(initialData);
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

  // useUserSync is created inside useAccountAndPantry, before the payload hook its acknowledgment callback needs, so
  // it calls through this ref; the dashboard assigns it each render, right after useDashboardPayload.
  const syncAcknowledged = useRef<() => void>(() => undefined);
  const {
    userSync, pantry, pantryAccountId, pantryOwnerRef, effectiveOnHandIds, savedLibrary, setSavedLibrary, savedRecipeIds, canUseAi,
  } = useAccountAndPantry(
    initialAccountId, initialPrivateRecipes,
    { setCurrentZip, setZipInput, setActiveStores, setMacroGoal, setDietaryConstraints, setApplianceFilter, setTargetServings, setPinnedIds },
    syncAcknowledged,
  );
  const { serverData, syncDashboard } = useDashboardPayload(
    initialData, pantryOwnerRef,
    { storeFilter, pinnedIds, effectiveOnHandIds, targetServings, currentZip, activeStores, macroGoal, dietaryConstraints, applianceFilter },
    setCurrentZip,
  );
  syncAcknowledged.current = () => {
    void syncDashboard(storeFilter, pinnedIds, effectiveOnHandIds, targetServings);
  };
  const {
    data, filteredCommodities, activeTrio, trioTotals, shoppingPlan, resolvedShoppingItems, digitalCouponItems, mealContextSignature,
  } = useDerivedDashboard({
    serverData, pinnedIds, effectiveOnHandIds, targetServings, macroGoal, dietaryConstraints, applianceFilter, activeStores,
    storeFilter, currentZip, savedLibrary, pantryOwner: pantry.owner, pantryGuest: pantry.guest, customPrompt, customAiDishes,
    customAiOwner, customAiContext, categoryFilter, sortMode, tripMode,
  });
  const { handleCopyShoppingListForNotes } = useShopCopyAction({
    resolvedShoppingItems, shoppingPlan, activeTrio, currentZip, cityLabel: data.cityLabel, tripMode, checkedItems,
    setCopiedChecklist,
  });
  const {
    handleToggleSaveRecipe, useStandardSuggestions, handleGenerateAiPlan, handlePromoteDish,
  } = usePlanActions({
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

  const {
    handleMacroGoalChange, handleToggleDietaryConstraint, handleVesselChange, handleToggleActiveStore, handleTogglePin,
    handleServingsChange, handleStoreChange, handleClearProfileFilters, handleZipSubmit,
  } = usePreferenceActions({
    storeFilter, pinnedIds, effectiveOnHandIds, targetServings, currentZip, activeStores, macroGoal, dietaryConstraints,
    applianceFilter, zipInput, userSync, syncDashboard,
    setMacroGoal, setDietaryConstraints, setApplianceFilter, setActiveStores, setPinnedIds, setTargetServings,
    setStoreFilter, setCurrentZip, setZipInput, setZipError, setZipLoading, setShowZipModal, setCustomAiDishes, setTripMode,
  });

  function handleReviewStockUp() {
    setShowPantry(true);
    setArbitrageToast('Review your Pantry before stocking up. Record ingredients after purchase.');
  }

  async function handleForceCloudSync() {
    await pantry.retry();
    await userSync.pushCloudSync({ preferences: { defaultZip: currentZip, favoriteStoreIds: activeStores, macroGoal,
      dietaryConstraints, vesselArchetype: applianceFilter, targetServings, pinnedIngredientIds: pinnedIds } });
  }

  function handleToggleOnHand(ingredientId: string) {
    const pantryId = recipePantryIngredientId(ingredientId);
    const ingredient = pantryCatalog.get(pantryId);
    if (!ingredient) {
      setShowPantry(true);
      setArbitrageToast('Choose the specific ingredient in Virtual Pantry. Grouped deals do not establish an exact ingredient identity.');
      return;
    }
    const existing = pantry.entries.find((entry) => entry.ingredientId === pantryId);
    void pantry.save({ ...(existing ?? { ingredientId: pantryId, displayName: ingredient.name }), available: !(existing?.available && !existing.deletedAtIso) }, existing?.id)
      .catch((error: unknown) => setArbitrageToast(error instanceof Error ? error.message : 'Could not update the pantry.'));
  }

  function showAiSignIn() {
    setAccountIntent('ai');
    setShowAccountModal(true);
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

  return (
    <div className="min-h-screen pb-24">
      {/* Top Header — Two-Tier Navigation Architecture */}
      <header className={`${showPantry ? 'relative' : 'sticky top-0'} z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-2xs no-print`}>
        <div className="mx-auto max-w-6xl px-4 py-2.5">
          {/* Tier 1: Primary Brand & Location (Left) + Utilities & User Account (Pinned Top-Right) */}
          <HeaderPrimary
            data={data}
            currentZip={currentZip}
            showPantry={showPantry}
            showZipModal={showZipModal}
            showAccountModal={showAccountModal}
            showAlertsModal={showAlertsModal}
            userSync={userSync}
            pantryEntries={pantry.entries}
            pantryTrigger={pantryTrigger}
            setShowZipModal={setShowZipModal}
            setShowPantry={setShowPantry}
            setShowAccountModal={setShowAccountModal}
            setAccountIntent={setAccountIntent}
            handleToggleAlertsModal={handleToggleAlertsModal}
          />

          {/* Tier 2: Dedicated Supermarket Filter Bar (Left) & Weekly Ad-Cycle Pill (Right) */}
          <StoreFilterBar
            data={data}
            currentZip={currentZip}
            storeFilter={storeFilter}
            activeStores={activeStores}
            showStoresModal={showStoresModal}
            handleStoreChange={handleStoreChange}
            setShowStoresModal={setShowStoresModal}
          />

          <FreshnessNotice data={data} />

          {/* v1.3 Ticket #29: Account Management, Cloud Sync & Privacy Drawer */}
          <AccountModal
            isOpen={showAccountModal}
            intent={accountIntent}
            onClose={() => setShowAccountModal(false)}
            authenticated={userSync.authenticated}
            profile={userSync.profile}
            storageMode={userSync.storageMode}
            supabaseConfigured={userSync.supabaseConfigured}
            syncStatus={userSync.syncStatus}
            lastSyncedIso={userSync.lastSyncedIso}
            authLoading={userSync.authLoading}
            currentZip={currentZip}
            activeStores={activeStores}
            macroGoal={macroGoal}
            dietaryConstraints={dietaryConstraints}
            applianceFilter={applianceFilter}
            pantryItemCount={pantry.entries.filter((entry) => !entry.deletedAtIso).length}
            onSignIn={userSync.signInWithProvider}
            onSignOut={userSync.signOut}
            onForceSync={handleForceCloudSync}
            onExportData={userSync.exportAccountDataJson}
            onDeleteAccount={userSync.deleteAccountAndData}
          />

          {/* Arbitrage Toast Banner */}
          {arbitrageToast && (
            <div className="mt-2.5 flex items-center justify-between rounded-xl border border-sky-300 bg-sky-950 px-3.5 py-2 text-xs font-semibold text-sky-100 shadow-md">
              <div className="flex items-center gap-2">
                <DoorOpen className="h-4 w-4 text-sky-400 shrink-0" />
                <span>{arbitrageToast}</span>
              </div>
              <button
                onClick={() => setArbitrageToast(null)}
                className="ml-3 text-sky-300 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Private Virtual Pantry drawer */}
          {showPantry && <VirtualPantry speechConfigured={speechConfigured} onAiSignIn={showAiSignIn} owner={pantry.owner} barcodeEnabled={barcodeEnabled} cameraEnabled={cameraEnabled}
            key={pantry.owner ?? `loading:${pantryAccountId ?? 'guest'}`}
            entries={pantry.entries} acceptedCatalogIds={pantry.acceptedCatalogIds} status={pantry.status} error={pantry.error} guest={pantry.guest} hasLegacyEdits={pantry.hasLegacyEdits}
            importDuplicates={pantry.importDuplicates}
            guestEntries={pantry.guestEntries} conflicts={pantry.conflicts}
            onSave={pantry.save} onDelete={pantry.remove} onRetry={pantry.retry} onResolve={pantry.resolve}
            onImportGuest={pantry.importGuest} onReviewLegacy={pantry.reviewLegacy} onImportLegacy={pantry.importLegacy}
            onClose={() => { setShowPantry(false); pantryTrigger.current?.focus(); }}
          />}

          {/* Interactive Zip Code / Location Switcher Drawer */}
          {showZipModal && (
            <ZipPanel
              currentZip={currentZip}
              zipInput={zipInput}
              zipLoading={zipLoading}
              zipError={zipError}
              onZipInputChange={(value) => {
                setZipInput(value);
                setZipError(null);
              }}
              onSubmit={handleZipSubmit}
              onClose={() => setShowZipModal(false)}
            />
          )}

          {/* Interactive My Stores Preference Drawer (v1.1) */}
          {showStoresModal && (
            <StoresPanel
              activeStores={activeStores}
              cityLabel={data.cityLabel}
              currentZip={currentZip}
              onToggleStore={handleToggleActiveStore}
              onSelectAll={() => {
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
              }}
              onClose={() => setShowStoresModal(false)}
            />
          )}

          {/* v1.0 Weekly Cron & Smart Push Notifications Preview Drawer */}
          {showAlertsModal && (
            <AlertsPanel
              cronSyncResult={cronSyncResult}
              cronSyncLoading={cronSyncLoading}
              cronSyncError={cronSyncError}
              copiedDigest={copiedDigest}
              onRunSync={handleTriggerWeeklySync}
              onCopyDigest={handleCopyMarkdownDigest}
            />
          )}

          {/* Primary Navigation Tabs */}
          <PrimaryNav
            data={data}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            pinnedIds={pinnedIds}
            effectiveOnHandIds={effectiveOnHandIds}
            shoppingPlan={shoppingPlan}
            trioTotals={trioTotals}
          />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-5">
        {/* =========================================================
            TAB 1: THE WEEKEND VALUE BOARD
           ========================================================= */}
        {activeTab === 'BOARD' && (
          <div className="space-y-6">
            {/* Splurge Value Alerts Callout Strip */}
            <BoardAlerts
              data={data}
              currentZip={currentZip}
              pinnedIds={pinnedIds}
              handleTogglePin={handleTogglePin}
              handleReviewStockUp={handleReviewStockUp}
            />

            {/* Category & Sort Controls */}
            <BoardControls
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              sortMode={sortMode}
              setSortMode={setSortMode}
            />

            {/* Main Commodity Leaderboard Grid */}
            <BoardLeaderboard
              filteredCommodities={filteredCommodities}
              currentZip={currentZip}
              pinnedIds={pinnedIds}
              effectiveOnHandIds={effectiveOnHandIds}
              handleTogglePin={handleTogglePin}
              handleToggleOnHand={handleToggleOnHand}
              handleReviewStockUp={handleReviewStockUp}
            />
          </div>
        )}

        {/* =========================================================
            TAB 2: THE 3-DISH STEW & CASSEROLE MEAL PREP PLAN
           ========================================================= */}
        {activeTab === 'MEAL_PLAN' && (
          <div className="space-y-6">
            <PlanHeader
              data={data}
              trioTotals={trioTotals}
              activeTrio={activeTrio}
              targetServings={targetServings}
              handleServingsChange={handleServingsChange}
              setActiveTab={setActiveTab}
              macroGoal={macroGoal}
              dietaryConstraints={dietaryConstraints}
              applianceFilter={applianceFilter}
              handleMacroGoalChange={handleMacroGoalChange}
              handleToggleDietaryConstraint={handleToggleDietaryConstraint}
              handleVesselChange={handleVesselChange}
              onClearProfileFilters={handleClearProfileFilters}
              canUseAi={canUseAi}
              aiLoading={aiLoading}
              customPrompt={customPrompt}
              aiBannerMessage={aiBannerMessage}
              setCustomPrompt={setCustomPrompt}
              handleGenerateAiPlan={handleGenerateAiPlan}
              showAiSignIn={showAiSignIn}
              useStandardSuggestions={useStandardSuggestions}
            />

            {/* The 3 Recommended Batch Dishes */}
            <PlanDishes
              activeTrio={activeTrio}
              currentZip={currentZip}
              expandedDishIds={expandedDishIds}
              setExpandedDishIds={setExpandedDishIds}
              savedRecipeIds={savedRecipeIds}
              handleToggleSaveRecipe={handleToggleSaveRecipe}
            />

            {/* Option to Browse All Evaluated Stew/Casserole Blueprints */}
            <PlanBlueprints
              data={data}
              targetServings={targetServings}
              showAllBlueprints={showAllBlueprints}
              setShowAllBlueprints={setShowAllBlueprints}
              onPromoteDish={handlePromoteDish}
            />
          </div>
        )}

        {/* =========================================================
            TAB 3: SHOPPING LIST, 1-TAP CURBSIDE CART BRIDGE & EXPORT
           ========================================================= */}
        {activeTab === 'SHOPPING_LIST' && (
          <TripSection
            data={data}
            currentZip={currentZip}
            shoppingPlan={shoppingPlan}
            tripMode={tripMode}
            setTripMode={setTripMode}
            resolvedShoppingItems={resolvedShoppingItems}
            digitalCouponItems={digitalCouponItems}
            activeTrio={activeTrio}
            trioTotals={trioTotals}
            checkedItems={checkedItems}
            clippedCoupons={clippedCoupons}
            copiedChecklist={copiedChecklist}
            showPrintSlipModal={showPrintSlipModal}
            setShowPrintSlipModal={setShowPrintSlipModal}
            toggleCheckedItem={toggleCheckedItem}
            toggleClippedCoupon={toggleClippedCoupon}
            handleToggleOnHand={handleToggleOnHand}
            handleCopyShoppingListForNotes={handleCopyShoppingListForNotes}
            handlePrintShoppingSlip={handlePrintShoppingSlip}
          />
        )}

        {/* =========================================================
            TAB 4: USDA, 6-WEEK CYCLE SIGNALS & WHOLESALE CLUB RADAR
           ========================================================= */}
        {activeTab === 'RADAR' && (
          <RadarSection
            data={data}
            currentZip={currentZip}
            onTogglePin={handleTogglePin}
            onReviewStockUp={handleReviewStockUp}
          />
        )}
      </main>
    </div>
  );
}
