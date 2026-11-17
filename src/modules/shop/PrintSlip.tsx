import { resolveStoreBanner } from '@/data/store-registry';
import type { buildShoppingListAndStoreComparison } from '@/lib/shopping-list';
import type { CommodityCategory, DealType, StoreChain } from '@/types/domain';

// Moved verbatim from MealPrepDashboard (v2.0 M3 Phase A.2); state and handlers stay in the dashboard.

export interface PrintSlipItem {
  category: CommodityCategory;
  ingredientId: string;
  ingredientName: string;
  totalQuantityNeeded: number;
  unit: string;
  activeStore: StoreChain;
  activeRawDealText: string;
  activeDealType: DealType;
  activeTotalCost: number;
}

interface PrintSlipProps {
  cityLabel: string;
  currentZip: string;
  adCycleLabel: string;
  dishCount: number;
  totalServings: number;
  tripComparison: ReturnType<typeof buildShoppingListAndStoreComparison>['tripComparison'];
  items: PrintSlipItem[];
}

export default function PrintSlip({ cityLabel, currentZip, adCycleLabel, dishCount, totalServings, tripComparison, items }: PrintSlipProps) {
  return (
    <section className="rounded-2xl border-2 border-slate-900 bg-white p-5 text-black shadow-md">
      <div className="flex items-center justify-between border-b-2 border-black pb-3">
        <div>
          <h3 className="text-lg font-black uppercase tracking-tight">
            PantryBot Weekend In-Store &amp; Curbside Slip
          </h3>
          <p className="text-xs font-semibold text-slate-700">
            {cityLabel} ({currentZip}) • {adCycleLabel} •{' '}
            {dishCount} Batch Dishes ({totalServings} Meals)
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs font-bold uppercase">Est. Basket Total</div>
          <div className="text-xl font-black">
            $
            {(
              tripComparison.bestTwoStoreSplit?.total ??
              tripComparison.optimalSplitTotal
            ).toFixed(2)}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {(['PRODUCE', 'PROTEIN', 'DAIRY_EGGS'] as CommodityCategory[]).map(
          (cat) => {
            const catItems = items.filter(
              (i) => i.category === cat
            );
            if (catItems.length === 0) return null;
            const catTitle =
              cat === 'PRODUCE'
                ? '🥬 Fresh Produce Aisle'
                : cat === 'PROTEIN'
                  ? '🥩 Meat & Seafood Counter'
                  : '🧀 Dairy & Eggs Wall';
            return (
              <div key={cat} className="space-y-1.5">
                <h4 className="border-b border-slate-400 pb-1 text-xs font-black uppercase">
                  {catTitle}
                </h4>
                {catItems.map((cItem) => (
                  <div
                    key={`print-${cItem.ingredientId}`}
                    className="flex items-start justify-between gap-2 text-xs py-1 border-b border-slate-100"
                  >
                    <div className="flex items-start gap-2">
                      <span className="inline-block h-3.5 w-3.5 border border-black mt-0.5 shrink-0" />
                      <div>
                        <span className="font-bold">
                          {cItem.ingredientName}
                        </span>{' '}
                        ({cItem.totalQuantityNeeded} {cItem.unit})
                        <div className="text-[10px] text-slate-700">
                          [{resolveStoreBanner(cItem.activeStore, currentZip)}] •{' '}
                          {cItem.activeRawDealText}
                          {cItem.activeDealType === 'DIGITAL_COUPON'
                            ? ' • 📱 CLIP COUPON'
                            : ''}
                        </div>
                      </div>
                    </div>
                    <span className="font-black">
                      ${cItem.activeTotalCost.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            );
          }
        )}
      </div>
    </section>
  );
}
