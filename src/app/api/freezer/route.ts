import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, verifySameOrigin } from '@/lib/security/rate-limit';
import {
  persistUserSyncState,
  loadInventoryState,
} from '@/lib/supabase/session';
import { FreezerItem } from '@/types/domain';

export async function GET() {
  try {
    const { freezerItems: items } = await loadInventoryState();
    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error reading freezer inventory:', error);
    return NextResponse.json(
      { error: 'Failed to load virtual freezer inventory' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!verifySameOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden cross-origin request' }, { status: 403 });
  }
  const rate = checkRateLimit(request, 'api-freezer-write', 40, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: { 'Retry-After': String(rate.resetInSeconds) } }
    );
  }

  try {
    let body: { item?: FreezerItem } | undefined;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid or malformed JSON payload' },
        { status: 400 }
      );
    }
    const item = body?.item as FreezerItem | undefined;
    if (!item || !item.canonicalIngredientId) {
      return NextResponse.json(
        { error: 'Missing required freezer item payload' },
        { status: 400 }
      );
    }

    const { profile, freezerItems: current } = await loadInventoryState(true, true);
    if (profile) {
      const existingIdx = current.findIndex(
        (f) => f.canonicalIngredientId === item.canonicalIngredientId
      );
      let savedItem: FreezerItem;
      const nextItems = [...current];
      if (existingIdx >= 0) {
        const match = current[existingIdx];
        const totalQty = Number(
          (match.quantityLbOrDoz + item.quantityLbOrDoz).toFixed(2)
        );
        const weightedPurchasePrice =
          totalQty > 0
            ? (match.quantityLbOrDoz * match.purchasePricePerUnit +
                item.quantityLbOrDoz * item.purchasePricePerUnit) /
              totalQty
            : 0;
        const weightedRegularPrice =
          totalQty > 0
            ? (match.quantityLbOrDoz * match.regularPricePerUnit +
                item.quantityLbOrDoz * item.regularPricePerUnit) /
              totalQty
            : 0;
        savedItem = {
          ...item,
          id: match.id,
          unit: item.unit === 'doz' ? 'doz' : 'lb',
          quantityLbOrDoz: totalQty,
          purchasePricePerUnit: Number(weightedPurchasePrice.toFixed(4)),
          regularPricePerUnit: Number(weightedRegularPrice.toFixed(4)),
          totalCostBasis: Number((totalQty * weightedPurchasePrice).toFixed(2)),
          estimatedSavings: Number(
            Math.max(
              0,
              totalQty * (weightedRegularPrice - weightedPurchasePrice)
            ).toFixed(2)
          ),
        };
        nextItems[existingIdx] = savedItem;
      } else {
        savedItem = {
          ...item,
          id: item.id || `frz-${item.canonicalIngredientId}-${Date.now()}`,
          unit: item.unit === 'doz' ? 'doz' : 'lb',
        };
        nextItems.unshift(savedItem);
      }
      const synced = await persistUserSyncState({
        profile,
        freezerItems: nextItems,
      });
      return NextResponse.json({ saved: savedItem, items: synced.freezerItems });
    }

    return NextResponse.json({ error: 'Session required' }, { status: 401 });
  } catch (error) {
    console.error('Error saving freezer item:', error);
    return NextResponse.json(
      { error: 'Failed to save virtual freezer item' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  if (!verifySameOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden cross-origin request' }, { status: 403 });
  }
  const rate = checkRateLimit(request, 'api-freezer-write', 40, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: { 'Retry-After': String(rate.resetInSeconds) } }
    );
  }

  try {
    const body = await request.json();
    const id = body?.id as string | undefined;
    const quantityLbOrDoz = Number(body?.quantityLbOrDoz);
    if (!id || !Number.isFinite(quantityLbOrDoz)) {
      return NextResponse.json(
        { error: 'Missing id or valid quantityLbOrDoz' },
        { status: 400 }
      );
    }

    const { profile, freezerItems: current } = await loadInventoryState(true, true);
    if (profile) {
      let updatedItem: FreezerItem | null = null;
      const nextItems: FreezerItem[] = [];
      for (const f of current) {
        if (f.id === id) {
          if (quantityLbOrDoz > 0) {
            const safeQty = Number(quantityLbOrDoz.toFixed(2));
            updatedItem = {
              ...f,
              quantityLbOrDoz: safeQty,
              totalCostBasis: Number(
                (safeQty * f.purchasePricePerUnit).toFixed(2)
              ),
              estimatedSavings: Number(
                Math.max(
                  0,
                  safeQty * (f.regularPricePerUnit - f.purchasePricePerUnit)
                ).toFixed(2)
              ),
            };
            nextItems.push(updatedItem);
          }
        } else {
          nextItems.push(f);
        }
      }
      const synced = await persistUserSyncState({
        profile,
        freezerItems: nextItems,
      });
      return NextResponse.json({
        updated: updatedItem,
        items: synced.freezerItems,
      });
    }

    return NextResponse.json({ error: 'Session required' }, { status: 401 });
  } catch (error) {
    console.error('Error updating freezer item:', error);
    return NextResponse.json(
      { error: 'Failed to update virtual freezer item' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!verifySameOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden cross-origin request' }, { status: 403 });
  }
  const rate = checkRateLimit(request, 'api-freezer-write', 40, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: { 'Retry-After': String(rate.resetInSeconds) } }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { error: 'Missing freezer item id' },
        { status: 400 }
      );
    }

    const { profile, freezerItems: current } = await loadInventoryState(true, true);
    if (profile) {
      const nextItems = current.filter((f) => f.id !== id);
      const synced = await persistUserSyncState({
        profile,
        freezerItems: nextItems,
      });
      return NextResponse.json({ ok: true, items: synced.freezerItems });
    }

    return NextResponse.json({ error: 'Session required' }, { status: 401 });
  } catch (error) {
    console.error('Error deleting freezer item:', error);
    return NextResponse.json(
      { error: 'Failed to delete virtual freezer item' },
      { status: 500 }
    );
  }
}
