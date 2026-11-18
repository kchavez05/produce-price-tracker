import { Store } from 'lucide-react';
import { getStoreDefinition, resolveStoreBanner } from '@/data/store-registry';
import type { DashboardPayload, StoreChain } from '@/types/domain';

// Moved verbatim from MealPrepDashboard (v2.0 M3 Phase A.4, header); state and handlers stay in the dashboard.

interface StoreFilterBarProps {
  data: Pick<DashboardPayload, 'adCycleLabel'>;
  currentZip: string;
  storeFilter: 'ALL' | StoreChain;
  activeStores: StoreChain[];
  showStoresModal: boolean;
  handleStoreChange: (store: 'ALL' | StoreChain) => void;
  setShowStoresModal: (show: boolean) => void;
}

export default function StoreFilterBar({ data, currentZip, storeFilter, activeStores, showStoresModal, handleStoreChange, setShowStoresModal }: StoreFilterBarProps) {
  return (
    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2">
      <div className="flex flex-wrap items-center gap-2 max-w-full">
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs font-medium overflow-x-auto max-w-full">
          <button
            onClick={() => handleStoreChange('ALL')}
            className={`rounded-md px-2.5 py-1 transition whitespace-nowrap ${
              storeFilter === 'ALL'
                ? 'bg-white font-semibold text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Stores ({activeStores.length})
          </button>
          {activeStores.map((chain) => {
            const banner = resolveStoreBanner(chain, currentZip);
            const def = getStoreDefinition(chain);
            const isSelected = storeFilter === chain;
            return (
              <button
                key={chain}
                onClick={() => handleStoreChange(chain)}
                style={
                  isSelected
                    ? { backgroundColor: def.brandColor, color: '#ffffff' }
                    : undefined
                }
                className={`rounded-md px-2.5 py-1 transition whitespace-nowrap ${
                  isSelected
                    ? 'font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {banner}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setShowStoresModal(!showStoresModal)}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
            showStoresModal
              ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
          title="Customize which grocery stores you shop at"
        >
          <Store className="h-3.5 w-3.5" />
          <span>My Stores ({activeStores.length})</span>
        </button>
      </div>

      <div className="hidden items-center gap-1.5 rounded-md bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 border border-slate-200/80 md:inline-flex">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        <span>{data.adCycleLabel}</span>
      </div>
    </div>
  );
}
