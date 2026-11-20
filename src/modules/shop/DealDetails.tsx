'use client';

import { Award, TrendingDown, TrendingUp } from 'lucide-react';
import { verifiedLocalWeekCount } from '@/lib/market/history-summary';
import { resolveStoreBanner } from '@/data/store-registry';
import { Badge, Button } from '@/components/ui';
import { renderCycleSignalBadge, renderDealBadge } from '@/modules/shop/badges';
import { useLocationContext, usePreferencesContext } from '@/modules/shell/app-context';
import type { ScoredCommodity } from '@/types/domain';

// v2.0 M4-3a: everything the old Board card showed beyond the headline (value score, deal conditions, club comparison, both
// stores' prices, the cycle signal and substitution, the USDA note and the six-week history). The Deals card keeps it behind a
// "Details" disclosure so nothing is lost; the Deal Detail screen (next M4-3a PR) shows the same content as its own page. No
// calculation or wording of the numbers changed in the move.
export default function DealDetails({ item }: { item: ScoredCommodity }) {
  const { currentZip } = useLocationContext();
  const { handleTogglePin } = usePreferencesContext();
  const { ingredient, bestOffer, kingSoopersOffer, safewayOffer } = item;
  const weeks = item.priceHistory ? verifiedLocalWeekCount(item.priceHistory) : 0;
  const stores = [
    { chain: 'KING_SOOPERS' as const, offer: kingSoopersOffer, coupon: 'App Cpn', plain: 'Card' },
    { chain: 'SAFEWAY' as const, offer: safewayOffer, coupon: 'for U Cpn', plain: 'Member' },
  ];
  return (
    <div className="space-y-3 text-sm">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge tone={item.valueScore >= 85 ? 'save' : 'neutral'}>Value {item.valueScore}/100</Badge>
        {item.isSplurgeAlert && <Badge tone="accent">Splurge deal</Badge>}
        {renderDealBadge(bestOffer.dealType)}
        {renderCycleSignalBadge(item)}
        {item.clubBenchmark?.beatsClubBulk && (
          <Badge tone="save"><Award aria-hidden="true" className="mr-1 size-3" />Beats {item.clubBenchmark.bestClubName} bulk (-{item.clubBenchmark.savingsVsClubPct}%)</Badge>
        )}
      </div>
      {bestOffer.dealConditions && <p className="text-muted">{bestOffer.dealConditions}</p>}

      <div className="text-muted">
        <p>
          {item.comparisonEvidence && !bestOffer.regularPriceEvidence
            ? 'Regular comparison unavailable'
            : <>Regular: ${bestOffer.regularPricePerUnit.toFixed(2)}/{ingredient.standardUnit}</>}
        </p>
        <p>
          {item.comparisonEvidence
            ? 'Comparison unavailable: history does not verify this food.'
            : <>{item.usdaBenchmark?.region === 'NATIONAL' ? 'USDA national retail' : item.usdaBenchmark?.region === 'MOUNTAIN' ? 'USDA Mountain retail' : 'Estimated baseline'}: ${ingredient.mountainBaselinePerUnit.toFixed(2)}/{ingredient.standardUnit}</>}
        </p>
        {!item.comparisonEvidence && item.usdaBenchmark?.periodEnd && (
          <p>Week ending {item.usdaBenchmark.periodEnd} • {item.usdaBenchmark.status}. Checked {item.usdaBenchmark.checkedAt?.slice(0, 10)}</p>
        )}
      </div>

      {item.clubBenchmark && (
        <div className="rounded-control bg-chip p-2">
          <p className="flex flex-wrap justify-between gap-x-3 font-semibold text-ink">
            <span>Costco bulk: ${item.clubBenchmark.costcoPricePerUnit.toFixed(2)}/{ingredient.standardUnit}</span>
            <span>Sam&apos;s Club: ${item.clubBenchmark.samsClubPricePerUnit.toFixed(2)}/{ingredient.standardUnit}</span>
          </p>
          <p className="mt-0.5 text-xs font-semibold text-muted">{item.clubBenchmark.verdictLabel}</p>
        </div>
      )}

      <dl className="grid grid-cols-2 gap-2">
        {stores.map(({ chain, offer, coupon, plain }) => (
          <div key={chain} className={`rounded-control p-2 ${bestOffer.store === chain ? 'bg-save-bg text-ink' : 'bg-chip text-muted'}`}>
            <dt className="text-xs font-semibold uppercase tracking-wide">{resolveStoreBanner(chain, currentZip)}{bestOffer.store === chain ? ' (best)' : ''}</dt>
            <dd>
              {offer
                ? <>${offer.normalizedPricePerUnit.toFixed(2)}/{ingredient.standardUnit} <span className="text-xs font-normal">({offer.source === 'CURATED_FALLBACK' ? 'Estimate' : offer.dealType === 'DIGITAL_COUPON' ? coupon : plain})</span></>
                : 'N/A'}
            </dd>
          </div>
        ))}
      </dl>

      {item.cycleSignal?.status === 'CYCLE_PEAK_WAIT' && item.cycleSignal.substitutionSuggestion && (
        <div className="rounded-control bg-danger-bg p-2 text-danger">
          <p className="font-semibold">Smart cycle substitution</p>
          <p>{item.cycleSignal.substitutionSuggestion.reason}</p>
          <Button
            variant="secondary"
            className="mt-1"
            onClick={() => handleTogglePin(item.cycleSignal!.substitutionSuggestion!.substituteIngredientId)}
          >
            Pin {item.cycleSignal.substitutionSuggestion.substituteName.split(' ')[0]} instead
          </Button>
        </div>
      )}

      <p className="flex items-start gap-1.5 text-muted">
        {ingredient.usdaSignal.wholesaleChangePct <= 0
          ? <TrendingDown aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-save" />
          : <TrendingUp aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />}
        <span>
          <strong className="text-ink">USDA wholesale ({ingredient.usdaSignal.wholesaleChangePct > 0 ? '+' : ''}{ingredient.usdaSignal.wholesaleChangePct}%):</strong>{' '}
          {ingredient.usdaSignal.note}
        </span>
      </p>

      {/* The six-week history of verified local prices (v0.2 and v1.2 SQLite history) */}
      {!item.comparisonEvidence && item.priceHistory && weeks > 0 && (
        <div className="rounded-control bg-chip p-2">
          <div className="flex flex-wrap items-center justify-between gap-1 text-xs">
            <span className="font-semibold text-ink">
              6-week range: floor ${item.sixWeekLow.toFixed(2)} • median ${(item.sixWeekMedian ?? item.sixWeekLocalAvg).toFixed(2)} • peak ${(item.sixWeekHigh ?? item.sixWeekLocalAvg).toFixed(2)}
            </span>
            {weeks >= 6 && bestOffer.source !== 'CURATED_FALLBACK' && bestOffer.normalizedPricePerUnit <= item.sixWeekLow + 0.02 && (
              <Badge tone="save">6-week floor</Badge>
            )}
          </div>
          <div className="mt-1.5 grid h-10 grid-cols-6 items-end gap-1 pt-1">
            {item.priceHistory.map((pt) => {
              if (pt.bestLocalPrice === null) return <div key={pt.weekStart} title={`${pt.label}: No verified local price`} className="text-center text-xs text-muted">—</div>;
              const maxP = Math.max(...item.priceHistory.map((h) => h.bestLocalPrice ?? 0), 1);
              const heightPct = Math.max(22, Math.round((pt.bestLocalPrice / maxP) * 100));
              const isCurrent = pt.weekStart === item.priceHistory.at(-1)?.weekStart;
              return (
                <div
                  key={pt.weekStart}
                  className="flex h-full flex-col items-center justify-end"
                  title={`${pt.label}: Best $${pt.bestLocalPrice.toFixed(2)} (KS $${pt.kingSoopersPrice?.toFixed(2) ?? '—'} | SW $${pt.safewayPrice?.toFixed(2) ?? '—'})`}
                >
                  <div style={{ height: `${heightPct}%` }} className={`w-full rounded-t ${isCurrent ? 'bg-save' : 'bg-border-strong'}`} />
                  <span className="mt-0.5 text-[10px] leading-none text-muted">${pt.bestLocalPrice.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
