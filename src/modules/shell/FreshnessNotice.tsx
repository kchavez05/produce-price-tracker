'use client';

import { useDashboardContext } from '@/modules/shell/app-context';

// Moved verbatim from MealPrepDashboard (v2.0 M3 Phase A.4, header). Since Phase B.2c it reads the app's state from the
// context hooks instead of props; the markup is unchanged.

export default function FreshnessNotice() {
  const { data } = useDashboardContext();
  return (
    <>
      {data.freshness && (
        <div role="status" className="my-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-slate-700">
          <p>Planning cycle: {data.adCycleLabel}. {data.freshness.usableLiveOffers} verified live prices; {data.freshness.estimatedBestPrices} top prices use historical estimates. Estimates are not confirmed current specials; verify them with the store.</p>
          <p>Refresh attempted: {new Date(data.freshness.attemptedAtIso).toLocaleString('en-US', { timeZone: 'America/Denver' })} MT.
            {' '}Last successful live retrieval: {data.freshness.liveRetrievedAtIso
              ? `${new Date(data.freshness.liveRetrievedAtIso).toLocaleString('en-US', { timeZone: 'America/Denver' })} MT`
              : 'No successful retrieval recorded'}.
            {' '}Page generated: {new Date(data.lastUpdatedIso).toLocaleString('en-US', { timeZone: 'America/Denver' })} MT.</p>
          <p>Flipp: {data.dataSourcesActive.flippLive ? 'current offers available' : 'no usable current offers'}.
            {' '}Kroger: {data.dataSourcesActive.krogerLive ? 'current prices available' : 'unavailable or not configured'}.
            {' '}USDA benchmarks: {data.usda?.status === 'current' ? 'stored current reports' : data.usda?.status === 'stale' ? 'stored reports (stale)' : 'baseline estimates'}.</p>
          {data.usda && <p>USDA source periods: {[...new Set(Object.values(data.usda.provenance).flatMap((p) => p.periodEnd ? [`${p.region === 'NATIONAL' ? 'National' : 'Mountain'} retail • week ending ${p.periodEnd}`] : []))].join('; ') || 'No compatible stored observations'}. Report age is separate from the price refresh time.</p>}
          {data.marketHistory?.storage === 'unavailable' && <p>Verified market history is temporarily unavailable.</p>}
        </div>
      )}
    </>
  );
}
