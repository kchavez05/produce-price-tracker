'use client';

import { ChevronLeft } from 'lucide-react';
import { Badge, EmptyState } from '@/components/ui';
import DealActions from '@/modules/shop/DealActions';
import DealDetails from '@/modules/shop/DealDetails';
import AppLink from '@/modules/shell/AppLink';
import { renderStoreBadge } from '@/modules/shop/badges';
import { useDashboardContext, useLocationContext } from '@/modules/shell/app-context';

// v2.0 M4-3a (wireframes Shop Deal Detail and iPad Shop): one deal in full. Below 1024 px it is its own screen, with a Back
// link to Deals; from 1024 px it is the pane beside the list, which has no Back. It is found by ingredient id among all the
// deals, not the filtered list, so a category or store filter does not hide the deal the user opened. A deal that is gone (the
// prices were refreshed, or the link is old) says so and offers the way back.
export default function DealDetailView({ dealId }: { dealId: string }) {
  const { data } = useDashboardContext();
  const { currentZip } = useLocationContext();
  const item = data.commodities.find((commodity) => commodity.ingredient.id === dealId);
  const back = (
    <AppLink to={{ module: 'shop', view: 'BOARD' }} className="inline-flex min-h-touch items-center gap-1 text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus wide:hidden">
      <ChevronLeft aria-hidden="true" className="size-5" />
      <span>Deals</span>
    </AppLink>
  );
  if (!item) {
    return (
      <div>
        {back}
        <EmptyState
          title="This deal is not available"
          description="It may have changed in the latest prices, or the link is old. Go back to Deals to see what is on sale now."
          action={<AppLink to={{ module: 'shop', view: 'BOARD' }} className="inline-flex min-h-touch items-center text-accent underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">Show Deals</AppLink>}
        />
      </div>
    );
  }
  const { ingredient, bestOffer } = item;
  return (
    <article aria-label={`${ingredient.name}, Deal Detail`} className="space-y-3">
      {back}
      <div className="flex items-center justify-between gap-2">
        {renderStoreBadge(bestOffer.store, currentZip)}
        {item.discountVsRegularPct > 0 && <Badge tone="save">-{item.discountVsRegularPct}% off</Badge>}
      </div>
      <h2 className="text-xl font-bold text-ink">{ingredient.name}</h2>
      <p className="flex flex-wrap items-baseline gap-x-1.5">
        <span className="text-3xl font-extrabold text-ink">${bestOffer.normalizedPricePerUnit.toFixed(2)}</span>
        <span className="text-sm text-muted">
          /{ingredient.standardUnit}
          {item.discountVsRegularPct > 0 && !(item.comparisonEvidence && !bestOffer.regularPriceEvidence) && <> · was ${bestOffer.regularPricePerUnit.toFixed(2)}</>}
          {' · '}{bestOffer.rawPriceText}
        </span>
      </p>
      <div className="space-y-2"><DealActions item={item} /></div>
      <h3 className="pt-1 text-sm font-bold uppercase tracking-wide text-muted">Price history and comparison</h3>
      <DealDetails item={item} />
    </article>
  );
}
