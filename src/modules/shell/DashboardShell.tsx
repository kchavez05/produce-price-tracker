'use client';

import React from 'react';
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
import AccountDialog from '@/modules/shell/AccountDialog';
import PantryDrawer from '@/modules/pantry/PantryDrawer';
import {
  useLocationContext, useShellContext, useShopContext,
} from '@/modules/shell/app-context';
import { legacyTab } from '@/modules/shell/navigation';
import {
  DoorOpen,
} from 'lucide-react';

// v2.0 M3 Phase B.1e: the dashboard's markup, moved verbatim from MealPrepDashboard. It reads the app's state through
// the seven context hooks instead of owning it. Every module component (Shop, Plan, Shell, the Pantry drawer and the
// account dialog, B.2a to B.2d) reads the contexts itself; what is left here is layout, the toast and which panels show,
// until the routes (B.3). The three config flags are page-level, not state, so they stay props.
interface DashboardShellProps {
  barcodeEnabled?: boolean;
  speechConfigured?: boolean;
  cameraEnabled?: boolean;
}

export default function DashboardShell({ barcodeEnabled = false, speechConfigured = false, cameraEnabled = false }: DashboardShellProps) {
  const {
    showZipModal,
  } = useLocationContext();
  const {
    arbitrageToast, setArbitrageToast, showStoresModal, showAlertsModal,
  } = useShellContext();

  const { module } = useShellContext();
  const { shopView } = useShopContext();
  const activeTab = legacyTab(module, shopView);

  return (
    <div className="min-h-screen pb-24">
      {/* Top Header — Two-Tier Navigation Architecture */}
      <header className={`sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-2xs no-print`}>
        <div className="mx-auto max-w-6xl px-4 py-2.5">
          {/* Tier 1: Primary Brand & Location (Left) + Utilities & User Account (Pinned Top-Right) */}
          <HeaderPrimary />

          {/* Tier 2: Dedicated Supermarket Filter Bar (Left) & Weekly Ad-Cycle Pill (Right) */}
          <StoreFilterBar />

          <FreshnessNotice />

          {/* v1.3 Ticket #29: Account Management, Cloud Sync & Privacy Drawer */}
          <AccountDialog />

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

          {/* Interactive Zip Code / Location Switcher Drawer */}
          {showZipModal && (
            <ZipPanel />
          )}

          {/* Interactive My Stores Preference Drawer (v1.1) */}
          {showStoresModal && (
            <StoresPanel />
          )}

          {/* v1.0 Weekly Cron & Smart Push Notifications Preview Drawer */}
          {showAlertsModal && (
            <AlertsPanel />
          )}

          {/* Primary Navigation Tabs */}
          <PrimaryNav />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-5">
        {/* =========================================================
            TAB 1: THE WEEKEND VALUE BOARD
           ========================================================= */}
        {activeTab === 'BOARD' && (
          <div className="space-y-6">
            {/* Splurge Value Alerts Callout Strip */}
            <BoardAlerts />

            {/* Category & Sort Controls */}
            <BoardControls />

            {/* Main Commodity Leaderboard Grid */}
            <BoardLeaderboard />
          </div>
        )}

        {/* =========================================================
            TAB 2: THE 3-DISH STEW & CASSEROLE MEAL PREP PLAN
           ========================================================= */}
        {activeTab === 'MEAL_PLAN' && (
          <div className="space-y-6">
            <PlanHeader />

            {/* The 3 Recommended Batch Dishes */}
            <PlanDishes />

            {/* Option to Browse All Evaluated Stew/Casserole Blueprints */}
            <PlanBlueprints />
          </div>
        )}

        {/* =========================================================
            TAB 3: SHOPPING LIST, 1-TAP CURBSIDE CART BRIDGE & EXPORT
           ========================================================= */}
        {activeTab === 'SHOPPING_LIST' && (
          <TripSection />
        )}

        {/* =========================================================
            TAB 4: USDA, 6-WEEK CYCLE SIGNALS & WHOLESALE CLUB RADAR
           ========================================================= */}
        {activeTab === 'RADAR' && (
          <RadarSection />
        )}

        {/* =========================================================
            PANTRY: the private Virtual Pantry (a module since B.3b; it was a drawer over the tabs)
           ========================================================= */}
        {activeTab === 'PANTRY' && (
          <PantryDrawer speechConfigured={speechConfigured} barcodeEnabled={barcodeEnabled} cameraEnabled={cameraEnabled} />
        )}
      </main>
    </div>
  );
}
