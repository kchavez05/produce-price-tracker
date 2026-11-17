import { Check, Store } from 'lucide-react';
import { ALL_STORE_CHAINS, getStoreDefinition, resolveStoreBanner } from '@/data/store-registry';
import type { StoreChain } from '@/types/domain';

// Moved verbatim from MealPrepDashboard (v2.0 M3 Phase A.2); state and handlers stay in the dashboard.

interface StoresPanelProps {
  activeStores: StoreChain[];
  cityLabel: string;
  currentZip: string;
  onToggleStore: (store: StoreChain) => void;
  onSelectAll: () => void;
  onClose: () => void;
}

export default function StoresPanel({ activeStores, cityLabel, currentZip, onToggleStore, onSelectAll, onClose }: StoresPanelProps) {
  return (
    <div className="mt-3 rounded-xl border border-blue-300 bg-white p-4 shadow-lg text-xs text-slate-700">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <Store className="h-4 w-4 text-blue-600" />
          <span className="font-bold text-sm text-slate-900">
            My Grocery Stores ({activeStores.length} Active in {cityLabel})
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 text-sm font-bold px-2 py-0.5"
        >
          ✕
        </button>
      </div>

      <p className="mt-2 text-slate-600 text-xs">
        Select which grocery chains you shop at. Meal-prep ingredient pricing, digital coupon checklists, and multi-store trip split calculations will only compare against your selected stores.
      </p>

      <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {ALL_STORE_CHAINS.map((chain) => {
          const def = getStoreDefinition(chain);
          const banner = resolveStoreBanner(chain, currentZip);
          const isChecked = activeStores.includes(chain);
          return (
            <div
              key={chain}
              onClick={() => onToggleStore(chain)}
              className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition ${
                isChecked
                  ? 'border-blue-400 bg-blue-50/50 shadow-2xs'
                  : 'border-slate-200 bg-slate-50 opacity-60 hover:opacity-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  style={{ backgroundColor: def.brandColor }}
                  className="h-3.5 w-3.5 rounded-full shrink-0"
                />
                <div>
                  <div className="font-bold text-slate-900 text-xs">{banner}</div>
                  <div className="text-[11px] text-slate-500">
                    {def.hasDigitalCoupons
                      ? `📱 ${def.couponAppLabel || 'Digital Coupons'}`
                      : def.isEverydayLowPrice
                        ? '🏷️ Everyday Low Price'
                        : '🏷️ Member Card'}
                  </div>
                </div>
              </div>
              <div className="shrink-0 pl-2">
                {isChecked ? (
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-blue-600 text-white">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                ) : (
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-md border border-slate-300 bg-white" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-slate-100">
        <span className="text-[11px] text-slate-500">
          Tip: Toggle off stores you don&apos;t live near to streamline your shopping lists.
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={onSelectAll}
            className="text-xs font-semibold text-blue-700 hover:underline"
          >
            Select All
          </button>
          <button
            onClick={onClose}
            className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-bold text-white hover:bg-blue-700 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
