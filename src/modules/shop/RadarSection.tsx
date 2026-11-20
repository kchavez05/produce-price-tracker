'use client';

import { useState, type ReactNode } from 'react';
import { Badge, Button, Card, Sheet } from '@/components/ui';
import { focusRing } from '@/components/ui/cx';
import DealDetailView from '@/modules/shop/DealDetailView';
import PriceTrend from '@/modules/shop/PriceTrend';
import AppLink from '@/modules/shell/AppLink';
import { renderStoreBadge } from '@/modules/shop/badges';
import { resolveStoreBanner } from '@/data/store-registry';
import {
  useDashboardContext, useLocationContext, usePreferencesContext, useShellContext,
} from '@/modules/shell/app-context';
import type { ScoredCommodity } from '@/types/domain';

// v2.0 M4-3c (wireframes Shop Radar and iPad Radar): the Radar view as three short sections and one row of detail. Stock-Up Alerts
// are the staples at or near their six-week low, Hold Off is what is at a cycle peak (with the swap to pin), and Club vs. Store
// sets the supermarket price against Costco and Sam's Club. "USDA movers and data status" opens the USDA wholesale movers and where the
// data comes from. Below 1024 px an alert's name links to its Deal Detail; from 1024 px the list is the left column and the
// selected alert's detail is the pane (the first one until another is chosen). The numbers and wording of each signal are
// the old Radar's, moved here, not recalculated.

