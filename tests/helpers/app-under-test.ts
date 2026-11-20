// jsdom stand-in for the Next.js route tree (v2.0 M3 Phase B.3c, #701). The app is a route-group layout (provider and chrome)
// around one page per module; Tier 1 tests cannot run Next.js, so this mounts the same pieces with an in-memory router:
//   TestRouter     the AppRouter the app reads (a path and push), kept in state so a navigation re-renders like a real one.
//   AppUnderTest   TestRouter > AppProvider > AppShell > the page for the current path, exactly as app/(app)/layout.tsx and
//                  the three pages compose them.
// Anything that asserts a URL reads it through onPath.
import { createElement, useState, type ReactNode } from 'react';
import AppProvider from '@/modules/shell/AppProvider';
import AppShell from '@/modules/shell/AppShell';
import { AppRouterProvider, useAppRouter } from '@/modules/shell/app-router';
import { moduleOfPath } from '@/modules/shell/navigation';
import ShopPage from '@/modules/shop/ShopPage';
import PlanPage from '@/modules/plan/PlanPage';
import PantryDrawer from '@/modules/pantry/PantryDrawer';
import SettingsPage from '@/modules/settings/SettingsPage';
import WelcomePage from '@/modules/welcome/WelcomePage';
import { SETUP_COMPLETED_KEY } from '@/modules/shell/first-run';
import type { DashboardPayload, RecommendedDish } from '@/types/domain';

export interface TestRouterProps {
  initialPath?: string;
  /** Called with the path on mount and after every navigation. */
  onPath?: (path: string) => void;
  /** Called with every path pushed (not the initial one), in order. */
  onPush?: (path: string) => void;
  /** Called with every path replaced, in order (the first-run redirect and the end of setup). */
  onReplace?: (path: string) => void;
  children?: ReactNode;
}

export function TestRouter({ initialPath = '/shop', onPath, onPush, onReplace, children }: TestRouterProps) {
  const [pathname, setPathname] = useState(initialPath);
  onPath?.(pathname);
  return createElement(AppRouterProvider, {
    router: {
      pathname,
      push: (path: string) => { onPush?.(path); setPathname(path); },
      replace: (path: string) => { onReplace?.(path); setPathname(path); },
    },
  }, children);
}

export interface PageFlags {
  speechConfigured?: boolean;
  barcodeEnabled?: boolean;
  cameraEnabled?: boolean;
}

function TestPage({ flags }: { flags: PageFlags }) {
  const { pathname } = useAppRouter();
  const current = moduleOfPath(pathname);
  if (current === 'welcome') return createElement(WelcomePage);
  if (current === 'settings') return createElement(SettingsPage);
  if (current === 'plan') return createElement(PlanPage);
  if (current === 'pantry') return createElement(PantryDrawer, flags);
  return createElement(ShopPage);
}

export interface AppUnderTestProps extends Pick<TestRouterProps, 'initialPath' | 'onPath' | 'onPush' | 'onReplace'> {
  initialData: DashboardPayload;
  initialAccountId?: string | null;
  initialPrivateRecipes?: RecommendedDish[];
  flags?: PageFlags;
  /**
   * Leave the device as a first run (nothing set up) so the shell redirects to /welcome. By default a test device counts as set up
   * (the first-run marker is seeded before the first render), so the journeys that are not about onboarding start where they say.
   */
  firstRun?: boolean;
}

export default function AppUnderTest({
  initialData, initialAccountId = null, initialPrivateRecipes = [], flags = {}, initialPath, onPath, onPush, onReplace, firstRun = false,
}: AppUnderTestProps) {
  useState(() => {
    if (!firstRun && localStorage.getItem(SETUP_COMPLETED_KEY) === null) localStorage.setItem(SETUP_COMPLETED_KEY, '1');
    return null;
  });
  return createElement(TestRouter, { initialPath, onPath, onPush, onReplace },
    createElement(AppProvider, { initialData, initialAccountId, initialPrivateRecipes },
      createElement(AppShell, null, createElement(TestPage, { flags }))));
}
