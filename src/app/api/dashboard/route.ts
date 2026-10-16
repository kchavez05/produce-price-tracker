import { NextRequest, NextResponse } from 'next/server';
import { buildDashboardPayload } from '@/lib/scoring-and-matcher';
import { StoreChain } from '@/types/domain';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const zipCode = searchParams.get('zip') || '80542';
    const storeParam = (searchParams.get('store') || 'ALL') as 'ALL' | StoreChain;
    const pinnedParam = searchParams.get('pinned') || '';
    const pinnedIngredientIds = pinnedParam
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = await buildDashboardPayload({
      zipCode,
      storeFilter: storeParam,
      pinnedIngredientIds,
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
