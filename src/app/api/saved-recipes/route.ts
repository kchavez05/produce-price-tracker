import { NextRequest, NextResponse } from 'next/server';
import {
  deleteSavedRecipeFromSqlite,
  getSavedRecipesFromSqlite,
  saveRecipeToSqlite,
} from '@/lib/db/sqlite';

export async function GET() {
  const recipes = getSavedRecipesFromSqlite();
  return NextResponse.json({ recipes });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const dish = body?.dish;
    if (!dish || !dish.id) {
      return NextResponse.json({ error: 'Missing dish payload' }, { status: 400 });
    }
    saveRecipeToSqlite(dish.id, { ...dish, savedInLibrary: true });
    return NextResponse.json({
      saved: true,
      recipes: getSavedRecipesFromSqlite(),
    });
  } catch {
    return NextResponse.json({ error: 'Failed to save recipe' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (id) {
    deleteSavedRecipeFromSqlite(id);
  }
  return NextResponse.json({
    deleted: true,
    recipes: getSavedRecipesFromSqlite(),
  });
}
