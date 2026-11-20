'use client';

import { Card, Chip } from '@/components/ui';
import { useDashboardContext, useShopContext } from '@/modules/shell/app-context';

// v2.0 M4-3b (wireframe Shop Trip): the Best Plan card and the choice of plan. The card says what the recommended plan is and
// what it costs; below it a row of chips chooses which plan the list and the export follow (the split, or one store), through
// the same `tripMode` state as before. Prices and savings are the numbers the old banner showed, not recalculated.
export default function TripPlan() {
  const { shoppingPlan } = useDashboardContext();
  const { tripMode, setTripMode } = useShopContext();
  const trip = shoppingPlan.tripComparison;
  const splitTotal = trip.bestTwoStoreSplit?.total ?? trip.optimalSplitTotal;
  return (
    <Card as="section" aria-labelledby="trip-plan" className="no-print space-y-3 bg-chip">
      <div>
        <h2 id="trip-plan" className="text-base font-bold text-ink">Best plan</h2>
        <p className="mt-1 text-lg font-bold text-ink">{trip.recommendationHeadline}</p>
        <p className="mt-1 text-sm text-muted">
          {trip.recommendationDetail}
          {' Estimated additional grocery cost assumes marked ingredients are on hand. Staple rows identify the price basis; package checkout totals may differ.'}
          {trip.additionalCostEstimateComplete === false && ' Known subtotal only — plus ingredients with no price.'}
        </p>
        <p className="mt-2 text-sm text-ink">
          <span className="font-bold">${splitTotal.toFixed(2)}</span> with the best split
          {' · '}saves ${(trip.regularShelfTotal - splitTotal).toFixed(2)} vs regular shelf prices (${trip.regularShelfTotal.toFixed(2)})
        </p>
      </div>
      <div role="group" aria-label="Plan" className="-mx-4 flex gap-2 overflow-x-auto px-4">
        <Chip selected={tripMode === 'SPLIT'} onClick={() => setTripMode('SPLIT')} className="shrink-0">
          {trip.bestTwoStoreSplit?.storeNames.join(' + ') || 'Best split'} · ${splitTotal.toFixed(2)}
        </Chip>
        {(trip.singleStoreRankings || []).map((rank) => (
          <Chip key={rank.store} selected={tripMode === rank.store} onClick={() => setTripMode(rank.store)} className="shrink-0">
            {rank.storeName} only · ${rank.total.toFixed(2)}{rank.isBest ? ' (lowest 1-stop)' : ` (+$${rank.diffFromBest.toFixed(2)})`}
          </Chip>
        ))}
      </div>
    </Card>
  );
}
