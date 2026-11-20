'use client';

import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { focusRing } from '@/components/ui/cx';
import { getItemCurbsideLinks } from '@/lib/cart-exporter';
import { resolveStoreBanner } from '@/data/store-registry';
import { renderDealBadge } from '@/modules/shop/badges';
import { useDashboardContext, useLocationContext, useShellContext, useShopContext } from '@/modules/shell/app-context';
import type { ResolvedShoppingItem } from '@/modules/shop/TripSection';
import type { StoreChain } from '@/types/domain';

// v2.0 M4-3b (wireframe Shop Trip): the shopping list, grouped by the store each item is bought at, a checkbox row for each,
// with the amount needed and the price. A store with many items shows the first few and "Show N more" (the iPad wireframe). The
// rest of what the old row showed (the dishes it is used in, the curbside links, marking it as on hand) is behind the row's
// "Details", so the row is the one thing a shopper scans. Checking an item is the same Shop state and storage as before.
export const TRIP_STORE_LIMIT = 5;

function TripRow({ item }: { item: ResolvedShoppingItem }) {
  const { currentZip } = useLocationContext();
  const { checkedItems, toggleCheckedItem } = useShopContext();
  const { handleToggleOnHand } = useShellContext();
  const checked = Boolean(checkedItems[item.ingredientId]);
  const inputId = `trip-${item.ingredientId}`;
  const { primaryLink, bridgeLinks } = getItemCurbsideLinks(item.activeStore, item.ingredientName, currentZip);
  return (
    <li className="py-1">
      <div className="flex min-h-touch items-center gap-3">
        <input
          id={inputId}
          type="checkbox"
          checked={checked}
          onChange={() => toggleCheckedItem(item.ingredientId)}
          className={`size-5 shrink-0 accent-accent ${focusRing}`}
        />
        <label htmlFor={inputId} className={`flex min-h-touch flex-1 flex-col justify-center ${checked ? 'text-muted line-through' : 'text-ink'}`}>
          <span className="text-base">{item.ingredientName}, {item.totalQuantityNeeded} {item.unit}</span>
          {item.isOnHand && <span className="text-xs font-semibold">Already have (no cost)</span>}
        </label>
        <span className={`text-sm ${item.isOnHand ? 'text-muted' : 'font-semibold text-ink'}`}>${item.activeTotalCost.toFixed(2)}</span>
      </div>
      <details className="no-print pl-8">
        <summary className={`flex min-h-touch cursor-pointer list-none items-center text-sm font-semibold text-accent ${focusRing}`}>
          Details<span className="sr-only"> for {item.ingredientName}</span>
        </summary>
        <div className="space-y-2 pb-2 text-sm text-muted">
          {!item.isOnHand && <div className="flex flex-wrap items-center gap-2">{renderDealBadge(item.activeDealType)}<span>{item.activeRawDealText}</span></div>}
          <p>
            <span className="font-semibold text-ink">Total needed: {item.totalQuantityNeeded} {item.unit}</span>
            {' • Used in: '}
            {item.usedInDishes.map((u) => `${u.dishTitle} (${u.quantity} ${item.unit})`).join(' + ')}
          </p>
          {!item.isOnHand && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide">Order curbside</span>
              <a href={primaryLink.url} target="_blank" rel="noopener noreferrer" className={`inline-flex min-h-touch items-center gap-1 rounded-control bg-chip px-3 font-semibold text-ink ${focusRing}`}>
                {primaryLink.shortLabel}<ExternalLink aria-hidden="true" className="size-3" />
              </a>
              {bridgeLinks.filter((b) => b.provider !== primaryLink.provider).map((link) => (
                <a key={link.provider} href={link.url} target="_blank" rel="noopener noreferrer" className={`inline-flex min-h-touch items-center gap-1 rounded-control bg-chip px-3 text-ink ${focusRing}`}>
                  {link.shortLabel}<ExternalLink aria-hidden="true" className="size-3" />
                </a>
              ))}
            </div>
          )}
          <Button variant="secondary" aria-pressed={item.isOnHand} onClick={() => handleToggleOnHand(item.ingredientId)}>
            Have it
          </Button>
        </div>
      </details>
    </li>
  );
}

function StoreGroup({ store, items }: { store: StoreChain; items: ResolvedShoppingItem[] }) {
  const { currentZip } = useLocationContext();
  const [all, setAll] = useState(false);
  const shown = all ? items : items.slice(0, TRIP_STORE_LIMIT);
  // An owned item costs 0 (and the shopping list leaves owned ingredients out), so the subtotal is the plain sum.
  const subtotal = items.reduce((sum, item) => sum + item.activeTotalCost, 0);
  const heading = resolveStoreBanner(store, currentZip);
  return (
    <Card as="section" aria-label={heading}>
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-base font-bold text-ink">{heading}</h3>
        <p className="text-sm text-muted">{items.length} {items.length === 1 ? 'item' : 'items'} · <span className="font-semibold text-ink">${subtotal.toFixed(2)}</span></p>
      </div>
      <ul className="mt-1 divide-y divide-border">
        {shown.map((item) => <TripRow key={item.ingredientId} item={item} />)}
      </ul>
      {items.length > TRIP_STORE_LIMIT && (
        <Button variant="quiet" className="no-print mt-1" aria-expanded={all} onClick={() => setAll((open) => !open)}>
          {all ? 'Show fewer' : `Show ${items.length - TRIP_STORE_LIMIT} more`}
        </Button>
      )}
    </Card>
  );
}

export default function TripItems() {
  const { resolvedShoppingItems, shoppingPlan } = useDashboardContext();
  const groups = new Map<StoreChain, ResolvedShoppingItem[]>();
  for (const item of resolvedShoppingItems) groups.set(item.activeStore, [...(groups.get(item.activeStore) ?? []), item]);
  return (
    <section aria-labelledby="trip-list" className="space-y-3">
      <h2 id="trip-list" className="sr-only">Shopping list ({resolvedShoppingItems.length + shoppingPlan.pantryNeeds.length} ingredients to buy)</h2>
      <div className="grid gap-3 sm:grid-cols-2 wide:grid-cols-1">
        {[...groups.entries()].map(([store, items]) => <StoreGroup key={store} store={store} items={items} />)}
      </div>
    </section>
  );
}
