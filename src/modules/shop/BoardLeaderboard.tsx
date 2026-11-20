'use client';

import { useState } from 'react';
import { Button, EmptyState } from '@/components/ui';
import DealCard from '@/modules/shop/DealCard';
import AppLink from '@/modules/shell/AppLink';
import { useDashboardContext, useShopContext } from '@/modules/shell/app-context';

// v2.0 M4-3a: the Deals list. It shows 12 deals at a time with "Show 12 more" (owner decision, M4-3a), and says so when a
// category or the store filter leaves nothing. ShopPage keys this component on the category, sort and store filter, so
// choosing another starts again at the first 12 while pinning or marking a deal does not.
export const DEALS_PAGE_SIZE = 12;

export default function BoardLeaderboard({ selectedId = null }: { selectedId?: string | null }) {
  const { filteredCommodities } = useDashboardContext();
  const { categoryFilter, setCategoryFilter } = useShopContext();
  const [shown, setShown] = useState(DEALS_PAGE_SIZE);

  if (filteredCommodities.length === 0) {
    return (
      <EmptyState
        title="No deals to show"
        description={categoryFilter === 'ALL'
          ? 'Nothing matches your stores and filters right now. Check your stores in Settings or loosen the store filter.'
          : 'Nothing in this category matches your stores and filters right now.'}
        action={categoryFilter === 'ALL'
          ? <AppLink to={{ module: 'settings' }} className="inline-flex min-h-touch items-center text-accent underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">Open Settings</AppLink>
          : <Button variant="secondary" onClick={() => setCategoryFilter('ALL')}>Show all categories</Button>}
      />
    );
  }

  const visible = filteredCommodities.slice(0, shown);
  const remaining = filteredCommodities.length - visible.length;
  return (
    <>
      <h2 className="sr-only">Deals</h2>
      <div className="grid gap-3 sm:grid-cols-2 wide:grid-cols-1">
        {visible.map((item) => <DealCard key={item.ingredient.id} item={item} selected={item.ingredient.id === selectedId} />)}
      </div>
      <p className="mt-3 text-center text-sm text-muted">Showing {visible.length} of {filteredCommodities.length} deals</p>
      {remaining > 0 && (
        <div className="mt-1 flex justify-center">
          <Button variant="secondary" onClick={() => setShown((count) => count + DEALS_PAGE_SIZE)}>
            Show {Math.min(DEALS_PAGE_SIZE, remaining)} more
          </Button>
        </div>
      )}
    </>
  );
}
