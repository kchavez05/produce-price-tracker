'use client';

import { Check, Pin, Snowflake } from 'lucide-react';
import { Button } from '@/components/ui';
import { recipePantryIngredientId } from '@/lib/pantry/recipe-identity';
import { useAccountContext, usePreferencesContext, useShellContext } from '@/modules/shell/app-context';
import type { ScoredCommodity } from '@/types/domain';

// v2.0 M4-3a: the actions on a deal, shared by the Deals card and Deal Detail so they cannot drift apart. "Pin to Prep" is
// primary (owner decision, M4-3a: keep today's label) and "Have it" is a quiet toggle. State is in the text and aria-pressed,
// never only a colour.
export default function DealActions({ item }: { item: ScoredCommodity }) {
  const { pinnedIds, handleTogglePin } = usePreferencesContext();
  const { effectiveOnHandIds } = useAccountContext();
  const { handleToggleOnHand, handleReviewStockUp } = useShellContext();
  const { ingredient, bestOffer } = item;
  const pinned = pinnedIds.includes(ingredient.id);
  const haveIt = effectiveOnHandIds.includes(recipePantryIngredientId(ingredient.id));
  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant={pinned ? 'secondary' : 'primary'} className="flex-1" onClick={() => handleTogglePin(ingredient.id)}>
          {pinned ? <><Check aria-hidden="true" className="size-4" /><span>Pinned</span></> : <><Pin aria-hidden="true" className="size-4" /><span>Pin to Prep</span></>}
        </Button>
        <Button variant="quiet" aria-pressed={haveIt} onClick={() => handleToggleOnHand(ingredient.id)} className={haveIt ? 'text-ink' : 'text-muted'}>
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
    </>
  );
}
