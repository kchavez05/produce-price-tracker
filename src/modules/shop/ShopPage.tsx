'use client';

import BoardAlerts from '@/modules/shop/BoardAlerts';
import BoardControls from '@/modules/shop/BoardControls';
import BoardLeaderboard from '@/modules/shop/BoardLeaderboard';
import RadarSection from '@/modules/shop/RadarSection';
import TripSection from '@/modules/shop/TripSection';
import { useShopContext } from '@/modules/shell/app-context';

// v2.0 M3 Phase B.3c: the /shop page. Board, Trip and Radar are views of this one route, kept in the Shop context's view
// state (owner decision, B.3 option A), so they survive a trip to another module.
export default function ShopPage() {
  const { shopView } = useShopContext();
  return (
    <>
      {/* =========================================================
          TAB 1: THE WEEKEND VALUE BOARD
         ========================================================= */}
      {shopView === 'BOARD' && (
        <div className="space-y-6">
          {/* Splurge Value Alerts Callout Strip */}
          <BoardAlerts />

          {/* Category & Sort Controls */}
          <BoardControls />

          {/* Main Commodity Leaderboard Grid */}
          <BoardLeaderboard />
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
    </>
  );
}
