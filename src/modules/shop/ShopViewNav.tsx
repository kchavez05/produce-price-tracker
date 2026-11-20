'use client';

import { useDashboardContext, useShopContext } from '@/modules/shell/app-context';
import AppLink from '@/modules/shell/AppLink';
import type { ShopView } from '@/modules/shell/navigation';

// v2.0 M4-1a: the Shop's view selector (Deals, Trip, Radar), moved here from the temporary tab strip. The views stay
// in-page state under /shop (M3 owner decision), so these links share one path; the Shop context keeps the choice across
// a trip to another module. Trip carries the number of items on the list (wireframe Shop).
const VIEWS: ReadonlyArray<{ view: ShopView; label: string }> = [
  { view: 'BOARD', label: 'Deals' },
  { view: 'SHOPPING_LIST', label: 'Trip' },
  { view: 'RADAR', label: 'Radar' },
];

export default function ShopViewNav() {
  const { shopView } = useShopContext();
  const { shoppingPlan } = useDashboardContext();
  const tripCount = shoppingPlan.items.length + shoppingPlan.pantryNeeds.length;
  return (
    <nav aria-label="Shop views" className="no-print">
      <ul className="flex gap-1 rounded-control bg-chip p-1">
        {VIEWS.map(({ view, label }) => {
          const active = view === shopView;
          return (
            <li key={view} className="flex-1">
              <AppLink
                to={{ module: 'shop', view }}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-touch items-center justify-center rounded-control px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
                  active ? 'bg-surface text-ink shadow-card' : 'text-muted'
                }`}
              >
                {label}
                {view === 'SHOPPING_LIST' && tripCount > 0 && (
                  <span className="ml-1.5 rounded-pill bg-chip px-1.5 text-xs font-bold text-ink">{tripCount}</span>
                )}
              </AppLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
