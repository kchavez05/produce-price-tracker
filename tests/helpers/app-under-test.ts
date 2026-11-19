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
import type { DashboardPayload, RecommendedDish } from '@/types/domain';

export interface TestRouterProps {
  initialPath?: string;
  /** Called with the path on mount and after every navigation. */
  onPath?: (path: string) => void;
  /** Called with every path pushed (not the initial one), in order. */
  onPush?: (path: string) => void;
  children?: ReactNode;
}

export function TestRouter({ initialPath = '/shop', onPath, onPush, children }: TestRouterProps) {
  const [pathname, setPathname] = useState(initialPath);
  onPath?.(pathname);
  return createElement(AppRouterProvider, {
    router: { pathname, push: (path: string) => { onPush?.(path); setPathname(path); } },
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
  if (current === 'plan') return createElement(PlanPage);
  if (current === 'pantry') return createElement(PantryDrawer, flags);
  return createElement(ShopPage);
}

export interface AppUnderTestProps extends Pick<TestRouterProps, 'initialPath' | 'onPath' | 'onPush'> {
  initialData: DashboardPayload;
  initialAccountId?: string | null;
  initialPrivateRecipes?: RecommendedDish[];
  flags?: PageFlags;
}

export default function AppUnderTest({
  initialData, initialAccountId = null, initialPrivateRecipes = [], flags = {}, initialPath, onPath, onPush,
}: AppUnderTestProps) {
  return createElement(TestRouter, { initialPath, onPath, onPush },
    createElement(AppProvider, { initialData, initialAccountId, initialPrivateRecipes },
      createElement(AppShell, null, createElement(TestPage, { flags }))));
}
