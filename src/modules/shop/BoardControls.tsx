'use client';

import { Chip } from '@/components/ui';
import { useShopContext } from '@/modules/shell/app-context';

// v2.0 M4-3a (wireframe Shop): the category chips under the view selector. The sort order moved into the Filters sheet
// (ShopFilters), so this is only the category. A row that does not fit scrolls sideways rather than wrapping into a block.
const CATEGORIES = [
  { id: 'ALL', label: 'All' },
  { id: 'PROTEIN', label: 'Meat' },
  { id: 'PRODUCE', label: 'Produce' },
  { id: 'DAIRY_EGGS', label: 'Dairy' },
] as const;

export default function BoardControls() {
  const { categoryFilter, setCategoryFilter } = useShopContext();
  return (
    <div role="group" aria-label="Category" className="no-print -mx-4 flex gap-2 overflow-x-auto px-4">
      {CATEGORIES.map((cat) => (
        <Chip key={cat.id} selected={categoryFilter === cat.id} onClick={() => setCategoryFilter(cat.id)} className="shrink-0">
          {cat.label}
        </Chip>
      ))}
    </div>
  );
}
