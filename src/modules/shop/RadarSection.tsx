import { ArrowLeftRight, Award, Info, Radar, Snowflake, TrendingDown, TrendingUp } from 'lucide-react';
import type { DashboardPayload } from '@/types/domain';
import { renderStoreBadge } from '@/modules/shop/badges';

// Moved verbatim from MealPrepDashboard (v2.0 M3 Phase A.3, Radar tab); state and handlers stay in the dashboard.

interface RadarSectionProps {
  data: DashboardPayload;
  currentZip: string;
  onTogglePin: (ingredientId: string) => void;
  onReviewStockUp: () => void;
}

export default function RadarSection({ data, currentZip, onTogglePin, onReviewStockUp }: RadarSectionProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-emerald-400">
            <Radar className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Predictive 6-Week Cycle Signals, USDA Wholesale &amp; Club Bulk Radar
            </h2>
            <p className="mt-1 text-xs text-slate-600 sm:text-sm">
              Combines available verified price history, stored USDA retail benchmarks, and Costco / Sam&apos;s Club bulk benchmarks to show when to stock up and freeze vs. when to wait or substitute.
            </p>
          </div>
        </div>

        {/* v1.2 Ticket #24: Stock Up Alert (6-Week Low) vs Cycle Peak Substitution Grid */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
            <div className="flex items-center gap-2 text-emerald-950">
              <Snowflake className="h-5 w-5 text-emerald-600" />
              <h3 className="font-bold">
                🟢 Stock Up Alert (Confirmed 6-Week Price Floors)
              </h3>
            </div>
            <p className="mt-1 text-xs text-emerald-800">
              These staples are at or within pennies of their 6-week SQLite price floor. Ideal candidates for &ldquo;Buy 2: Prep 1, Freeze 1&rdquo; multi-week arbitrage.
            </p>

            <div className="mt-3 space-y-2.5">
              {(data.marketRadar.stockUpCycleLows || data.commodities.slice(0, 6))
                .slice(0, 6)
                .map((item) => (
                  <div
                    key={`floor-${item.ingredient.id}`}
                    className="flex items-center justify-between rounded-xl border border-emerald-200 bg-white p-3 shadow-2xs text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        {renderStoreBadge(item.bestOffer.store, currentZip)}
                        <span className="font-bold text-slate-900">
                          {item.ingredient.name}
                        </span>
                      </div>
                      <div className="mt-1 text-slate-600">
                        Now{' '}
                        <strong className="text-emerald-700">
                          ${item.bestOffer.normalizedPricePerUnit.toFixed(2)}/
                          {item.ingredient.standardUnit}
                        </strong>{' '}
                        (6-Wk Range: ${item.sixWeekLow.toFixed(2)} – $
                        {(item.sixWeekHigh ?? item.bestOffer.regularPricePerUnit).toFixed(2)})
                      </div>
                    </div>

                    {item.arbitragePrompt?.eligible && (
                      <button
                        type="button"
                        onClick={() => onReviewStockUp()}
                        className="shrink-0 rounded-lg bg-sky-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-sky-700"
                      >
                        ❄️ Buy 2 / Freeze 1
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </div>

          <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-4">
            <div className="flex items-center gap-2 text-rose-950">
              <ArrowLeftRight className="h-5 w-5 text-rose-600" />
              <h3 className="font-bold">
                🔴 Cycle Peak / Wait &amp; Smart Substitution Advisor (Ticket #24)
              </h3>
            </div>
            <p className="mt-1 text-xs text-rose-800">
              Wholesale prices are dropping rapidly or current retail is near its 6-week peak. Swap in a 6-week floor alternative this week and wait for next Wednesday&apos;s ad drop.
            </p>

            <div className="mt-3 space-y-2.5">
              {(data.marketRadar.cyclePeakWaitList || []).map((item) => (
                <div
                  key={`peak-${item.ingredient.id}`}
                  className="rounded-xl border border-rose-200 bg-white p-3 shadow-2xs text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">
                      {item.ingredient.name}
                    </span>
                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-900">
                      🔴 Wait / Swap (Wholesale {item.ingredient.usdaSignal.wholesaleChangePct}%)
                    </span>
                  </div>
                  <div className="mt-1 text-slate-600">
                    Current Retail:{' '}
                    <strong>
                      ${item.bestOffer.normalizedPricePerUnit.toFixed(2)}/
                      {item.ingredient.standardUnit}
                    </strong>{' '}
                    {item.comparisonEvidence ? ' • Historical comparison unavailable' : <> • 6-Wk Median: $
                    {(item.sixWeekMedian ?? item.sixWeekLocalAvg).toFixed(2)}</>}
                  </div>
                  {item.cycleSignal?.substitutionSuggestion && (
                    <div className="mt-1.5 flex items-center justify-between gap-2 rounded-lg bg-rose-50 p-2 text-[11px] text-rose-950">
                      <span>{item.cycleSignal.substitutionSuggestion.reason}</span>
                      <button
                        type="button"
                        onClick={() =>
                          onTogglePin(
                            item.cycleSignal!.substitutionSuggestion!
                              .substituteIngredientId
                          )
                        }
                        className="shrink-0 rounded bg-rose-700 px-2 py-1 text-[10px] font-bold text-white hover:bg-rose-800"
                      >
                        Pin Swap
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* v1.2 Ticket #25: Wholesale Club Price Normalizer Matrix (Costco & Sam's Club) */}
        <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50/30 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-700" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Wholesale Club Price Normalizer: Supermarket Ads vs. Costco &amp; Sam&apos;s Club Bulk (Ticket #25)
                </h3>
                <p className="text-xs text-slate-600">
                  Side-by-side $/lb and $/doz benchmark confirming which weekly supermarket loss-leaders genuinely beat buying bulk packs at Costco or Sam&apos;s Club.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-blue-200 text-[11px] font-bold uppercase text-slate-600">
                  <th className="py-2 pr-3">Commodity</th>
                  <th className="py-2 px-2">Best Supermarket Deal</th>
                  <th className="py-2 px-2">Costco (Kirkland)</th>
                  <th className="py-2 px-2">Sam&apos;s Club</th>
                  <th className="py-2 pl-2 text-right">Club Normalizer Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100">
                {data.commodities.slice(0, 12).map((item) => {
                  const cb = item.clubBenchmark;
                  if (!cb) return null;
                  return (
                    <tr key={`club-${item.ingredient.id}`} className="bg-white/60">
                      <td className="py-2 pr-3 font-bold text-slate-900">
                        {item.ingredient.name}
                      </td>
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-1.5">
                          {renderStoreBadge(item.bestOffer.store, currentZip)}
                          <span className="font-extrabold text-slate-900">
                            ${item.bestOffer.normalizedPricePerUnit.toFixed(2)}/
                            {item.ingredient.standardUnit}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-2 text-slate-700">
                        <strong>
                          ${cb.costcoPricePerUnit.toFixed(2)}/{item.ingredient.standardUnit}
                        </strong>
                        <div className="text-[10px] text-slate-500">
                          {cb.costcoPackDescription}
                        </div>
                      </td>
                      <td className="py-2 px-2 text-slate-700">
                        <strong>
                          ${cb.samsClubPricePerUnit.toFixed(2)}/
                          {item.ingredient.standardUnit}
                        </strong>
                        <div className="text-[10px] text-slate-500">
                          {cb.samsClubPackDescription}
                        </div>
                      </td>
                      <td className="py-2 pl-2 text-right">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            cb.beatsClubBulk
                              ? 'bg-emerald-100 text-emerald-900'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {cb.verdictLabel}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Original USDA Spiking vs Dropping Section */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
            <div className="flex items-center gap-2 text-amber-900">
              <TrendingUp className="h-5 w-5 text-amber-600" />
              <h3 className="font-bold">
                Buy Now &amp; Freeze (Wholesale Spiking, Local Retail Still Cheap)
              </h3>
            </div>
            <p className="mt-1 text-xs text-amber-800">
              Static wholesale scenario estimates are shown only in local demonstration mode; they are not verified current market movements.
            </p>

            <div className="mt-3 space-y-3">
              {data.marketRadar.buyBeforeSpike.map((item) => (
                <div
                  key={item.ingredient.id}
                  className="rounded-xl border border-amber-200 bg-white p-3 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">
                      {item.ingredient.name}
                    </span>
                    {renderStoreBadge(item.bestOffer.store, currentZip)}
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-base font-extrabold text-emerald-700">
                      ${item.bestOffer.normalizedPricePerUnit.toFixed(2)}/
                      {item.ingredient.standardUnit}
                    </span>
                    <span className="text-xs text-amber-700 font-semibold">
                      (USDA Wholesale +{item.ingredient.usdaSignal.wholesaleChangePct}%
                      this week)
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    {item.ingredient.usdaSignal.note}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-sky-200 bg-sky-50/40 p-4">
            <div className="flex items-center gap-2 text-sky-950">
              <TrendingDown className="h-5 w-5 text-sky-600" />
              <h3 className="font-bold">
                Hold Off 7 Days (Wholesale Crashing, Local Retail Still High)
              </h3>
            </div>
            <p className="mt-1 text-xs text-sky-800">
              These are fallback scenario estimates, not newly retrieved wholesale forecasts.
            </p>

            <div className="mt-3 space-y-3">
              {data.marketRadar.holdOffDropping.map((item) => (
                <div
                  key={item.ingredient.id}
                  className="rounded-xl border border-sky-200 bg-white p-3 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">
                      {item.ingredient.name}
                    </span>
                    <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-900">
                      Wholesale {item.ingredient.usdaSignal.wholesaleChangePct}%
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs">
                    <span className="text-slate-600">
                      Current Local Shelf:{' '}
                      <strong className="text-slate-900">
                        ${item.currentLocalPrice.toFixed(2)}/
                        {item.ingredient.standardUnit}
                      </strong>
                    </span>
                    <span className="text-emerald-700 font-semibold">
                      Target Next Ad: ~${item.expectedSaleTarget.toFixed(2)}/
                      {item.ingredient.standardUnit}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">{item.reason}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Data Pipeline Status Footer */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 font-bold text-slate-900">
            <Info className="h-4 w-4 text-emerald-600" />
            <span>
              {'Market History, Virtual Pantry & Store Locations'}
            </span>
          </div>
          <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <strong>Market history: {data.marketHistory?.storage ?? 'local'}</strong>
              {data.marketHistory?.storage === 'local' ? ' • Includes synthetic demonstration history. ' : ' • Verified observations only. '}
              <strong>Local development cache:</strong>{' '}
              <code>{data.sqliteStats.dbPath}</code> —{' '}
              <span className="text-emerald-700 font-semibold">
                {data.sqliteStats.totalHistoricalOfferRows} offer rows &amp;{' '}
                {data.sqliteStats.totalUsdaSnapshotRows} USDA rows (
                {data.sqliteStats.trackedWeeksCount} weeks)
              </span>
            </div>
            <div>
              <strong>Local Circulars ({data.zipCode}):</strong> Supermarket Weekly Flyers —{' '}
              <span className="text-emerald-700 font-semibold">
                {data.dataSourcesActive.flippLive
                  ? `Live Circular Feed Connected for ${data.cityLabel}`
                  : `No verified current circulars; historical estimates (${data.cityLabel})`}
              </span>
            </div>
            <div>
              <strong>Nearby Supermarkets ({data.zipCode}):</strong>{' '}
              {data.nearbyKingSoopersLocations &&
              data.nearbyKingSoopersLocations.length > 0
                ? data.nearbyKingSoopersLocations
                    .map(
                      (loc) =>
                        `${loc.name} (#${loc.locationId}, ${loc.distanceMiles} mi)`
                    )
                    .join(' • ')
                : `Kroger, Albertsons, ALDI, Walmart, Target & Sprouts`}
            </div>
            <div>
              <strong>USDA MARS &amp; Club Normalizer:</strong> Specialty Crops (
              <code>3324</code>), Beef (<code>3228</code>), Pork (<code>2868</code>),
              Chicken (<code>2756</code>), Dairy (<code>2995</code>) + Costco / Sam&apos;s Bulk
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
