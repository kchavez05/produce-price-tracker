import { NextRequest, NextResponse } from 'next/server';
import { loadInventoryState, persistUserSyncState } from '@/lib/supabase/session';
import { checkRateLimit, verifySameOrigin } from '@/lib/security/rate-limit';
import { RecommendedDish } from '@/types/domain';

export async function GET() {
  const { savedRecipes: recipes } = await loadInventoryState();
  return NextResponse.json({ recipes });
}

function checkMutation(request: NextRequest) {
  if (!verifySameOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden cross-origin request' }, { status: 403 });
  }
  const rate = checkRateLimit(request, 'api-recipes-write', 40, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, {
      status: 429, headers: { 'Retry-After': String(rate.resetInSeconds) },
    });
  }
}

export async function POST(request: NextRequest) {
  const blocked = checkMutation(request);
  if (blocked) return blocked;
  try {
    const body = await request.json().catch(() => null);
    const dish = body?.dish as RecommendedDish | undefined;
    if (!dish || typeof dish.id !== 'string' || !dish.id ||
        typeof dish.title !== 'string' || typeof dish.style !== 'string' ||
        !Array.isArray(dish.matchedIngredients) || !Array.isArray(dish.pantryStaples)) {
      return NextResponse.json({ error: 'Missing or invalid dish payload' }, { status: 400 });
    }
    const { profile, savedRecipes } = await loadInventoryState(true, true);
    if (!profile) return NextResponse.json({ error: 'Session required' }, { status: 401 });
    const updated = await persistUserSyncState({
      profile,
      savedRecipes: [...savedRecipes.filter((r) => r.id !== dish.id), { ...dish, savedInLibrary: true }],
    });
    return NextResponse.json({ saved: true, recipes: updated.savedRecipes });
  } catch {
    return NextResponse.json({ error: 'Failed to save recipe' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const blocked = checkMutation(request);
  if (blocked) return blocked;
  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing recipe id' }, { status: 400 });
  try {
    const { profile, savedRecipes } = await loadInventoryState(false, true);
    if (!profile) return NextResponse.json({ deleted: true, recipes: [] });
    const updated = await persistUserSyncState({
      profile, savedRecipes: savedRecipes.filter((r) => r.id !== id),
    });
    return NextResponse.json({ deleted: true, recipes: updated.savedRecipes });
  } catch {
    return NextResponse.json({ error: 'Failed to delete recipe' }, { status: 500 });
  }
}
