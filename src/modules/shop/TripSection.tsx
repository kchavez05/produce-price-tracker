import { Check, CheckSquare, Copy, ExternalLink, Printer, Smartphone, Snowflake, Square, Store } from 'lucide-react';
import { getItemCurbsideLinks } from '@/lib/cart-exporter';
import { getStoreDefinition, resolveStoreBanner } from '@/data/store-registry';
import type { buildShoppingListAndStoreComparison } from '@/lib/shopping-list';
import type { DashboardPayload, DealType, StoreChain } from '@/types/domain';
import { renderDealBadge, renderStoreBadge } from '@/modules/shop/badges';
import PrintSlip from '@/modules/shop/PrintSlip';

// Moved verbatim from MealPrepDashboard (v2.0 M3 Phase A.3, Trip tab). State, setters and handlers stay in the
// dashboard and are passed in under their original names so the markup below is unchanged.

type ShoppingPlan = ReturnType<typeof buildShoppingListAndStoreComparison>;
type PlanItem = ShoppingPlan['items'][number];

export type ResolvedShoppingItem = PlanItem & {
  activeStore: StoreChain;
  activeUnitCost: number;
  activeTotalCost: number;
  activeRawDealText: string;
  activeDealType: DealType;
  activeDealConditions: PlanItem['optimalDealConditions'];
};

interface TripSectionProps {
  data: DashboardPayload;
  currentZip: string;
  shoppingPlan: ShoppingPlan;
  tripMode: 'SPLIT' | StoreChain;
  setTripMode: (mode: 'SPLIT' | StoreChain) => void;
  resolvedShoppingItems: ResolvedShoppingItem[];
  digitalCouponItems: ResolvedShoppingItem[];
  activeTrio: readonly unknown[];
  trioTotals: { totalServings: number };
  checkedItems: Record<string, boolean>;
  clippedCoupons: Record<string, boolean>;
  copiedChecklist: boolean;
  showPrintSlipModal: boolean;
  setShowPrintSlipModal: (show: boolean) => void;
  toggleCheckedItem: (key: string) => void;
  toggleClippedCoupon: (key: string) => void;
  handleToggleOnHand: (ingredientId: string) => void;
  handleCopyShoppingListForNotes: () => void;
  handlePrintShoppingSlip: () => void;
}

