'use client';

import { useDashboardContext } from '@/modules/shell/app-context';

// The data-freshness details, moved from the shell's FreshnessNotice (v2.0 M4-3a; the yellow box was taken out of the header
// in M4-1a because it filled the screen). They now open from the Shop's freshness line (Details), so the disclosure that
// estimates are not confirmed current specials, the refresh times and the source status are one tap away (#828). The words
// are unchanged; only the wrapper moved from a warning box to the plain paragraphs of a sheet, in design tokens.
const MT = 'America/Denver';
const stamp = (iso: string) => `${new Date(iso).toLocaleString('en-US', { timeZone: MT })} MT`;

export default function FreshnessDetails() {
  const { data } = useDashboardContext();
  if (!data.freshness) return <p className="text-base text-muted">No refresh details are available for this view.</p>;
  const { freshness } = data;
  return (
    <div className="space-y-3 text-base text-ink">
      <p>Planning cycle: {data.adCycleLabel}. {freshness.usableLiveOffers} verified live prices; {freshness.estimatedBestPrices} top prices use historical estimates. Estimates are not confirmed current specials; verify them with the store.</p>
      <p>Refresh attempted: {stamp(freshness.attemptedAtIso)}.
        {' '}Last successful live retrieval: {freshness.liveRetrievedAtIso ? stamp(freshness.liveRetrievedAtIso) : 'No successful retrieval recorded'}.
        {' '}Page generated: {stamp(data.lastUpdatedIso)}.</p>
      <p>Flipp: {data.dataSourcesActive.flippLive ? 'current offers available' : 'no usable current offers'}.
        {' '}Kroger: {data.dataSourcesActive.krogerLive ? 'current prices available' : 'unavailable or not configured'}.
        {' '}USDA benchmarks: {data.usda?.status === 'current' ? 'stored current reports' : data.usda?.status === 'stale' ? 'stored reports (stale)' : 'baseline estimates'}.</p>
      {data.usda && <p>USDA source periods: {[...new Set(Object.values(data.usda.provenance).flatMap((p) => p.periodEnd ? [`${p.region === 'NATIONAL' ? 'National' : 'Mountain'} retail • week ending ${p.periodEnd}`] : []))].join('; ') || 'No compatible stored observations'}. Report age is separate from the price refresh time.</p>}
      {data.marketHistory?.storage === 'unavailable' && <p>Verified market history is temporarily unavailable.</p>}
    </div>
  );
}
