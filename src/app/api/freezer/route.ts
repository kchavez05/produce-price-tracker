import { NextRequest, NextResponse } from 'next/server';
import {
  deleteFreezerItemFromSqlite,
  getFreezerItemsFromSqlite,
  updateFreezerItemQuantityInSqlite,
  upsertFreezerItemToSqlite,
} from '@/lib/db/sqlite';
import { FreezerItem } from '@/types/domain';

export async function GET() {
  try {
    const items = getFreezerItemsFromSqlite();
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
  try {
    const body = await request.json();
    const item = body?.item as FreezerItem | undefined;
    if (!item || !item.canonicalIngredientId) {
      return NextResponse.json(
        { error: 'Missing required freezer item payload' },
        { status: 400 }
      );
    }
    const saved = upsertFreezerItemToSqlite(item);
    const items = getFreezerItemsFromSqlite();
    return NextResponse.json({ saved, items });
  } catch (error) {
    console.error('Error saving freezer item:', error);
    return NextResponse.json(
      { error: 'Failed to save virtual freezer item' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const id = body?.id as string | undefined;
    const quantityLbOrDoz = Number(body?.quantityLbOrDoz);
    if (!id || Number.isNaN(quantityLbOrDoz)) {
      return NextResponse.json(
        { error: 'Missing id or valid quantityLbOrDoz' },
        { status: 400 }
      );
    }
    const updated = updateFreezerItemQuantityInSqlite(id, quantityLbOrDoz);
    const items = getFreezerItemsFromSqlite();
    return NextResponse.json({ updated, items });
  } catch (error) {
    console.error('Error updating freezer item:', error);
    return NextResponse.json(
      { error: 'Failed to update virtual freezer item' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { error: 'Missing freezer item id' },
        { status: 400 }
      );
    }
    deleteFreezerItemFromSqlite(id);
    const items = getFreezerItemsFromSqlite();
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    console.error('Error deleting freezer item:', error);
    return NextResponse.json(
      { error: 'Failed to delete virtual freezer item' },
      { status: 500 }
    );
  }
}
