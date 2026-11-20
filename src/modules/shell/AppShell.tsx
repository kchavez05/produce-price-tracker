'use client';

import { useEffect, type ReactNode } from 'react';
import ZipPanel from '@/modules/shell/ZipPanel';
import StoresPanel from '@/modules/shell/StoresPanel';
import AlertsPanel from '@/modules/shell/AlertsPanel';
import HeaderPrimary from '@/modules/shell/HeaderPrimary';
import StoreFilterBar from '@/modules/shell/StoreFilterBar';
import TemporaryControls from '@/modules/shell/TemporaryControls';
import PinSummary from '@/modules/shell/PinSummary';
import { BottomNavigation, SideNavigation } from '@/modules/shell/PrimaryNavigation';
import AccountDialog from '@/modules/shell/AccountDialog';
import { useLocationContext, useShellContext } from '@/modules/shell/app-context';
import { LAST_MODULE_COOKIE, LAST_MODULE_MAX_AGE_SECONDS, type AppModule } from '@/modules/shell/navigation';
import { DoorOpen } from 'lucide-react';

// v2.0 M3 Phase B.3c: the app's chrome around the current page. It lives in the route group's layout, so it persists across
// module changes. It also remembers the module in the last-used-module cookie, which "/" reads to redirect (owner decision
// 10; the module name only, no personal data).
//
// v2.0 M4-1b: the frame uses the design tokens and opts the app into them (`data-ds` on <html>, which turns on `color-scheme`
// and the browser chrome colour; set after mount like the rest of the theme code, so the first render matches the server).
// The sticky header is only the brand and the account avatar, padded for the iPhone status bar (`viewport-fit=cover`). The
// ZIP, alerts, store filter, notices and panels moved from the header into the top of the page; they go away as Settings and
// the Shop redesign take over their jobs (M4 decision 19). Each screen has a visually hidden h1 with its name (spec 6a).
// Settings is not a tab: it shows its own visible title and, since it hosts these controls itself (M4-2a), none of the
// page-top controls, panels or dialogs below. It does not write the last-used-module cookie, and it remembers the tab the
// user came from so it can offer Back.
const SCREEN_NAMES: Record<Exclude<AppModule, 'settings'>, string> = { shop: 'Shop', pantry: 'Pantry', plan: 'Plan' };

export default function AppShell({ children }: { children?: ReactNode }) {
  const { showZipModal } = useLocationContext();
  const { module, setLastTab, arbitrageToast, setArbitrageToast, showStoresModal, showAlertsModal } = useShellContext();
  const onSettings = module === 'settings';

  useEffect(() => {
    if (module === 'settings') return;
    setLastTab(module);
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${LAST_MODULE_COOKIE}=${module}; Path=/; Max-Age=${LAST_MODULE_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
  }, [module, setLastTab]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-ds', '');
    return () => root.removeAttribute('data-ds');
  }, []);

  return (
    <div className="min-h-screen bg-bg text-ink medium:flex">
      <SideNavigation />
      <div className="min-w-0 flex-1 pb-24 medium:pb-8">
        <header className={`${module === 'pantry' ? 'relative' : 'sticky top-0'} z-30 border-b border-border bg-surface/95 pt-[env(safe-area-inset-top)] backdrop-blur-md no-print`}>
          <div className="mx-auto max-w-6xl px-4 py-2">
            <HeaderPrimary />
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 pt-3">
          {!onSettings && <h1 className="sr-only">{SCREEN_NAMES[module]}</h1>}

          {!onSettings && <div className="no-print">
            <TemporaryControls />
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
          </div>}

          <div className="pt-4">{children}</div>
        </main>
      </div>
      <BottomNavigation />
    </div>
  );
}
