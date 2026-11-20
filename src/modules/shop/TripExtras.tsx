'use client';

import { Check, Copy, Printer, Smartphone } from 'lucide-react';
import { Button, Card, Chip } from '@/components/ui';
import { focusRing } from '@/components/ui/cx';
import { getStoreDefinition, resolveStoreBanner } from '@/data/store-registry';
import { renderStoreBadge } from '@/modules/shop/badges';
import { useDashboardContext, useLocationContext, useShopContext } from '@/modules/shell/app-context';

// v2.0 M4-3b (wireframe Shop Trip): what goes with the list. Coupons to clip is a disclosure row (the digital-coupon
// pre-flight, grouped by store app, each with a Clip toggle), the actions are Export to Notes (primary), Print Slip and
// Preview Slip, and the staples are chips. State and handlers are the Shop's, unchanged: the same keys, storage and timers.

export function TripCoupons() {
  const { digitalCouponItems } = useDashboardContext();
  const { currentZip } = useLocationContext();
  const { clippedCoupons, toggleClippedCoupon } = useShopContext();
  if (digitalCouponItems.length === 0) return null;
  const byApp = new Map<string, typeof digitalCouponItems>();
  for (const item of digitalCouponItems) {
    const appName = getStoreDefinition(item.activeStore).couponAppLabel || `${resolveStoreBanner(item.activeStore, currentZip)} App`;
    byApp.set(appName, [...(byApp.get(appName) ?? []), item]);
  }
  return (
    <Card as="section" padding="none" aria-label="Coupons to clip" className="no-print">
      <details>
        <summary className={`flex min-h-touch cursor-pointer list-none items-center justify-between rounded-card px-4 text-base font-semibold text-ink ${focusRing}`}>
          <span>Coupons to Clip ({digitalCouponItems.length})</span>
          <span className="text-sm font-normal text-muted">Review</span>
        </summary>
        <div className="space-y-4 px-4 pb-4">
          <p className="text-sm text-muted">Clip these in the store app before checkout to get the advertised price.</p>
          {[...byApp.entries()].map(([appName, appItems]) => (
            <div key={appName}>
              <h3 className="flex items-center gap-1.5 text-sm font-bold text-ink">
                <Smartphone aria-hidden="true" className="size-4" />
                {appName} ({appItems.length} {appItems.length === 1 ? 'coupon' : 'coupons'})
              </h3>
              <ul className="mt-1 divide-y divide-border">
                {appItems.map((item) => {
                  const key = `${item.activeStore}-${item.ingredientId}`;
                  const clipped = Boolean(clippedCoupons[key]);
                  return (
                    <li key={key} className="flex items-center justify-between gap-3 py-2">
                      <div className="min-w-0 space-y-0.5 text-sm">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {renderStoreBadge(item.activeStore, currentZip)}
                          <span className="font-semibold text-ink">{item.ingredientName}</span>
                        </div>
                        <p className="text-muted">{item.activeRawDealText}</p>
                        {item.activeDealConditions && <p className="text-xs text-muted">{item.activeDealConditions}</p>}
                      </div>
                      <Button variant="secondary" aria-pressed={clipped} className="shrink-0" onClick={() => toggleClippedCoupon(key)}>
                        {clipped ? <><Check aria-hidden="true" className="size-4" />Clipped</> : 'Clip'}
                        <span className="sr-only"> {item.ingredientName}</span>
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </details>
    </Card>
  );
}

export function TripActions() {
  const { copiedChecklist, showPrintSlipModal, setShowPrintSlipModal, handleCopyShoppingListForNotes, handlePrintShoppingSlip } = useShopContext();
  return (
    <div className="no-print flex flex-wrap items-center gap-2">
      <Button variant="primary" className="flex-1" onClick={handleCopyShoppingListForNotes}>
        {copiedChecklist
          ? <><Check aria-hidden="true" className="size-4" /><span>Copied for Apple Notes / Keep!</span></>
          : <><Copy aria-hidden="true" className="size-4" /><span>Export to Notes</span></>}
      </Button>
      <Button variant="secondary" onClick={handlePrintShoppingSlip}>
        <Printer aria-hidden="true" className="size-4" /><span>Print Slip</span>
      </Button>
      <Button variant="quiet" aria-expanded={showPrintSlipModal} onClick={() => setShowPrintSlipModal(!showPrintSlipModal)}>
        {showPrintSlipModal ? 'Hide Slip' : 'Preview Slip'}
      </Button>
    </div>
  );
}

export function TripStaples() {
  const { shoppingPlan } = useDashboardContext();
  const { checkedItems, toggleCheckedItem } = useShopContext();
  const trip = shoppingPlan.tripComparison;
  return (
    <Card as="section" aria-labelledby="trip-staples" className="no-print">
      <h2 id="trip-staples" className="text-sm font-bold text-ink">
        Staples to buy: recipe-use estimates (Est. ${trip.estimatedPantryTotal.toFixed(2)} across 3 dishes)
      </h2>
      <p className="mt-1 text-xs text-muted">
        Estimated additional grocery cost assumes marked ingredients are on hand. Staple estimates allocate recipe use; package checkout totals may differ.
        {trip.includesStaticPantryEstimates && ' Includes static estimates.'}
        {trip.additionalCostEstimateComplete === false && ' Known subtotal only — plus unpriced ingredients.'}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {shoppingPlan.pantryChecklist.map((pantryItem) => {
          const key = `pantry-${pantryItem}`;
          const checked = Boolean(checkedItems[key]);
          return (
            <Chip key={key} selected={checked} onClick={() => toggleCheckedItem(key)} className={checked ? 'line-through' : ''}>
              {checked && <Check aria-hidden="true" className="mr-1 size-4" />}{pantryItem}
            </Chip>
          );
        })}
      </div>
    </Card>
  );
}
