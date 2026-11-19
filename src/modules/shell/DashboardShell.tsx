'use client';

import React from 'react';
import dynamic from 'next/dynamic';
const VirtualPantry = dynamic(() => import('@/components/VirtualPantry'));
import ZipPanel from '@/modules/shell/ZipPanel';
import StoresPanel from '@/modules/shell/StoresPanel';
import AlertsPanel from '@/modules/shell/AlertsPanel';
import RadarSection from '@/modules/shop/RadarSection';
import TripSection from '@/modules/shop/TripSection';
import BoardAlerts from '@/modules/shop/BoardAlerts';
import BoardControls from '@/modules/shop/BoardControls';
import BoardLeaderboard from '@/modules/shop/BoardLeaderboard';
import HeaderPrimary from '@/modules/shell/HeaderPrimary';
import StoreFilterBar from '@/modules/shell/StoreFilterBar';
import FreshnessNotice from '@/modules/shell/FreshnessNotice';
import PrimaryNav from '@/modules/shell/PrimaryNav';
import PlanDishes from '@/modules/plan/PlanDishes';
import PlanBlueprints from '@/modules/plan/PlanBlueprints';
import PlanHeader from '@/modules/plan/PlanHeader';
import AccountModal from '@/components/AccountModal';
import {
  useAccountContext, useDashboardContext, useLocationContext, usePlanContext, usePreferencesContext, useShellContext,
  useShopContext,
} from '@/modules/shell/app-context';
import {
  DoorOpen,
} from 'lucide-react';

// v2.0 M3 Phase B.1e: the dashboard's markup, moved verbatim from MealPrepDashboard. It reads the app's state through
// the seven context hooks instead of owning it, and still passes props to the module components (B.2 moves each module
// onto the contexts, one PR at a time). The three config flags are page-level, not state, so they stay props.
interface DashboardShellProps {
  barcodeEnabled?: boolean;
  speechConfigured?: boolean;
  cameraEnabled?: boolean;
}

export default function DashboardShell({ barcodeEnabled = false, speechConfigured = false, cameraEnabled = false }: DashboardShellProps) {
  const {
    storeFilter, pinnedIds, targetServings, macroGoal, dietaryConstraints, applianceFilter, activeStores,
    handleMacroGoalChange, handleToggleDietaryConstraint, handleVesselChange, handleToggleActiveStore,
    handleTogglePin, handleServingsChange, handleStoreChange, handleClearProfileFilters,
  } = usePreferencesContext();
  const {
    currentZip, showZipModal, setShowZipModal, zipInput, setZipInput, zipLoading, zipError, setZipError,
    handleZipSubmit,
  } = useLocationContext();
  const {
    data, filteredCommodities, activeTrio, trioTotals, shoppingPlan, resolvedShoppingItems, digitalCouponItems,
  } = useDashboardContext();
  const {
    userSync, pantry, pantryAccountId, effectiveOnHandIds, savedRecipeIds, canUseAi,
  } = useAccountContext();
  const {
    expandedDishIds, setExpandedDishIds, showAllBlueprints, setShowAllBlueprints, customPrompt, setCustomPrompt,
    aiLoading, aiBannerMessage, handleToggleSaveRecipe, useStandardSuggestions, handleGenerateAiPlan,
    handlePromoteDish,
  } = usePlanContext();
  const {
    categoryFilter, setCategoryFilter, sortMode, setSortMode, copiedChecklist, showPrintSlipModal,
    setShowPrintSlipModal, tripMode, setTripMode, checkedItems, clippedCoupons, toggleCheckedItem,
    toggleClippedCoupon, handlePrintShoppingSlip, handleCopyShoppingListForNotes,
  } = useShopContext();
  const {
    activeTab, setActiveTab, showPantry, setShowPantry, pantryTrigger, arbitrageToast, setArbitrageToast,
    showStoresModal, setShowStoresModal, showAlertsModal, cronSyncResult, cronSyncLoading, cronSyncError,
    copiedDigest, showAccountModal, setShowAccountModal, accountIntent, setAccountIntent, handleReviewStockUp,
    showAiSignIn, handleForceCloudSync, handleToggleOnHand, handleToggleAlertsModal, handleTriggerWeeklySync,
    handleCopyMarkdownDigest, handleSelectAllStores,
  } = useShellContext();

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
              onSelectAll={handleSelectAllStores}
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
