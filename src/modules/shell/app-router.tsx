'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';

// v2.0 M3 Phase B.3c: the one place the app touches the Next.js router. Everything else (the Shell hooks, the links, the
// providers) reads this small interface, so it stays testable in jsdom with an in-memory router and never imports
// next/navigation itself. NextAppRouter is the production implementation, mounted by the route group's layout.
export interface AppRouter {
  pathname: string;
  push: (path: string) => void;
}

const AppRouterContext = createContext<AppRouter | null>(null);

export function AppRouterProvider({ router, children }: { router: AppRouter; children?: ReactNode }) {
  return <AppRouterContext.Provider value={router}>{children}</AppRouterContext.Provider>;
}

export function useAppRouter(): AppRouter {
  const router = useContext(AppRouterContext);
  if (router === null) throw new Error('useAppRouter must be used inside an AppRouterProvider');
  return router;
}

export function NextAppRouter({ children }: { children?: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  return <AppRouterProvider router={{ pathname, push: (path) => router.push(path) }}>{children}</AppRouterProvider>;
}
