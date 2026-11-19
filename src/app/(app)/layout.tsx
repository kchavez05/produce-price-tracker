import type { ReactNode } from 'react';
import { readProfilePantryAvailability } from '@/lib/pantry/server';
import { loadInventoryState } from '@/lib/supabase/session';
import { buildDashboardPayload } from '@/lib/scoring-and-matcher';
import AppProvider from '@/modules/shell/AppProvider';
import AppShell from '@/modules/shell/AppShell';
import { NextAppRouter } from '@/modules/shell/app-router';

export const dynamic = 'force-dynamic';

// v2.0 M3 Phase B.3c: the layout of /shop, /plan and /pantry. It loads the inventory and the first dashboard payload once
// (moved verbatim from the old home page) and mounts the AppProvider and the chrome. Next.js layouts persist across client
// navigations, so switching module keeps every piece of state, the pantry and sync queues, and any request in flight.
export default async function AppLayout({ children }: { children: ReactNode }) {
  const inventory = await loadInventoryState();
  const onHandIngredientIds = await readProfilePantryAvailability(inventory.profile).catch(() => []);
  const initialData = await buildDashboardPayload({
    savedRecipes: inventory.savedRecipes,
    zipCode: '80542',
    storeFilter: 'ALL',
    pinnedIngredientIds: [],
    onHandIngredientIds,
  });

  return (
    <NextAppRouter>
      <AppProvider
        initialData={initialData}
        initialPrivateRecipes={inventory.savedRecipes}
        initialAccountId={inventory.profile && !inventory.profile.id.startsWith('guest-') ? inventory.profile.id : null}
      >
        <AppShell>{children}</AppShell>
      </AppProvider>
    </NextAppRouter>
  );
}
