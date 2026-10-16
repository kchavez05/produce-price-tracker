import { NextRequest, NextResponse } from 'next/server';
import { buildDashboardPayload } from '@/lib/scoring-and-matcher';
import { StoreChain } from '@/types/domain';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const zipCode = searchParams.get('zip') || '80542';
    const storeParam = (searchParams.get('store') || 'ALL') as 'ALL' | StoreChain;
    const storesParam = searchParams.get('stores') || '';
    const pinnedParam = searchParams.get('pinned') || '';
    const onHandParam = searchParams.get('onHand') || '';
    const servingsParam = parseInt(searchParams.get('servings') || '6', 10);

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

    const onHandIngredientIds = onHandParam
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const targetServings = [4, 6, 8].includes(servingsParam) ? servingsParam : 6;

    const payload = await buildDashboardPayload({
      zipCode,
      storeFilter: storeParam,
      activeStores,
      pinnedIngredientIds,
      onHandIngredientIds,
      targetServings,
    });

    return NextResponse.json(payload);
  } catch (error) {
    console.error('Error building dashboard payload:', error);
    return NextResponse.json(
      { error: 'Failed to load commodity & meal prep data' },
      { status: 500 }
    );
  }
}
