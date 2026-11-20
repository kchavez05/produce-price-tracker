'use client';

import { Banner, Button } from '@/components/ui';
import BoardAlerts from '@/modules/shop/BoardAlerts';
import BoardControls from '@/modules/shop/BoardControls';
import BoardLeaderboard from '@/modules/shop/BoardLeaderboard';
import DealDetailView from '@/modules/shop/DealDetailView';
import RadarSection from '@/modules/shop/RadarSection';
import ShopFilters from '@/modules/shop/ShopFilters';
import ShopHeader from '@/modules/shop/ShopHeader';
import ShopViewNav from '@/modules/shop/ShopViewNav';
import TripSection from '@/modules/shop/TripSection';
import { useDashboardContext, usePreferencesContext, useShopContext } from '@/modules/shell/app-context';
import { useAppRouter } from '@/modules/shell/app-router';
import { dealIdOfPath } from '@/modules/shell/navigation';

// v2.0 M3 Phase B.3c: the /shop page. Board, Trip and Radar are views of this one route, kept in the Shop context's view
// state (owner decision, B.3 option A), so they survive a trip to another module.
//
// v2.0 M4-3a: Deal Detail is this page at /shop/deal/<id>. Below 1024 px it replaces the page (the list column is hidden and the
// detail is the screen, with a Back link). From 1024 px the Deals view is two columns, the list and the selected deal's
// detail as a pane (the wireframe iPad Shop), with a short prompt in the pane until a deal is chosen.
export default function ShopPage() {
  const { pathname } = useAppRouter();
  const { shopView, categoryFilter, sortMode } = useShopContext();
  const dealId = dealIdOfPath(pathname);
  const onDeals = dealId !== null || shopView === 'BOARD';
  const { storeFilter } = usePreferencesContext();
  const { refreshing, refreshFailed, syncDashboard } = useDashboardContext();
  return (
    <div aria-busy={refreshing} className={refreshing ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
      <div className={onDeals ? 'wide:flex wide:items-start wide:gap-6' : undefined}>
      <div className={`${dealId !== null ? 'hidden wide:block ' : ''}${onDeals ? 'min-w-0 wide:w-[380px] wide:shrink-0' : ''}`}>
      <ShopHeader />
      {refreshFailed && (
        <Banner tone="error" title="Could not update prices" className="no-print mb-3">
          <p>You are seeing the last prices we got.</p>
          <Button variant="secondary" className="mt-2" onClick={() => void syncDashboard()}>Try again</Button>
        </Banner>
      )}
      <div className="no-print mb-4 flex items-center gap-2">
        <div className="min-w-0 flex-1"><ShopViewNav /></div>
        <ShopFilters />
      </div>

      {/* =========================================================
          TAB 1: THE WEEKEND VALUE BOARD
         ========================================================= */}
      {onDeals && (
        <div className="space-y-4">
          <BoardControls />
          <BoardAlerts />
          {/* Keyed so a new category, sort or store filter starts again at the first page of deals */}
          <BoardLeaderboard key={`${categoryFilter}|${sortMode}|${storeFilter}`} selectedId={dealId} />
        </div>
      )}

      {/* =========================================================
          TAB 3: SHOPPING LIST, 1-TAP CURBSIDE CART BRIDGE & EXPORT
         ========================================================= */}
      {shopView === 'SHOPPING_LIST' && !onDeals && (
        <TripSection />
      )}

      {/* =========================================================
          TAB 4: USDA, 6-WEEK CYCLE SIGNALS & WHOLESALE CLUB RADAR
         ========================================================= */}
      {shopView === 'RADAR' && !onDeals && (
        <RadarSection />
      )}
      </div>
      {onDeals && (
        <section aria-label="Deal detail" className={`min-w-0 wide:sticky wide:top-20 wide:flex-1 ${dealId !== null ? '' : 'hidden wide:block'}`}>
          {dealId !== null
            ? <DealDetailView dealId={dealId} />
            : <p className="rounded-card bg-chip p-6 text-center text-sm text-muted">Choose a deal to see its price history and how the stores compare.</p>}
        </section>
      )}
      </div>
    </div>
  );
}
