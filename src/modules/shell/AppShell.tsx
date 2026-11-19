'use client';

import { useEffect, type ReactNode } from 'react';
import ZipPanel from '@/modules/shell/ZipPanel';
import StoresPanel from '@/modules/shell/StoresPanel';
import AlertsPanel from '@/modules/shell/AlertsPanel';
import HeaderPrimary from '@/modules/shell/HeaderPrimary';
import StoreFilterBar from '@/modules/shell/StoreFilterBar';
import PinSummary from '@/modules/shell/PinSummary';
import { BottomNavigation, SideNavigation } from '@/modules/shell/PrimaryNavigation';
import AccountDialog from '@/modules/shell/AccountDialog';
import { useLocationContext, useShellContext } from '@/modules/shell/app-context';
import { LAST_MODULE_COOKIE, LAST_MODULE_MAX_AGE_SECONDS } from '@/modules/shell/navigation';
import { DoorOpen } from 'lucide-react';

// v2.0 M3 Phase B.3c: the app's chrome (header, filters, notices, account dialog, toast, panels and, since M4-1a, the
// navigation) around
// the current page. It lives in the route group's layout, so it persists across module changes, and it was moved
// verbatim from DashboardShell. It also remembers the module in the last-used-module cookie, which "/" reads to redirect
// (owner decision 10; the module name only, no personal data).
export default function AppShell({ children }: { children?: ReactNode }) {
  const { showZipModal } = useLocationContext();
  const { module, arbitrageToast, setArbitrageToast, showStoresModal, showAlertsModal } = useShellContext();

  useEffect(() => {
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${LAST_MODULE_COOKIE}=${module}; Path=/; Max-Age=${LAST_MODULE_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
  }, [module]);

  return (
    <div className="min-h-screen medium:flex">
      <SideNavigation />
      <div className="min-w-0 flex-1 pb-24 medium:pb-8">
      {/* Top Header — Two-Tier Navigation Architecture */}
      <header className={`${module === 'pantry' ? 'relative' : 'sticky top-0'} z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-2xs no-print`}>
        <div className="mx-auto max-w-6xl px-4 py-2.5">
          {/* Tier 1: Primary Brand & Location (Left) + Utilities & User Account (Pinned Top-Right) */}
          <HeaderPrimary />

          {/* Tier 2: Dedicated Supermarket Filter Bar (Left) & Weekly Ad-Cycle Pill (Right) */}
          <StoreFilterBar />

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

          {/* Pins and availability summary, with the shortcut to the meal plan */}
          <PinSummary />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-5">
        {children}
      </main>
      </div>
      <BottomNavigation />
    </div>
  );
}
