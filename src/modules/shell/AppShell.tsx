'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import HeaderPrimary from '@/modules/shell/HeaderPrimary';
import { BottomNavigation, SideNavigation } from '@/modules/shell/PrimaryNavigation';
import SignInHost from '@/modules/shell/SignInHost';
import { useAccountContext, useShellContext } from '@/modules/shell/app-context';
import { useAppRouter } from '@/modules/shell/app-router';
import { decideFirstRun, markSetupCompleted } from '@/modules/shell/first-run';
import { LAST_MODULE_COOKIE, LAST_MODULE_MAX_AGE_SECONDS, MODULE_PATHS, isTabModule, type AppModule } from '@/modules/shell/navigation';
import { DoorOpen } from 'lucide-react';

// v2.0 M3 Phase B.3c: the app's chrome around the current page. It lives in the route group's layout, so it persists across
// module changes. It also remembers the module in the last-used-module cookie, which "/" reads to redirect (owner decision
// 10; the module name only, no personal data).
//
// v2.0 M4-1b: the frame uses the design tokens and opts the app into them (`data-ds` on <html>, which turns on `color-scheme`
// and the browser chrome colour; set after mount like the rest of the theme code, so the first render matches the server).
// The sticky header is only the brand and the account avatar, padded for the iPhone status bar (`viewport-fit=cover`). Each
// screen has a visually hidden h1 with its name (spec 6a). Settings is not a tab: it shows its own visible title and renders
// the account dialog itself (M4-2a). It does not write the last-used-module cookie, and it remembers the tab the user came
// from so it can offer Back. Welcome (M4-2b, the first-run setup) shows no chrome at all. Since M4-3a the temporary ZIP,
// alerts, store-filter and pins controls and their panels are gone from the top of the page (M4 decision 19): location,
// stores and the digest live in Settings, the store filter and sort in the Shop's Filters sheet. What is left above a tab's
// page is the toast. The sign-in sheet (M4-6a), opened by Settings' Sign In and by every "Sign in to use" prompt, is mounted here, once, for every screen.
//
// First run (M4-2b): once, after mount, a device that has never been set up and has no signed-in account is sent to /welcome
// (`replace`, so Back does not loop). The decision is `decideFirstRun`; the account is the one the server resolved for this
// request (`pantryAccountId` is that value until the sync state loads), so a signed-in user on a new device is never sent
// to setup and is marked as set up.
const SCREEN_NAMES: Record<Exclude<AppModule, 'settings' | 'welcome'>, string> = { shop: 'Shop', pantry: 'Pantry', plan: 'Plan' };

export default function AppShell({ children }: { children?: ReactNode }) {
  const { pantryAccountId } = useAccountContext();
  const router = useAppRouter();
  const { module, setLastTab, arbitrageToast, setArbitrageToast } = useShellContext();
  const onSettings = module === 'settings';
  const onWelcome = module === 'welcome';

  useEffect(() => {
    if (!isTabModule(module)) return;
    setLastTab(module);
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${LAST_MODULE_COOKIE}=${module}; Path=/; Max-Age=${LAST_MODULE_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
  }, [module, setLastTab]);

  // The first render's account and module, and the latest router (a new object each render in tests).
  const firstRun = useRef({ accountId: pantryAccountId, module, router });
  firstRun.current.router = router;
  useEffect(() => {
    const decision = decideFirstRun(localStorage, firstRun.current.accountId);
    if (decision === 'signed-in') markSetupCompleted(localStorage);
    else if (decision === 'welcome' && firstRun.current.module !== 'welcome') firstRun.current.router.replace(MODULE_PATHS.welcome);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-ds', '');
    return () => root.removeAttribute('data-ds');
  }, []);

  if (onWelcome) {
    return (
      <div className="min-h-screen bg-bg pt-[env(safe-area-inset-top)] text-ink">
        <main className="mx-auto max-w-md px-4 py-8">{children}</main>
      </div>
    );
  }

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
          {!onSettings && <h1 className="sr-only">{SCREEN_NAMES[module as keyof typeof SCREEN_NAMES]}</h1>}

          {!onSettings && <div className="no-print">
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

          </div>}

          <div className="pt-4">{children}</div>
        </main>
      </div>
      <BottomNavigation />
      <SignInHost />
    </div>
  );
}
