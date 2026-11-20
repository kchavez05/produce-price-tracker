'use client';

import { Banner, Button } from '@/components/ui';
import BoardAlerts from '@/modules/shop/BoardAlerts';
import BoardControls from '@/modules/shop/BoardControls';
import BoardLeaderboard from '@/modules/shop/BoardLeaderboard';
import RadarSection from '@/modules/shop/RadarSection';
import ShopFilters from '@/modules/shop/ShopFilters';
import ShopHeader from '@/modules/shop/ShopHeader';
import ShopViewNav from '@/modules/shop/ShopViewNav';
import TripSection from '@/modules/shop/TripSection';
import { useDashboardContext, usePreferencesContext, useShopContext } from '@/modules/shell/app-context';

// v2.0 M3 Phase B.3c: the /shop page. Board, Trip and Radar are views of this one route, kept in the Shop context's view
// state (owner decision, B.3 option A), so they survive a trip to another module.
export default function ShopPage() {
  const { shopView, categoryFilter, sortMode } = useShopContext();
  const { storeFilter } = usePreferencesContext();
  const { refreshing, refreshFailed, syncDashboard } = useDashboardContext();
  return (
    <div aria-busy={refreshing} className={refreshing ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
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
      {shopView === 'BOARD' && (
        <div className="space-y-4">
          <BoardControls />
          <BoardAlerts />
          {/* Keyed so a new category, sort or store filter starts again at the first page of deals */}
          <BoardLeaderboard key={`${categoryFilter}|${sortMode}|${storeFilter}`} />
        </div>
      )}

      {/* =========================================================
          TAB 3: SHOPPING LIST, 1-TAP CURBSIDE CART BRIDGE & EXPORT
         ========================================================= */}
      {shopView === 'SHOPPING_LIST' && (
        <TripSection />
      )}

      {/* =========================================================
          TAB 4: USDA, 6-WEEK CYCLE SIGNALS & WHOLESALE CLUB RADAR
         ========================================================= */}
      {shopView === 'RADAR' && (
        <RadarSection />
      )}
    </div>
  );
}
