import { Check, Gem, Pin, Snowflake } from 'lucide-react';
import { renderStoreBadge } from '@/modules/shop/badges';
import type { DashboardPayload } from '@/types/domain';

// Moved verbatim from MealPrepDashboard (v2.0 M3 Phase A.3, Board tab); state and handlers stay in the dashboard.

interface BoardAlertsProps {
  data: Pick<DashboardPayload, 'splurgeAlerts'>;
  currentZip: string;
  pinnedIds: string[];
  handleTogglePin: (ingredientId: string) => void;
  handleReviewStockUp: () => void;
}

export default function BoardAlerts({ data, currentZip, pinnedIds, handleTogglePin, handleReviewStockUp }: BoardAlertsProps) {
  return (
    <>
      {data.splurgeAlerts.length > 0 && (
        <section className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 p-4 text-white shadow-md">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-400/20 text-amber-300">
                <Gem className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-sm font-bold tracking-wide text-amber-300 uppercase">
                  Stock-up Value Alerts
                </h2>
                <p className="text-xs text-slate-300">
                  Premium roasts, steaks, and seafood at 40–54% off. Use &ldquo;Buy 2: Prep 1, Freeze 1&rdquo; to lock in cycle-floor pricing for future weeks.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {data.splurgeAlerts.slice(0, 4).map((item) => {
              const isPinned = pinnedIds.includes(item.ingredient.id);
              return (
                <div
                  key={item.ingredient.id}
                  className="flex flex-col justify-between rounded-xl border border-white/15 bg-white/10 p-3 backdrop-blur-xs"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      {renderStoreBadge(item.bestOffer.store, currentZip)}
                      <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-xs font-bold text-emerald-300">
                        -{item.discountVsRegularPct}% OFF
                      </span>
                    </div>
                    <h3 className="mt-2 font-bold text-white">
                      {item.ingredient.name}
                    </h3>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-xl font-extrabold text-amber-300">
                        ${item.bestOffer.normalizedPricePerUnit.toFixed(2)}
                        <span className="text-xs font-normal text-slate-300">
                          /{item.ingredient.standardUnit}
                        </span>
                      </span>
                      <span className="text-xs text-slate-400 line-through">
                        Reg ${item.bestOffer.regularPricePerUnit.toFixed(2)}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-300">
                      {item.bestOffer.rawPriceText}
                    </p>
                    {item.clubBenchmark?.beatsClubBulk && (
                      <p className="mt-1 text-[11px] font-semibold text-emerald-300">
                        🏆 Beats {item.clubBenchmark.bestClubName} Bulk ($
                        {item.clubBenchmark.bestClubPricePerUnit.toFixed(2)}/
                        {item.ingredient.standardUnit}) by{' '}
                        {item.clubBenchmark.savingsVsClubPct}%
                      </p>
                    )}
                  </div>

                  <div className="mt-3 space-y-1.5 border-t border-white/10 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-amber-200/90">
                        {item.bestOffer.dealType === 'DIGITAL_COUPON'
                          ? '📱 Clip App Coupon'
                          : '🏷️ Member Card'}
                      </span>
                      <button
                        onClick={() => handleTogglePin(item.ingredient.id)}
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                          isPinned
                            ? 'bg-emerald-500 text-white'
                            : 'bg-white/15 text-white hover:bg-white/25'
                        }`}
                      >
                        {isPinned ? (
                          <>
                            <Check className="h-3.5 w-3.5" /> Pinned
                          </>
                        ) : (
                          <>
                            <Pin className="h-3.5 w-3.5" /> Pin to Prep
                          </>
                        )}
                      </button>
                    </div>

                    {item.arbitragePrompt?.eligible && (
                      <button
                        type="button"
                        onClick={() => handleReviewStockUp()}
                        className={`w-full flex items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-bold transition ${
                          'bg-sky-400/25 text-sky-200 border border-sky-400/40 hover:bg-sky-400/40'
                        }`}
                      >
                        <Snowflake className="h-3 w-3" />
                        <span>
                          {`Buy 2: Prep 1, Freeze 1 (Save $${item.arbitragePrompt.futureWeekSavings.toFixed(2)})`}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
