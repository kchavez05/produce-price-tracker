'use client';

import { useShopContext } from '@/modules/shell/app-context';
import AppLink from '@/modules/shell/AppLink';
import type { ShopView } from '@/modules/shell/navigation';

// v2.0 M4-1a: the Shop's view selector (Deals, Trip, Radar), moved here from the temporary tab strip. The views stay
// in-page state under /shop (M3 owner decision), so these links share one path; the Shop context keeps the choice across
// a trip to another module.
const VIEWS: ReadonlyArray<{ view: ShopView; label: string }> = [
  { view: 'BOARD', label: 'Deals' },
  { view: 'SHOPPING_LIST', label: 'Trip' },
  { view: 'RADAR', label: 'Radar' },
];

export default function ShopViewNav() {
  const { shopView } = useShopContext();
  return (
    <nav aria-label="Shop views" className="no-print mb-4">
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
              </AppLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
