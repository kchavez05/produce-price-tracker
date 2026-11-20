'use client';

import { Badge, Card } from '@/components/ui';
import DealActions from '@/modules/shop/DealActions';
import AppLink from '@/modules/shell/AppLink';
import { renderStoreBadge } from '@/modules/shop/badges';
import { useLocationContext } from '@/modules/shell/app-context';
import type { ScoredCommodity } from '@/types/domain';

// v2.0 M4-3a (wireframe Shop): one deal. The headline is the store, the discount, the name, the price and what it was, and
// the club comparison when it wins. The name is the link to Deal Detail (a 44 px target); everything else the old card showed is
// on that screen. On a wide screen the selected deal is marked with aria-current and its detail is the pane beside the list.
export default function DealCard({ item, selected = false }: { item: ScoredCommodity; selected?: boolean }) {
  const { currentZip } = useLocationContext();
  const { ingredient, bestOffer } = item;
  const club = item.clubBenchmark?.beatsClubBulk ? item.clubBenchmark : null;
  return (
    <Card as="article" aria-label={ingredient.name} className={`flex flex-col gap-2 ${selected ? 'ring-2 ring-accent' : ''}`}>
      <div className="flex items-center justify-between gap-2">
        {renderStoreBadge(bestOffer.store, currentZip)}
        {item.discountVsRegularPct > 0 && <Badge tone="save">-{item.discountVsRegularPct}% off</Badge>}
      </div>
      <h3 className="text-base font-bold text-ink">
        <AppLink
          to={{ module: 'shop', view: 'BOARD', deal: ingredient.id }}
          aria-current={selected ? 'page' : undefined}
          className="flex min-h-touch items-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          {ingredient.name}
        </AppLink>
      </h3>
      <p className="flex flex-wrap items-baseline gap-x-1.5">
        <span className="text-2xl font-extrabold text-ink">${bestOffer.normalizedPricePerUnit.toFixed(2)}</span>
        <span className="text-sm text-muted">
          /{ingredient.standardUnit}
          {item.discountVsRegularPct > 0 && !(item.comparisonEvidence && !bestOffer.regularPriceEvidence) && <> · was ${bestOffer.regularPricePerUnit.toFixed(2)}</>}
        </span>
      </p>
      <p className="text-sm text-muted">{bestOffer.rawPriceText}</p>
      {club && <p className="text-sm font-semibold text-save">Beats {club.bestClubName} bulk by {club.savingsVsClubPct}%</p>}
      <div className="mt-1 space-y-2"><DealActions item={item} /></div>
    </Card>
  );
}