export default function TripSection({
  data, currentZip, shoppingPlan, tripMode, setTripMode, resolvedShoppingItems, digitalCouponItems,
  activeTrio, trioTotals, checkedItems, clippedCoupons, copiedChecklist, showPrintSlipModal,
  setShowPrintSlipModal, toggleCheckedItem, toggleClippedCoupon, handleToggleOnHand,
  handleCopyShoppingListForNotes, handlePrintShoppingSlip,
}: TripSectionProps) {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-5 text-white shadow-md no-print">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-300">
              <Store className="h-3.5 w-3.5" />
              <span>
                Store Split Optimizer &amp; 1-Tap Curbside Cart Bridge (Tickets #7 &amp; #23)
              </span>
            </div>
            <h2 className="mt-2 text-xl font-extrabold sm:text-2xl">
              {shoppingPlan.tripComparison.recommendationHeadline}
            </h2>
            <p className="mt-1 text-xs text-slate-300 sm:text-sm">
              {shoppingPlan.tripComparison.recommendationDetail}
              {' Estimated additional grocery cost assumes marked ingredients are on hand. Staple rows identify the price basis; package checkout totals may differ.'}
              {shoppingPlan.tripComparison.additionalCostEstimateComplete === false && ' Known subtotal only — plus ingredients with no price.'}
            </p>
          </div>

          <div className="text-right text-xs text-slate-300">
            <div>Regular Shelf Price Without Promos:</div>
            <div className="text-lg font-bold text-slate-400 line-through">
              ${shoppingPlan.tripComparison.regularShelfTotal.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {/* Optimal 2-Store Split Card (v1.1) */}
          <button
            onClick={() => setTripMode('SPLIT')}
            className={`w-full flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border p-4 text-left transition gap-3 ${
              tripMode === 'SPLIT'
                ? 'border-emerald-400 bg-emerald-500/20 ring-2 ring-emerald-400/40 shadow-sm'
                : 'border-white/15 bg-white/5 hover:bg-white/10'
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  ⚡ Optimal 2-Store Split:{' '}
                  {shoppingPlan.tripComparison.bestTwoStoreSplit?.storeNames.join(
                    ' + '
                  ) || 'Multi-Store'}
                </span>
                {tripMode === 'SPLIT' && (
                  <span className="rounded-full bg-emerald-400 px-2 py-0.5 text-[10px] font-bold text-slate-950">
                    Active Cart
                  </span>
                )}
              </div>
              <div className="mt-1 text-xs text-slate-300">
                {shoppingPlan.tripComparison.bestTwoStoreSplit?.splitSummary ||
                  'Cheapest ingredient across stores'}
              </div>
            </div>
            <div className="text-left sm:text-right shrink-0">
              <div className="text-2xl font-black text-white">
                $
                {(
                  shoppingPlan.tripComparison.bestTwoStoreSplit?.total ??
                  shoppingPlan.tripComparison.optimalSplitTotal
                ).toFixed(2)}
              </div>
              <div className="text-[11px] text-emerald-300 font-semibold">
                Save $
                {(
                  shoppingPlan.tripComparison.regularShelfTotal -
                  (shoppingPlan.tripComparison.bestTwoStoreSplit?.total ??
                    shoppingPlan.tripComparison.optimalSplitTotal)
                ).toFixed(2)}{' '}
                vs regular shelf
              </div>
            </div>
          </button>

          {/* Ranked 1-Stop Store Leaderboard (v1.1) */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Ranked 1-Stop Trips ({shoppingPlan.items.length} priced market ingredients; staples estimated separately)
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {(shoppingPlan.tripComparison.singleStoreRankings || []).map(
                (rank, idx) => {
                  const def = getStoreDefinition(rank.store);
                  const isSelected = tripMode === rank.store;
                  return (
                    <button
                      key={rank.store}
                      onClick={() => setTripMode(rank.store)}
                      className={`flex flex-col justify-between rounded-xl border p-3 text-left transition ${
                        isSelected
                          ? 'border-indigo-400 bg-indigo-500/25 ring-2 ring-indigo-400/40'
                          : 'border-white/15 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-300">
                            #{idx + 1}
                          </span>
                          <span
                            style={{
                              backgroundColor: def.brandColor,
                              color: '#ffffff',
                            }}
                            className="rounded-md px-2 py-0.5 text-[11px] font-bold shadow-xs"
                          >
                            {rank.storeName}
                          </span>
                        </div>
                        {isSelected ? (
                          <span className="rounded-full bg-indigo-400 px-2 py-0.5 text-[10px] font-bold text-slate-950">
                            Active
                          </span>
                        ) : rank.isBest ? (
                          <span className="rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 px-1.5 py-0.5 text-[10px] font-bold">
                            🏆 Lowest 1-Stop
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">
                            +${rank.diffFromBest.toFixed(2)} vs #1
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex items-baseline justify-between">
                        <span className="text-xl font-black text-white">
                          ${rank.total.toFixed(2)}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          +$
                          {(
                            rank.total -
                            (shoppingPlan.tripComparison.bestTwoStoreSplit?.total ??
                              shoppingPlan.tripComparison.optimalSplitTotal)
                          ).toFixed(2)}{' '}
                          vs split
                        </span>
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          </div>
        </div>
      </section>

      {/* v1.2 Ticket #23: Export to Notes / Keep & Printable Slip Action Bar */}
      <section className="rounded-2xl border border-emerald-300 bg-emerald-50/70 p-4 shadow-2xs no-print">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">
              1-Tap Curbside Cart Bridge &amp; Multi-Store Checklist Export (Ticket #23)
            </h3>
            <p className="text-xs text-slate-600">
              Export your aisle-grouped checklist to Apple Notes, Google Keep, or Reminders—or use the 1-tap curbside search links below to load Walmart, Target, Kroger, or Instacart carts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyShoppingListForNotes}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
            >
              {copiedChecklist ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Copied for Apple Notes / Keep!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Export to Notes / Keep (By Aisle)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowPrintSlipModal(!showPrintSlipModal)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100 transition"
            >
              <Printer className="h-4 w-4 text-slate-700" />
              <span>
                {showPrintSlipModal
                  ? 'Hide Printable Slip'
                  : 'Preview Printable Slip'}
              </span>
            </button>

            <button
              type="button"
              onClick={handlePrintShoppingSlip}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
            >
              <Printer className="h-4 w-4" />
              <span>Print Checklist</span>
            </button>
          </div>
        </div>
      </section>

      {/* v1.2 Ticket #23: High-Contrast Printable Shopping Slip */}
      {showPrintSlipModal && (
        <PrintSlip
          cityLabel={data.cityLabel}
          currentZip={currentZip}
          adCycleLabel={data.adCycleLabel}
          dishCount={activeTrio.length}
          totalServings={trioTotals.totalServings}
          tripComparison={shoppingPlan.tripComparison}
          items={resolvedShoppingItems}
        />
      )}

      {/* Digital Coupon Pre-Flight Checklist (Grouped by Store App - v1.1) */}
      {digitalCouponItems.length > 0 && (
        <section className="rounded-2xl border border-amber-300 bg-amber-50/70 p-4 sm:p-5 shadow-2xs no-print">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-white">
                <Smartphone className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-extrabold text-amber-950 sm:text-base">
                  Digital Coupon Pre-Flight Checklist ({digitalCouponItems.length}{' '}
                  Coupons to Clip)
                </h3>
                <p className="text-xs text-amber-800">
                  Clip these in the respective store app before checkout to guarantee advertised promotional pricing.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 space-y-4">
            {Array.from(
              digitalCouponItems
                .reduce((acc, cItem) => {
                  const def = getStoreDefinition(cItem.activeStore);
                  const appName =
                    def.couponAppLabel ||
                    `${resolveStoreBanner(cItem.activeStore, currentZip)} App`;
                  const list = acc.get(appName) || [];
                  list.push(cItem);
                  acc.set(appName, list);
                  return acc;
                }, new Map<string, typeof digitalCouponItems>())
                .entries()
            ).map(([appName, appItems]) => (
              <div
                key={appName}
                className="rounded-xl border border-amber-200/80 bg-white/70 p-3"
              >
                <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-amber-100">
                  <Smartphone className="h-3.5 w-3.5 text-amber-700" />
                  <span className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                    {appName} ({appItems.length}{' '}
                    {appItems.length === 1 ? 'coupon' : 'coupons'})
                  </span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {appItems.map((cItem) => {
                    const couponKey = `${cItem.activeStore}-${cItem.ingredientId}`;
                    const isClipped = Boolean(clippedCoupons[couponKey]);
                    return (
                      <div
                        key={couponKey}
                        onClick={() => toggleClippedCoupon(couponKey)}
                        className={`flex cursor-pointer items-center justify-between rounded-xl border p-2.5 transition ${
                          isClipped
                            ? 'border-emerald-300 bg-emerald-50/80 opacity-80'
                            : 'border-amber-200 bg-white hover:border-amber-400'
                        }`}
                      >
                        <div className="space-y-0.5 pr-2">
                          <div className="flex items-center gap-1.5">
                            {renderStoreBadge(cItem.activeStore, currentZip)}
                            <span className="text-xs font-bold text-slate-900">
                              {cItem.ingredientName}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-amber-900">
                            {cItem.activeRawDealText}
                          </p>
                          {cItem.activeDealConditions && (
                            <p className="text-[11px] text-slate-600">
                              {cItem.activeDealConditions}
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold ${
                            isClipped
                              ? 'bg-emerald-600 text-white'
                              : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                          }`}
                        >
                          {isClipped ? (
                            <>
                              <Check className="h-3.5 w-3.5" /> Clipped
                            </>
                          ) : (
                            <>
                              <Smartphone className="h-3.5 w-3.5" /> Clip
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Aggregated & Deduplicated Shopping List with 1-Tap Curbside Links */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 sm:text-lg">
              Deduplicated 3-Dish Shopping List ({resolvedShoppingItems.length + shoppingPlan.pantryNeeds.length} Ingredients to Buy)
            </h3>
            <p className="text-xs text-slate-500">
              Overlapping ingredients across your 3 batch dishes are automatically combined. Click any 1-tap curbside link to open the item directly in Walmart, Target, Kroger, or Instacart.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-2.5">
          {resolvedShoppingItems.map((item) => {
            const isChecked = Boolean(checkedItems[item.ingredientId]);
            const { primaryLink, bridgeLinks } = getItemCurbsideLinks(
              item.activeStore,
              item.ingredientName,
              currentZip
            );

            return (
              <div
                key={item.ingredientId}
                className={`flex flex-col justify-between gap-2.5 rounded-xl border p-3.5 transition lg:flex-row lg:items-center ${
                  item.isOnHand
                    ? 'border-sky-300 bg-sky-50/50'
                    : isChecked
                      ? 'border-slate-200 bg-slate-50 opacity-60'
                      : 'border-slate-200 bg-white hover:border-emerald-400'
                }`}
              >
                <div className="flex flex-1 items-start gap-3">
                  <button
                    type="button"
                    onClick={() => toggleCheckedItem(item.ingredientId)}
                    className="mt-0.5 text-emerald-600"
                  >
                    {isChecked ? (
                      <CheckSquare className="h-5 w-5" />
                    ) : (
                      <Square className="h-5 w-5 text-slate-400" />
                    )}
                  </button>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {item.isOnHand ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-sky-600 px-2 py-0.5 text-xs font-bold text-white">
                          <Snowflake className="h-3 w-3" /> Already have
                        </span>
                      ) : (
                        renderStoreBadge(item.activeStore, currentZip)
                      )}
                      <span
                        onClick={() => toggleCheckedItem(item.ingredientId)}
                        className={`cursor-pointer text-sm font-bold ${
                          isChecked
                            ? 'line-through text-slate-500'
                            : 'text-slate-900'
                        }`}
                      >
                        {item.ingredientName}
                      </span>
                      {!item.isOnHand && renderDealBadge(item.activeDealType)}
                    </div>
                    <p className="text-xs text-slate-600">
                      <strong>
                        Total Needed: {item.totalQuantityNeeded} {item.unit}
                      </strong>{' '}
                      • Used in:{' '}
                      {item.usedInDishes
                        .map((u) => `${u.dishTitle} (${u.quantity} ${item.unit})`)
                        .join(' + ')}
                    </p>

                    {/* v1.2 Ticket #23: Direct 1-Tap Curbside Search Links */}
                    {!item.isOnHand && (
                      <div className="pt-1 flex flex-wrap items-center gap-1.5 no-print">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          1-Tap Curbside:
                        </span>
                        <a
                          href={primaryLink.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            backgroundColor: primaryLink.brandColor,
                            color: '#ffffff',
                          }}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold shadow-2xs hover:opacity-90"
                        >
                          <span>🛒 {primaryLink.shortLabel}</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                        {bridgeLinks
                          .filter((b) => b.provider !== primaryLink.provider)
                          .map((link) => (
                            <a
                              key={link.provider}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-100"
                            >
                              <span>{link.shortLabel}</span>
                              <ExternalLink className="h-2.5 w-2.5 text-slate-400" />
                            </a>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-2 lg:border-none lg:pt-0 lg:text-right">
                  <button
                    type="button"
                    onClick={() => handleToggleOnHand(item.ingredientId)}
                    className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold transition no-print ${
                      item.isOnHand
                        ? 'border-sky-500 bg-sky-600 text-white'
                        : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {item.isOnHand ? '❄️ On-Hand ($0)' : 'Have at Home?'}
                  </button>

                  <div className="text-xs text-slate-500">
                    <div>{item.activeRawDealText}</div>
                  </div>
                  <div className="text-base font-extrabold text-emerald-700 min-w-[60px] text-right">
                    ${item.activeTotalCost.toFixed(2)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {<p className="mt-4 text-xs text-slate-600">Estimated additional grocery cost assumes marked ingredients are on hand. Staple estimates allocate recipe use; package checkout totals may differ.
          {shoppingPlan.tripComparison.includesStaticPantryEstimates && ' Includes static estimates.'}
          {shoppingPlan.tripComparison.additionalCostEstimateComplete === false && ' Known subtotal only — plus unpriced ingredients.'}</p>}
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            {'Staples to buy — recipe-use estimates (Est. $'}
            {shoppingPlan.tripComparison.estimatedPantryTotal.toFixed(2)} total across 3 dishes)
          </h4>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {shoppingPlan.pantryChecklist.map((pantryItem) => {
              const pKey = `pantry-${pantryItem}`;
              const pChecked = Boolean(checkedItems[pKey]);
              return (
                <button
                  key={pKey}
                  type="button"
                  onClick={() => toggleCheckedItem(pKey)}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                    pChecked
                      ? 'border-emerald-300 bg-emerald-100/70 text-emerald-900 line-through'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {pChecked ? (
                    <Check className="h-3 w-3 text-emerald-700" />
                  ) : null}
                  <span>{pantryItem}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
