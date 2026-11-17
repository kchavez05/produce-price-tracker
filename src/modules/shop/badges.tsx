import { CreditCard, Layers, Smartphone, Tag } from 'lucide-react';
import { getStoreDefinition, resolveStoreBanner } from '@/data/store-registry';
import type { DealType, ScoredCommodity, StoreChain } from '@/types/domain';

// Moved verbatim from MealPrepDashboard (v2.0 M3 Phase A.1). `renderStoreBadge`
// takes the ZIP as an argument instead of reading it from the component scope.

export function renderDealBadge(dealType: DealType) {
  switch (dealType) {
    case 'DIGITAL_COUPON':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900 border border-amber-300">
          <Smartphone className="h-3 w-3" />
          Clip Digital Coupon
        </span>
      );
    case 'MULTI_BUY':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-900 border border-purple-300">
          <Layers className="h-3 w-3" />
          Multi-Buy Requirement
        </span>
      );
    case 'EVERYDAY_LOW':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-900 border border-blue-300">
          <Tag className="h-3 w-3" />
          Everyday Low Price
        </span>
      );
    case 'SHELF_OR_MEMBER':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-900 border border-emerald-300">
          <CreditCard className="h-3 w-3" />
          Member Card Price
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
          <Tag className="h-3 w-3" />
          Everyday Shelf Price
        </span>
      );
  }
}

export function renderStoreBadge(store: StoreChain, currentZip: string) {
  const def = getStoreDefinition(store);
  const banner = resolveStoreBanner(store, currentZip);
  return (
    <span
      style={{ backgroundColor: def.brandColor, color: '#ffffff' }}
      className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold shadow-xs"
    >
      {banner}
    </span>
  );
}

export function renderCycleSignalBadge(item: ScoredCommodity) {
  if (item.bestOffer.source === 'CURATED_FALLBACK') return (
    <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-900">Historical estimate</span>
  );
  const sig = item.cycleSignal;
  if (!sig) return null;
  if (sig.status === 'STOCK_UP_6WK_LOW') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-900 border border-emerald-300">
        <span>🟢 Stock Up Alert (6-Wk Low)</span>
      </span>
    );
  }
  if (sig.status === 'CYCLE_PEAK_WAIT') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-900 border border-rose-300">
        <span>🔴 Cycle Peak (Wait / Swap)</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-900 border border-amber-200">
      <span>🟡 Fair Sale Price</span>
    </span>
  );
}
