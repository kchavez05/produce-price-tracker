'use client';

import { Award, Check, DoorOpen, Gem, Pin, Snowflake, TrendingDown, TrendingUp } from 'lucide-react';
import { verifiedLocalWeekCount } from '@/lib/market/history-summary';
import { resolveStoreBanner } from '@/data/store-registry';
import { recipePantryIngredientId } from '@/lib/pantry/recipe-identity';
import { renderCycleSignalBadge, renderDealBadge, renderStoreBadge } from '@/modules/shop/badges';
import type { ScoredCommodity } from '@/types/domain';
import {
  useAccountContext, useDashboardContext, useLocationContext, usePreferencesContext, useShellContext,
} from '@/modules/shell/app-context';

// Moved verbatim from MealPrepDashboard (v2.0 M3 Phase A.3, Board tab). Since Phase B.2a it reads the app's state from the
// context hooks instead of props; the markup is unchanged.

export default function BoardLeaderboard() {
  const { filteredCommodities } = useDashboardContext();
  const { currentZip } = useLocationContext();
  const { pinnedIds, handleTogglePin } = usePreferencesContext();
  const { effectiveOnHandIds } = useAccountContext();
  const { handleToggleOnHand, handleReviewStockUp } = useShellContext();
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {filteredCommodities.map((item: ScoredCommodity) => {
        const isPinned = pinnedIds.includes(item.ingredient.id);
        const isOnHand = effectiveOnHandIds.includes(recipePantryIngredientId(item.ingredient.id));
        const { ingredient, bestOffer, kingSoopersOffer, safewayOffer } = item;

        return (
          <div
            key={ingredient.id}
            className={`flex flex-col justify-between rounded-2xl border bg-white p-4 transition shadow-2xs hover:shadow-md ${
              isPinned
                ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                : isOnHand
                  ? 'border-sky-400 ring-2 ring-sky-400/20'
                  : item.cycleSignal?.status === 'CYCLE_PEAK_WAIT'
                    ? 'border-rose-200 bg-rose-50/15'
                    : 'border-slate-200'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {renderStoreBadge(bestOffer.store, currentZip)}
                  <span className="text-xs font-medium text-slate-500">
                    {ingredient.subcategory}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.isSplurgeAlert && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-bold text-indigo-800">
                      <Gem className="h-3 w-3" /> Splurge Deal
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      item.valueScore >= 85
                        ? 'bg-emerald-100 text-emerald-900'
                        : item.valueScore >= 70
                          ? 'bg-teal-100 text-teal-900'
                          : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    Value {item.valueScore}/100
                  </span>
                </div>
              </div>

              <h3 className="mt-2.5 text-base font-bold text-slate-900">
                {ingredient.name}
              </h3>

              {/* v1.2 Ticket #24 & #25: Cycle Low Signal Badge + Beats Club Bulk Pill */}
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {renderCycleSignalBadge(item)}
                {item.clubBenchmark?.beatsClubBulk && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-900 border border-blue-300">
                    <Award className="h-3 w-3 text-blue-700" />
                    <span>
                      Beats {item.clubBenchmark.bestClubName} Bulk (-
                      {item.clubBenchmark.savingsVsClubPct}%)
                    </span>
                  </span>
                )}
              </div>

              <div className="mt-2 flex items-baseline justify-between rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-extrabold text-slate-900">
                      ${bestOffer.normalizedPricePerUnit.toFixed(2)}
                    </span>
                    <span className="text-xs font-semibold text-slate-600">
                      / {ingredient.standardUnit}
                    </span>
                    {item.discountVsRegularPct > 0 && (
                      <span className="ml-1 rounded-md bg-emerald-600 px-1.5 py-0.5 text-[11px] font-bold text-white">
                        -{item.discountVsRegularPct}%
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs font-medium text-slate-700">
                    {bestOffer.rawPriceText}
                  </p>
                </div>

                <div className="text-right text-[11px] text-slate-500">
                  <div>
                    {item.comparisonEvidence && !bestOffer.regularPriceEvidence ? 'Regular comparison unavailable' : <>Reg: ${bestOffer.regularPricePerUnit.toFixed(2)}/{ingredient.standardUnit}</>}
                  </div>
                  <div>
                    {item.comparisonEvidence ? 'Comparison unavailable: history does not verify this food.' : <>{item.usdaBenchmark?.region === 'NATIONAL' ? 'USDA national retail' : item.usdaBenchmark?.region === 'MOUNTAIN' ? 'USDA Mountain retail' : 'Estimated baseline'}: ${ingredient.mountainBaselinePerUnit.toFixed(2)}/
                    {ingredient.standardUnit}
                    {item.usdaBenchmark?.periodEnd && <div>Week ending {item.usdaBenchmark.periodEnd} • {item.usdaBenchmark.status}<br />Checked {item.usdaBenchmark.checkedAt?.slice(0,10)}</div>}</>}
                  </div>
                </div>
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                {renderDealBadge(bestOffer.dealType)}
                {bestOffer.dealConditions && (
                  <span className="text-[11px] text-slate-600">
                    {bestOffer.dealConditions}
                  </span>
                )}
              </div>

              {/* v1.2 Ticket #25: Wholesale Club (Costco & Sam's Club) Benchmark Breakdown */}
              {item.clubBenchmark && (
                <div className="mt-2.5 rounded-lg border border-blue-100 bg-blue-50/50 px-2.5 py-2 text-[11px]">
                  <div className="flex items-center justify-between font-semibold text-slate-800">
                    <span>
                      Costco Bulk: ${item.clubBenchmark.costcoPricePerUnit.toFixed(2)}/
                      {ingredient.standardUnit}
                    </span>
                    <span>
                      Sam&apos;s Club: $
                      {item.clubBenchmark.samsClubPricePerUnit.toFixed(2)}/
                      {ingredient.standardUnit}
                    </span>
                  </div>
                  <div
                    className={`mt-0.5 text-[10px] font-bold ${
                      item.clubBenchmark.beatsClubBulk
                        ? 'text-emerald-700'
                        : 'text-amber-800'
                    }`}
                  >
                    {item.clubBenchmark.verdictLabel}
                  </div>
                </div>
              )}

              <div className="mt-2.5 grid grid-cols-2 gap-2 rounded-lg border border-slate-100 bg-slate-50/70 p-2 text-xs">
                <div
                  className={`rounded p-1.5 ${
                    bestOffer.store === 'KING_SOOPERS'
                      ? 'bg-blue-50/90 font-semibold text-blue-950 border border-blue-200'
                      : 'text-slate-600'
                  }`}
                >
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">
                    {resolveStoreBanner('KING_SOOPERS', currentZip)}
                  </div>
                  {kingSoopersOffer ? (
                    <div>
                      ${kingSoopersOffer.normalizedPricePerUnit.toFixed(2)}/
                      {ingredient.standardUnit}{' '}
                      <span className="text-[10px] font-normal">
                        (
                        {kingSoopersOffer.source === 'CURATED_FALLBACK' ? 'Estimate' : kingSoopersOffer.dealType === 'DIGITAL_COUPON'
                          ? 'App Cpn'
                          : 'Card'}
                        )
                      </span>
                    </div>
                  ) : (
                    <div>N/A</div>
                  )}
                </div>

                <div
                  className={`rounded p-1.5 ${
                    bestOffer.store === 'SAFEWAY'
                      ? 'bg-red-50/90 font-semibold text-red-950 border border-red-200'
                      : 'text-slate-600'
                  }`}
                >
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">
                    {resolveStoreBanner('SAFEWAY', currentZip)}
                  </div>
                  {safewayOffer ? (
                    <div>
                      ${safewayOffer.normalizedPricePerUnit.toFixed(2)}/
                      {ingredient.standardUnit}{' '}
                      <span className="text-[10px] font-normal">
                        (
                        {safewayOffer.source === 'CURATED_FALLBACK' ? 'Estimate' : safewayOffer.dealType === 'DIGITAL_COUPON'
                          ? 'for U Cpn'
                          : 'Member'}
                        )
                      </span>
                    </div>
                  ) : (
                    <div>N/A</div>
                  )}
                </div>
              </div>

              {/* v1.2 Ticket #24: Cycle Peak / Smart Substitution Recommendation */}
              {item.cycleSignal?.status === 'CYCLE_PEAK_WAIT' &&
                item.cycleSignal.substitutionSuggestion && (
                  <div className="mt-2.5 rounded-lg border border-rose-200 bg-rose-50/70 p-2 text-[11px] text-rose-950">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold">
                        💡 Smart Cycle Substitution:
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleTogglePin(
                            item.cycleSignal!.substitutionSuggestion!
                              .substituteIngredientId
                          )
                        }
                        className="rounded bg-rose-700 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-rose-800"
                      >
                        Pin {item.cycleSignal.substitutionSuggestion.substituteName.split(' ')[0]} Instead
                      </button>
                    </div>
                    <p className="mt-1 text-[10px] text-rose-900">
                      {item.cycleSignal.substitutionSuggestion.reason}
                    </p>
                  </div>
                )}

              <div className="mt-2.5 flex items-start gap-1.5 text-[11px] text-slate-600">
                {ingredient.usdaSignal.wholesaleChangePct <= 0 ? (
                  <TrendingDown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                ) : (
                  <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                )}
                <span>
                  <strong className="text-slate-800">
                    USDA Wholesale (
                    {ingredient.usdaSignal.wholesaleChangePct > 0 ? '+' : ''}
                    {ingredient.usdaSignal.wholesaleChangePct}%):
                  </strong>{' '}
                  {ingredient.usdaSignal.note}
                </span>
              </div>

              {/* v0.2 + v1.2 SQLite 6-Week Price History Mini-Chart */}
              {!item.comparisonEvidence && item.priceHistory && verifiedLocalWeekCount(item.priceHistory) > 0 && (
                <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50/80 p-2">
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span className="font-semibold text-slate-700">
                      6-Wk Range: Floor ${item.sixWeekLow.toFixed(2)} • Med $
                      {(item.sixWeekMedian ?? item.sixWeekLocalAvg).toFixed(2)} • Peak $
                      {(item.sixWeekHigh ?? item.sixWeekLocalAvg).toFixed(2)}
                    </span>
                    {verifiedLocalWeekCount(item.priceHistory) >= 6 && bestOffer.source !== 'CURATED_FALLBACK' && bestOffer.normalizedPricePerUnit <= item.sixWeekLow + 0.02 && (
                      <span className="rounded bg-emerald-100 px-1.5 py-0.2 font-bold text-emerald-800">
                        ★ 6-Week Floor
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 grid grid-cols-6 gap-1 items-end h-9 pt-1">
                    {item.priceHistory.map((pt) => {
                      if (pt.bestLocalPrice === null) return <div key={pt.weekStart} title={`${pt.label}: No verified local price`} className="text-center text-xs text-slate-400">—</div>;
                      const maxP = Math.max(
                        ...item.priceHistory.map((h) => h.bestLocalPrice ?? 0),
                        1
                      );
                      const heightPct = Math.max(
                        22,
                        Math.round((pt.bestLocalPrice / maxP) * 100)
                      );
                      const isCurrent = pt.weekStart === item.priceHistory.at(-1)?.weekStart;
                      return (
                        <div
                          key={pt.weekStart}
                          className="flex flex-col items-center justify-end h-full"
                          title={`${pt.label}: Best $${pt.bestLocalPrice.toFixed(2)} (KS $${(pt.kingSoopersPrice?.toFixed(2) ?? '—')} | SW $${(pt.safewayPrice?.toFixed(2) ?? '—')})`}
                        >
                          <div
                            style={{ height: `${heightPct}%` }}
                            className={`w-full rounded-t ${
                              isCurrent ? 'bg-emerald-600' : 'bg-slate-300'
                            }`}
                          />
                          <span className="mt-0.5 text-[9px] leading-none text-slate-500">
                            ${pt.bestLocalPrice.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Action Buttons: Pin to Meal Prep + Have at Home + Buy 2 Freeze 1 Arbitrage */}
            <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleTogglePin(ingredient.id)}
                  className={`flex items-center justify-center gap-1 rounded-xl px-2.5 py-2 text-xs font-bold transition ${
                    isPinned
                      ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {isPinned ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Pinned</span>
                    </>
                  ) : (
                    <>
                      <Pin className="h-3.5 w-3.5" />
                      <span>Pin to Prep</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleToggleOnHand(ingredient.id)}
                  title={'Update explicit pantry availability'}
                  className={`flex items-center justify-center gap-1 rounded-xl border px-2.5 py-2 text-xs font-bold transition ${
                    isOnHand
                      ? 'border-sky-500 bg-sky-600 text-white shadow-xs'
                      : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <DoorOpen className="h-3.5 w-3.5" />
                  <span>
                    {(isOnHand ? 'Already have' : 'Not marked available')}
                  </span>
                </button>
              </div>

              {/* v1.2 Ticket #21: "Buy 2: Prep 1, Freeze 1" Action Button */}
              {item.arbitragePrompt?.eligible && (
                <button
                  type="button"
                  onClick={() => handleReviewStockUp()}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-sky-300 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-900 hover:bg-sky-100 transition"
                >
                  <Snowflake className="h-3.5 w-3.5 text-sky-600" />
                  <span>
                    Buy 2: Prep 1, Freeze 1 (+{item.arbitragePrompt.recommendedFreezeQty}{' '}
                    {item.arbitragePrompt.unit} @ $
                    {bestOffer.normalizedPricePerUnit.toFixed(2)} • Save $
                    {item.arbitragePrompt.futureWeekSavings.toFixed(2)})
                  </span>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
