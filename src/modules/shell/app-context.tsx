'use client';

import { createContext, useContext } from 'react';
import type { usePreferencesState } from '@/modules/shell/hooks/usePreferencesState';
import type { usePreferenceActions } from '@/modules/shell/hooks/usePreferenceActions';
import type { useLocationState } from '@/modules/shell/hooks/useLocationState';
import type { useAccountAndPantry } from '@/modules/shell/hooks/useAccountAndPantry';
import type { useDashboardPayload } from '@/modules/shell/hooks/useDashboardPayload';
import type { useDerivedDashboard } from '@/modules/shell/hooks/useDerivedDashboard';
import type { useShellUi, useShellActions } from '@/modules/shell/hooks/useShellUi';
import type { usePlanUi, usePlanActions } from '@/modules/plan/hooks/usePlanUi';
import type { useShopUi, useShopCopyAction } from '@/modules/shop/hooks/useShopUi';

// v2.0 M3 Phase B.1e: the app's state, split by owner into seven contexts. Each value is the return of the hooks that
// own that slice, so a module reads a narrow hook instead of taking a long list of props. Nothing here memoizes: the
// provider rebuilds every value on each render, like the closures it replaces, so a context does not isolate re-renders
// yet (stable actions would change closure semantics and are a later, measured step).
export type PreferencesContextValue = ReturnType<typeof usePreferencesState>
  & Omit<ReturnType<typeof usePreferenceActions>, 'handleZipSubmit'>;
export type LocationContextValue = ReturnType<typeof useLocationState>
  & Pick<ReturnType<typeof usePreferenceActions>, 'handleZipSubmit'>;
export type DashboardContextValue = ReturnType<typeof useDerivedDashboard>
  & Pick<ReturnType<typeof useDashboardPayload>, 'serverData' | 'syncDashboard'>;
export type AccountContextValue = ReturnType<typeof useAccountAndPantry>;
export type PlanContextValue = ReturnType<typeof usePlanUi> & ReturnType<typeof usePlanActions>;
export type ShopContextValue = ReturnType<typeof useShopUi> & ReturnType<typeof useShopCopyAction>;
export type ShellContextValue = ReturnType<typeof useShellUi> & ReturnType<typeof useShellActions>;

function createRequiredContext<T>(name: string, hookName: string) {
  const Context = createContext<T | null>(null);
  Context.displayName = name;
  function useRequiredContext(): T {
    const value = useContext(Context);
    if (value === null) throw new Error(`${hookName} must be used inside AppProvider`);
    return value;
  }
  return [Context, useRequiredContext] as const;
}

export const [PreferencesContext, usePreferencesContext] = createRequiredContext<PreferencesContextValue>('PreferencesContext', 'usePreferencesContext');
export const [LocationContext, useLocationContext] = createRequiredContext<LocationContextValue>('LocationContext', 'useLocationContext');
export const [DashboardContext, useDashboardContext] = createRequiredContext<DashboardContextValue>('DashboardContext', 'useDashboardContext');
export const [AccountContext, useAccountContext] = createRequiredContext<AccountContextValue>('AccountContext', 'useAccountContext');
export const [PlanContext, usePlanContext] = createRequiredContext<PlanContextValue>('PlanContext', 'usePlanContext');
export const [ShopContext, useShopContext] = createRequiredContext<ShopContextValue>('ShopContext', 'useShopContext');
export const [ShellContext, useShellContext] = createRequiredContext<ShellContextValue>('ShellContext', 'useShellContext');
