'use client';

import { Check, ChevronDown, Pin, Snowflake } from 'lucide-react';
import { Badge, Button, Card } from '@/components/ui';
import { recipePantryIngredientId } from '@/lib/pantry/recipe-identity';
import DealDetails from '@/modules/shop/DealDetails';
import { renderStoreBadge } from '@/modules/shop/badges';
import {
  useAccountContext, useLocationContext, usePreferencesContext, useShellContext,
} from '@/modules/shell/app-context';
import type { ScoredCommodity } from '@/types/domain';

// v2.0 M4-3a (wireframe Shop): one deal. The headline is the store, the discount, the name, the price and what it was, and
// the club comparison when it wins. "Pin to Prep" is the primary action (owner decision, M4-3a: keep today's label) and
// "Have it" is a quiet toggle, so a screen full of cards is not a screen full of equal buttons. The rest of what the old card
// showed is behind "Details" until the Deal Detail screen takes it over. Pinned and have-it state is also in the text and
// aria-pressed, never only a colour.
export default function DealCard({ item }: { item: ScoredCommodity }) {
  const { currentZip } = useLocationContext();
  const { pinnedIds, handleTogglePin } = usePreferencesContext();
  const { effectiveOnHandIds } = useAccountContext();
  const { handleToggleOnHand, handleReviewStockUp } = useShellContext();
  const { ingredient, bestOffer } = item;
  const pinned = pinnedIds.includes(ingredient.id);
  const haveIt = effectiveOnHandIds.includes(recipePantryIngredientId(ingredient.id));
  const club = item.clubBenchmark?.beatsClubBulk ? item.clubBenchmark : null;
  return (
    <Card as="article" aria-label={ingredient.name} className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        {renderStoreBadge(bestOffer.store, currentZip)}
        {item.discountVsRegularPct > 0 && <Badge tone="save">-{item.discountVsRegularPct}% off</Badge>}
      </div>
      <h3 className="text-base font-bold text-ink">{ingredient.name}</h3>
      <p className="flex flex-wrap items-baseline gap-x-1.5">
        <span className="text-2xl font-extrabold text-ink">${bestOffer.normalizedPricePerUnit.toFixed(2)}</span>
        <span className="text-sm text-muted">
          /{ingredient.standardUnit}
          {item.discountVsRegularPct > 0 && !(item.comparisonEvidence && !bestOffer.regularPriceEvidence) && <> · was ${bestOffer.regularPricePerUnit.toFixed(2)}</>}
        </span>
      </p>
      <p className="text-sm text-muted">{bestOffer.rawPriceText}</p>
      {club && <p className="text-sm font-semibold text-save">Beats {club.bestClubName} bulk by {club.savingsVsClubPct}%</p>}

      <div className="mt-1 flex items-center gap-2">
        <Button
          variant={pinned ? 'secondary' : 'primary'}
          className="flex-1"
          onClick={() => handleTogglePin(ingredient.id)}
        >
          {pinned ? <><Check aria-hidden="true" className="size-4" /><span>Pinned</span></> : <><Pin aria-hidden="true" className="size-4" /><span>Pin to Prep</span></>}
        </Button>
        <Button
          variant="quiet"
          aria-pressed={haveIt}
          onClick={() => handleToggleOnHand(ingredient.id)}
          className={haveIt ? 'text-ink' : 'text-muted'}
        >
          {haveIt && <Check aria-hidden="true" className="size-4" />}
          <span>Have it</span>
        </Button>
      </div>

      {/* v1.2 Ticket #21: "Buy 2: Prep 1, Freeze 1" */}
      {item.arbitragePrompt?.eligible && (
        <Button variant="secondary" onClick={() => handleReviewStockUp()}>
          <Snowflake aria-hidden="true" className="size-4" />
          <span>
            Buy 2: Prep 1, Freeze 1 (+{item.arbitragePrompt.recommendedFreezeQty} {item.arbitragePrompt.unit} @ ${bestOffer.normalizedPricePerUnit.toFixed(2)} • Save ${item.arbitragePrompt.futureWeekSavings.toFixed(2)})
          </span>
        </Button>
      )}

      <details className="group border-t border-border pt-1">
        <summary className="flex min-h-touch cursor-pointer list-none items-center justify-between text-sm font-semibold text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus [&::-webkit-details-marker]:hidden">
          <span>Details<span className="sr-only"> for {ingredient.name}</span></span>
          <ChevronDown aria-hidden="true" className="size-4 transition-transform group-open:rotate-180 motion-reduce:transition-none" />
        </summary>
        <div className="pb-1 pt-2"><DealDetails item={item} /></div>
      </details>
    </Card>
  );
}
