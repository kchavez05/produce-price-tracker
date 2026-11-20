'use client';

import { useState } from 'react';
import { Button, Sheet } from '@/components/ui';
import AppLink from '@/modules/shell/AppLink';
import { useDashboardContext, usePreferencesContext } from '@/modules/shell/app-context';
import FreshnessDetails from '@/modules/shop/FreshnessDetails';

// v2.0 M4-3a (wireframes Shop and Shop Loading): the Shop's two status lines. The first is the read-only location and store
// count with a link to where they are changed (Settings, M4 decision 4); the second is the one freshness line (the planning
// cycle, when the page was updated, and that some prices are estimates) with Details, which opens the full freshness
// information (#828). While a refetch is in flight the second line says "Updating prices…" (wireframe Shop Loading).
const MT = 'America/Denver';
const updatedAt = (iso: string) => `${new Date(iso).toLocaleTimeString('en-US', { timeZone: MT, hour: 'numeric', minute: '2-digit' })} MT`;

export default function ShopHeader() {
  const { data, refreshing } = useDashboardContext();
  const { activeStores } = usePreferencesContext();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const estimates = (data.freshness?.estimatedBestPrices ?? 0) > 0;
  return (
    <section aria-label="Prices" className="no-print mb-3 space-y-0.5">
      <div className="flex items-center justify-between gap-3 text-sm">
        <p className="min-w-0 truncate text-muted">{data.cityLabel} · {activeStores.length} stores</p>
        <AppLink
          to={{ module: 'settings' }}
          className="inline-flex min-h-touch shrink-0 items-center text-accent underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          Change in Settings
        </AppLink>
      </div>
      <div className="flex items-center justify-between gap-3 text-sm">
        {refreshing
          ? <p role="status" className="text-muted">Updating prices…</p>
          : <p className="min-w-0 text-muted">Ad cycle {data.adCycleLabel} · updated {updatedAt(data.lastUpdatedIso)}{estimates ? ' · some prices are estimates' : ''}</p>}
        <Button variant="quiet" onClick={() => setDetailsOpen(true)}>Details</Button>
      </div>
      <Sheet open={detailsOpen} onClose={() => setDetailsOpen(false)} title="Price Data and Freshness">
        <FreshnessDetails />
      </Sheet>
    </section>
  );
}
