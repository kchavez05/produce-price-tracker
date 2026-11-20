'use client';

import { Check, Pin, Snowflake } from 'lucide-react';
import { Badge, Button, Card } from '@/components/ui';
import { renderStoreBadge } from '@/modules/shop/badges';
import {
  useDashboardContext, useLocationContext, usePreferencesContext, useShellContext,
} from '@/modules/shell/app-context';

// v2.0 M4-3a (wireframe Shop): one Stock-Up Alert above the list, for the deepest discount among the stock-up alerts. The
// old strip of up to four dark cards is gone; the other alerts are in the list below with their own "Buy 2" action.
export default function BoardAlerts() {
  const { data } = useDashboardContext();
  const { currentZip } = useLocationContext();
  const { pinnedIds, handleTogglePin } = usePreferencesContext();
  const { handleReviewStockUp } = useShellContext();
  if (data.splurgeAlerts.length === 0) return null;
  const item = data.splurgeAlerts.reduce((best, next) => (next.discountVsRegularPct > best.discountVsRegularPct ? next : best));
  const pinned = pinnedIds.includes(item.ingredient.id);
  return (
    <Card as="section" aria-labelledby="stock-up-alert" className="bg-chip">
      <div className="flex items-center justify-between gap-2">
        <h2 id="stock-up-alert" className="text-sm font-bold text-ink">Stock-Up Alert</h2>
        <Badge tone="save">-{item.discountVsRegularPct}% off</Badge>
      </div>
      <p className="mt-1 text-sm text-muted">
        Deepest stock-up deal: {item.ingredient.name} at {renderStoreBadge(item.bestOffer.store, currentZip)} for ${item.bestOffer.normalizedPricePerUnit.toFixed(2)}/{item.ingredient.standardUnit}
        {' '}(regular ${item.bestOffer.regularPricePerUnit.toFixed(2)}).
        {item.clubBenchmark?.beatsClubBulk && <> Beats {item.clubBenchmark.bestClubName} bulk by {item.clubBenchmark.savingsVsClubPct}%.</>}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button variant={pinned ? 'secondary' : 'primary'} onClick={() => handleTogglePin(item.ingredient.id)}>
          {pinned ? <><Check aria-hidden="true" className="size-4" /><span>Pinned</span></> : <><Pin aria-hidden="true" className="size-4" /><span>Pin to Prep</span></>}
        </Button>
        {item.arbitragePrompt?.eligible && (
          <Button variant="secondary" onClick={() => handleReviewStockUp()}>
            <Snowflake aria-hidden="true" className="size-4" />
            <span>Buy 2: Prep 1, Freeze 1 (Save ${item.arbitragePrompt.futureWeekSavings.toFixed(2)})</span>
          </Button>
        )}
      </div>
    </Card>
  );
}