function RadarCard({ item, selected, onSelect, tag, children }: {
  item: ScoredCommodity; selected: boolean; onSelect: () => void; tag: ReactNode; children: ReactNode;
}) {
  const name = item.ingredient.name;
  return (
    <Card as="article" aria-label={name} className={`space-y-2 ${selected ? 'wide:ring-2 wide:ring-accent' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-bold text-ink">
          <AppLink to={{ module: 'shop', view: 'BOARD', deal: item.ingredient.id }} className={`flex min-h-touch items-center wide:hidden ${focusRing}`}>{name}</AppLink>
          <button type="button" aria-pressed={selected} onClick={onSelect} className={`hidden min-h-touch items-center text-left wide:flex ${focusRing}`}>{name}</button>
        </h3>
        <div className="shrink-0 pt-2">{tag}</div>
      </div>
      {children}
    </Card>
  );
}

export default function RadarSection() {
  const { data } = useDashboardContext();
  const { currentZip } = useLocationContext();
  const { handleTogglePin } = usePreferencesContext();
  const { handleReviewStockUp } = useShellContext();
  const [usdaOpen, setUsdaOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const lows = data.marketRadar.stockUpCycleLows;
  const stockUp = (lows ?? data.commodities.slice(0, 6)).slice(0, 6);
  const holdOff = data.marketRadar.cyclePeakWaitList ?? [];
  const clubRows = data.commodities.slice(0, 12).filter((item) => item.clubBenchmark);
  const paneId = selectedId ?? stockUp[0]?.ingredient.id ?? holdOff[0]?.ingredient.id ?? null;

  const usdaRow = (className: string) => (
    <div className={`no-print flex items-center justify-between gap-3 ${className}`}>
      <span className="text-sm text-muted">USDA movers and data status</span>
      <Button variant="quiet" onClick={() => setUsdaOpen(true)}>Details</Button>
    </div>
  );

  return (
    <div className="space-y-4 wide:grid wide:grid-cols-[380px_minmax(0,1fr)] wide:items-start wide:gap-6 wide:space-y-0">
      <div className="space-y-4">
        <section aria-labelledby="radar-stock-up" className="space-y-2">
          <h2 id="radar-stock-up" className="text-sm font-bold uppercase tracking-wide text-muted">Stock-Up Alerts</h2>
          {stockUp.length === 0 && <p className="text-sm text-muted">No stock-up lows this week.</p>}
          <div className="grid gap-3 sm:grid-cols-2 wide:grid-cols-1">
            {stockUp.map((item) => (
              <RadarCard
                key={`floor-${item.ingredient.id}`}
                item={item}
                selected={item.ingredient.id === paneId}
                onSelect={() => setSelectedId(item.ingredient.id)}
                tag={<Badge tone="save">{lows ? '6-week low' : 'Top deal'}</Badge>}
              >
                <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
                  {renderStoreBadge(item.bestOffer.store, currentZip)}
                  <span>
                    <span className="font-semibold text-ink">${item.bestOffer.normalizedPricePerUnit.toFixed(2)}/{item.ingredient.standardUnit}</span>
                    {item.arbitragePrompt?.eligible ? ' · buy 2, freeze 1' : ''}
                  </span>
                </p>
                <p className="text-xs text-muted">
                  6-week range: ${item.sixWeekLow.toFixed(2)} – ${(item.sixWeekHigh ?? item.bestOffer.regularPricePerUnit).toFixed(2)}
                </p>
                <PriceTrend item={item} />
                {item.arbitragePrompt?.eligible && (
                  <Button variant="secondary" className="no-print" onClick={() => handleReviewStockUp()}>Buy 2 / Freeze 1</Button>
                )}
              </RadarCard>
            ))}
          </div>
        </section>

        <section aria-labelledby="radar-hold-off" className="space-y-2">
          <h2 id="radar-hold-off" className="text-sm font-bold uppercase tracking-wide text-muted">Hold Off</h2>
          {holdOff.length === 0 && <p className="text-sm text-muted">Nothing is at a cycle peak this week.</p>}
          <div className="grid gap-3 sm:grid-cols-2 wide:grid-cols-1">
            {holdOff.map((item) => (
              <RadarCard
                key={`peak-${item.ingredient.id}`}
                item={item}
                selected={item.ingredient.id === paneId}
                onSelect={() => setSelectedId(item.ingredient.id)}
                tag={<Badge tone="danger">Cycle peak</Badge>}
              >
                <p className="text-sm text-muted">
                  ${item.bestOffer.normalizedPricePerUnit.toFixed(2)}/{item.ingredient.standardUnit} is high this week (wholesale {item.ingredient.usdaSignal.wholesaleChangePct}%)
                  {item.comparisonEvidence ? ' • Historical comparison unavailable' : <> • 6-week median ${(item.sixWeekMedian ?? item.sixWeekLocalAvg).toFixed(2)}</>}
                </p>
                {item.cycleSignal?.substitutionSuggestion && (
                  <div className="space-y-1 rounded-control bg-chip p-2 text-sm text-ink">
                    <p>{item.cycleSignal.substitutionSuggestion.reason}</p>
                    <Button variant="secondary" className="no-print" onClick={() => handleTogglePin(item.cycleSignal!.substitutionSuggestion!.substituteIngredientId)}>
                      Pin swap
                    </Button>
                  </div>
                )}
              </RadarCard>
            ))}
          </div>
        </section>

        {/* Club vs. Store (below 1024 px; from 1024 px the selected alert's own comparison is in the pane) */}
        <section aria-labelledby="radar-club" className="space-y-2 wide:hidden">
          <h2 id="radar-club" className="text-sm font-bold uppercase tracking-wide text-muted">Club vs. Store</h2>
          {clubRows.length === 0 ? <p className="text-sm text-muted">No club comparisons for these foods.</p> : (
            <Card padding="none">
              <ul className="divide-y divide-border">
                {clubRows.map((item) => {
                  const club = item.clubBenchmark!;
                  const unit = item.ingredient.standardUnit;
                  return (
                    <li key={`club-${item.ingredient.id}`} className="space-y-0.5 px-4 py-3 text-sm">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="font-semibold text-ink">{item.ingredient.name}</span>
                        <Badge tone={club.beatsClubBulk ? 'save' : 'warning'}>{club.verdictLabel}</Badge>
                      </div>
                      <p className="text-muted">
                        {resolveStoreBanner(item.bestOffer.store, currentZip)} ${item.bestOffer.normalizedPricePerUnit.toFixed(2)}/{unit}
                        {' · '}Costco ${club.costcoPricePerUnit.toFixed(2)}/{unit}
                        {' · '}Sam&apos;s ${club.samsClubPricePerUnit.toFixed(2)}/{unit}
                      </p>
                      <p className="text-xs text-muted">Costco: {club.costcoPackDescription} • Sam&apos;s Club: {club.samsClubPackDescription}</p>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </section>
        {usdaRow('wide:hidden')}
      </div>

      {/* The pane, from 1024 px: the selected alert's detail, with its own club comparison, and the USDA row */}
      <section aria-label="Alert detail" className="hidden min-w-0 space-y-3 wide:sticky wide:top-20 wide:block">
        {paneId !== null ? <DealDetailView dealId={paneId} /> : <p className="rounded-card bg-chip p-6 text-center text-sm text-muted">Nothing to show yet.</p>}
        {usdaRow('')}
      </section>

      <Sheet open={usdaOpen} onClose={() => setUsdaOpen(false)} title="USDA Movers and Data Status">
        <div className="space-y-5 text-sm">
          <section aria-labelledby="usda-buy" className="space-y-2">
            <h3 id="usda-buy" className="font-bold text-ink">Buy now and freeze: wholesale spiking, local retail still cheap</h3>
            <p className="text-muted">Static wholesale scenario estimates are shown only in local demonstration mode; they are not verified current market movements.</p>
            {data.marketRadar.buyBeforeSpike.map((item) => (
              <div key={item.ingredient.id} className="rounded-control bg-chip p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-ink">{item.ingredient.name}</span>
                  {renderStoreBadge(item.bestOffer.store, currentZip)}
                </div>
                <p className="mt-1 text-ink">
                  <span className="font-bold">${item.bestOffer.normalizedPricePerUnit.toFixed(2)}/{item.ingredient.standardUnit}</span>
                  {' '}(USDA wholesale +{item.ingredient.usdaSignal.wholesaleChangePct}% this week)
                </p>
                <p className="text-muted">{item.ingredient.usdaSignal.note}</p>
              </div>
            ))}
          </section>

          <section aria-labelledby="usda-hold" className="space-y-2">
            <h3 id="usda-hold" className="font-bold text-ink">Hold off 7 days: wholesale crashing, local retail still high</h3>
            <p className="text-muted">These are fallback scenario estimates, not newly retrieved wholesale forecasts.</p>
            {data.marketRadar.holdOffDropping.map((item) => (
              <div key={item.ingredient.id} className="rounded-control bg-chip p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-ink">{item.ingredient.name}</span>
                  <Badge>Wholesale {item.ingredient.usdaSignal.wholesaleChangePct}%</Badge>
                </div>
                <p className="mt-1 text-ink">
                  Current local shelf: <span className="font-bold">${item.currentLocalPrice.toFixed(2)}/{item.ingredient.standardUnit}</span>
                  {' · '}target next ad: ~${item.expectedSaleTarget.toFixed(2)}/{item.ingredient.standardUnit}
                </p>
                <p className="text-muted">{item.reason}</p>
              </div>
            ))}
          </section>

          <section aria-labelledby="usda-status" className="space-y-2 text-muted">
            <h3 id="usda-status" className="font-bold text-ink">Market history, Virtual Pantry and store locations</h3>
            <p>
              <strong className="text-ink">Market history: {data.marketHistory?.storage ?? 'local'}</strong>
              {data.marketHistory?.storage === 'local' ? ' • Includes synthetic demonstration history. ' : ' • Verified observations only. '}
              <strong className="text-ink">Local development cache:</strong> <code>{data.sqliteStats.dbPath}</code> — {data.sqliteStats.totalHistoricalOfferRows} offer rows &amp; {data.sqliteStats.totalUsdaSnapshotRows} USDA rows ({data.sqliteStats.trackedWeeksCount} weeks)
            </p>
            <p>
              <strong className="text-ink">Local circulars ({data.zipCode}):</strong> supermarket weekly flyers —{' '}
              {data.dataSourcesActive.flippLive ? `live circular feed connected for ${data.cityLabel}` : `no verified current circulars; historical estimates (${data.cityLabel})`}
            </p>
            <p>
              <strong className="text-ink">Nearby supermarkets ({data.zipCode}):</strong>{' '}
              {data.nearbyKingSoopersLocations && data.nearbyKingSoopersLocations.length > 0
                ? data.nearbyKingSoopersLocations.map((loc) => `${loc.name} (#${loc.locationId}, ${loc.distanceMiles} mi)`).join(' • ')
                : 'Kroger, Albertsons, ALDI, Walmart, Target & Sprouts'}
            </p>
            <p>
              <strong className="text-ink">USDA MARS &amp; club normalizer:</strong> Specialty Crops (<code>3324</code>), Beef (<code>3228</code>), Pork (<code>2868</code>), Chicken (<code>2756</code>), Dairy (<code>2995</code>) + Costco / Sam&apos;s bulk
            </p>
          </section>
        </div>
      </Sheet>
    </div>
  );
}
