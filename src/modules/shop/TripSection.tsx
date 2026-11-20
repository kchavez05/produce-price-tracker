'use client';

import { EmptyState } from '@/components/ui';
import type { buildShoppingListAndStoreComparison } from '@/lib/shopping-list';
import type { DealType, StoreChain } from '@/types/domain';
import AppLink from '@/modules/shell/AppLink';
import PrintSlip from '@/modules/shop/PrintSlip';
import TripItems from '@/modules/shop/TripItems';
import TripPlan from '@/modules/shop/TripPlan';
import { TripActions, TripCoupons, TripStaples } from '@/modules/shop/TripExtras';
import { useDashboardContext, useLocationContext, useShopContext } from '@/modules/shell/app-context';

// v2.0 M4-3b (wireframes Shop Trip, Empty Trip and the iPad Trip boards): the Trip view. Compact, it reads top to bottom: the Best
// Plan card, the list by store, coupons to clip, the actions and the staples. From 1024 px it is two columns, the list on the
// left (380 px) and the plan, coupons, actions and staples on the right. When there is nothing to buy it is the empty state.
// The state (checked items, clipped coupons, the plan, the copied flag, the slip) and every handler are the Shop's, unchanged.

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

const LINK = 'inline-flex min-h-touch items-center justify-center rounded-control px-4 text-base font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';

export default function TripSection() {
  const { data, shoppingPlan, resolvedShoppingItems, activeTrio, trioTotals } = useDashboardContext();
  const { currentZip } = useLocationContext();
  const { showPrintSlipModal } = useShopContext();

  if (resolvedShoppingItems.length === 0 && shoppingPlan.pantryChecklist.length === 0) {
    return (
      <EmptyState
        title="Your Trip Is Empty"
        description="Add deals from Deals, or add the missing ingredients from a dish in Plan."
        action={(
          <div className="flex flex-col gap-2">
            <AppLink to={{ module: 'shop', view: 'BOARD' }} className={`${LINK} bg-accent text-on-accent`}>Browse Deals</AppLink>
            <AppLink to={{ module: 'plan' }} className={`${LINK} border border-border-strong bg-surface text-ink`}>Go to Plan</AppLink>
          </div>
        )}
      />
    );
  }

  return (
    <div className="space-y-4 wide:grid wide:grid-cols-[380px_minmax(0,1fr)] wide:items-start wide:gap-6 wide:space-y-0">
      <div className="wide:col-start-2 wide:row-start-1"><TripPlan /></div>
      <div className="wide:col-start-1 wide:row-span-4 wide:row-start-1"><TripItems /></div>
      <div className="space-y-4 wide:col-start-2 wide:row-start-2">
        <TripCoupons />
        <TripActions />
      </div>
      {/* v1.2 Ticket #23: High-Contrast Printable Shopping Slip */}
      {showPrintSlipModal && (
        <div className="wide:col-span-2">
          <PrintSlip
            cityLabel={data.cityLabel}
            currentZip={currentZip}
            adCycleLabel={data.adCycleLabel}
            dishCount={activeTrio.length}
            totalServings={trioTotals.totalServings}
            tripComparison={shoppingPlan.tripComparison}
            items={resolvedShoppingItems}
          />
        </div>
      )}
      <div className="wide:col-start-2 wide:row-start-3"><TripStaples /></div>
    </div>
  );
}
