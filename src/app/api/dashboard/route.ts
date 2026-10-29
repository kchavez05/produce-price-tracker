import { readProfilePantryAvailability } from '@/lib/pantry/server';
import { pantryCatalog } from '@/lib/pantry/model';
import { loadInventoryState } from '@/lib/supabase/session';
import { NextRequest, NextResponse } from 'next/server';
import { buildDashboardPayload } from '@/lib/scoring-and-matcher';
import { requestMarket, finishMarket } from '@/lib/market/active';
import { checkRateLimit } from '@/lib/security/rate-limit';
import {
  CookingVesselArchetype,
  DietaryConstraint,
  MacroGoal,
  StoreChain,
} from '@/types/domain';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!checkRateLimit(request, 'dashboard', 30).allowed)
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  try {
    const { searchParams } = new URL(request.url);
    const zipCode = searchParams.get('zip') || '80542';
    if (!/^\d{5}$/.test(zipCode)) return NextResponse.json({ error: 'Invalid ZIP' }, { status: 400 });
    const storeParam = (searchParams.get('store') || 'ALL') as 'ALL' | StoreChain;
    const storesParam = searchParams.get('stores') || '';
    const pinnedParam = searchParams.get('pinned') || '';
    const onHandParam = searchParams.get('onHand') || '';
    const servingsParam = parseInt(searchParams.get('servings') || '6', 10);
    const macroGoal = (searchParams.get('macroGoal') || 'ANY') as MacroGoal;
    const dietaryParam = searchParams.get('dietary') || '';
    const applianceFilter = (searchParams.get('vessel') ||
      'ANY') as CookingVesselArchetype;

    const activeStores = storesParam
      ? (storesParam
          .split(',')
          .map((s) => s.trim().toUpperCase())
          .filter(Boolean) as StoreChain[])
      : undefined;

    const pinnedIngredientIds = pinnedParam
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    let onHandIngredientIds = onHandParam
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const dietaryConstraints = dietaryParam
      ? (dietaryParam
          .split(',')
          .map((s) => s.trim().toUpperCase())
          .filter(Boolean) as DietaryConstraint[])
      : [];

    const targetServings = [4, 6, 8].includes(servingsParam) ? servingsParam : 6;

    const inventory = await loadInventoryState();
    if (process.env.PANTRYBOT_PANTRY_ENABLED === 'true') {
      onHandIngredientIds = searchParams.has('onHand') ? onHandIngredientIds.filter((id) => pantryCatalog.has(id))
        : await readProfilePantryAvailability(inventory.profile);
    }
    const marketClaim = await requestMarket(zipCode);
    const payload = await buildDashboardPayload({
      archiveHistory: Boolean(marketClaim),
      freezerInventory: process.env.PANTRYBOT_PANTRY_ENABLED === 'true' ? [] : inventory.freezerItems,
      savedRecipes: inventory.savedRecipes,
      zipCode,
      storeFilter: storeParam,
      activeStores,
      pinnedIngredientIds,
      onHandIngredientIds,
      targetServings,
      macroGoal,
      dietaryConstraints,
      applianceFilter,
    }).catch(async (error: unknown) => {
      if (marketClaim) await finishMarket(marketClaim, false)
        .catch(() => console.error('active_market_finish_failed'));
      throw error;
    });
    if (marketClaim) {
      await finishMarket(marketClaim,
        payload.marketHistory?.archiveStorage === 'cloud' && (payload.freshness?.usableLiveOffers ?? 0) > 0
      ).catch(() => console.error('active_market_finish_failed'));
    }

    return NextResponse.json(payload, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('Error building dashboard payload:', error);
    return NextResponse.json(
      { error: 'Failed to load commodity & meal prep data' },
      { status: 500 }
    );
  }
}
