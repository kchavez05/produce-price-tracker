'use client';

import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Button, Select, Sheet } from '@/components/ui';
import { resolveStoreBanner } from '@/data/store-registry';
import AppLink from '@/modules/shell/AppLink';
import { useLocationContext, usePreferencesContext, useShopContext } from '@/modules/shell/app-context';
import type { StoreChain } from '@/types/domain';

// v2.0 M4-3a: the store filter and the sort order, in a Filters sheet. The wireframes have no row for them, so (owner decision,
// M4-3a) they keep today's behavior behind this button: the same actions the old store bar and sort menu called
// (`handleStoreChange`, `setSortMode`). The sort order only applies to the Deals view, so the sheet shows it there only.
type Sort = 'VALUE_SCORE' | 'LOWEST_PRICE' | 'BIGGEST_DISCOUNT';
const SORTS: ReadonlyArray<{ value: Sort; label: string }> = [
  { value: 'VALUE_SCORE', label: 'Best meal-prep value (affordability and discount)' },
  { value: 'LOWEST_PRICE', label: 'Lowest cost ($ per lb or dozen)' },
  { value: 'BIGGEST_DISCOUNT', label: 'Biggest percent off regular price' },
];

export default function ShopFilters() {
  const [open, setOpen] = useState(false);
  const { currentZip } = useLocationContext();
  const { storeFilter, activeStores, handleStoreChange } = usePreferencesContext();
  const { shopView, sortMode, setSortMode } = useShopContext();
  const active = (storeFilter !== 'ALL' ? 1 : 0) + (shopView === 'BOARD' && sortMode !== 'VALUE_SCORE' ? 1 : 0);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)} className="shrink-0">
        <SlidersHorizontal aria-hidden="true" className="size-4" />
        <span>Filters{active > 0 ? ` (${active})` : ''}</span>
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Filters">
        <div className="space-y-4">
          <Select
            label="Store"
            value={storeFilter}
            onChange={(event) => handleStoreChange(event.target.value as 'ALL' | StoreChain)}
            hint="Choose which stores you shop at in Settings."
          >
            <option value="ALL">All stores ({activeStores.length})</option>
            {activeStores.map((chain) => <option key={chain} value={chain}>{resolveStoreBanner(chain, currentZip)}</option>)}
          </Select>
          {shopView === 'BOARD' && (
            <Select label="Sort by" value={sortMode} onChange={(event) => setSortMode(event.target.value as Sort)}>
              {SORTS.map((sort) => <option key={sort.value} value={sort.value}>{sort.label}</option>)}
            </Select>
          )}
          <p className="text-sm text-muted">
            <AppLink to={{ module: 'settings' }} className="text-accent underline">Open Settings</AppLink> to change your stores and location.
          </p>
        </div>
      </Sheet>
    </>
  );
}
