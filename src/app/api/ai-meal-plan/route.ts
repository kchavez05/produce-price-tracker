import { readProfilePantryAvailability } from '@/lib/pantry/server';
import { pantryCatalog } from '@/lib/pantry/model';
import { checkRateLimit, verifySameOrigin } from '@/lib/security/rate-limit';
import { loadInventoryState, resolveCurrentUserProfile } from '@/lib/supabase/session';
import { NextRequest, NextResponse } from 'next/server';
import { createRecipeProvider } from '@/lib/ai/providers';
import { generateMealPlan } from '@/lib/ai/meal-plan';
import { AiGenerationError } from '@/lib/ai/errors';
import { buildDashboardPayload } from '@/lib/scoring-and-matcher';
import {
  CookingVesselArchetype,
  DietaryConstraint,
  MacroGoal,
  StoreChain,
} from '@/types/domain';

export async function POST(request: NextRequest) {
  if (!verifySameOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden cross-origin request' }, { status: 403 });
  }
  const rate = checkRateLimit(request, 'api-ai-meal-plan', 10, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Too many meal-plan requests' }, {
      status: 429, headers: { 'Retry-After': String(rate.resetInSeconds) },
    });
  }
  try {
    const body = await request.json();
    const pinnedIngredientIds: string[] = Array.isArray(body?.pinnedIngredientIds)
      ? body.pinnedIngredientIds
      : [];
    let onHandIngredientIds: string[] = Array.isArray(body?.onHandIngredientIds)
      ? body.onHandIngredientIds
      : [];
    const targetServings = [4, 6, 8].includes(Number(body?.targetServings)) ? Number(body.targetServings) : 6;
    const customPreference: string = (body?.customPreference || '').trim();
    const storeFilter: 'ALL' | StoreChain = body?.storeFilter || 'ALL';
    const clientApiKey: string = (body?.geminiApiKey || '').trim();
    const macroGoal: MacroGoal = body?.macroGoal || 'ANY';
    const dietaryConstraints: DietaryConstraint[] = Array.isArray(
      body?.dietaryConstraints
    )
      ? body.dietaryConstraints
      : [];
    const applianceFilter: CookingVesselArchetype =
      body?.applianceFilter || 'ANY';

    const provider = createRecipeProvider(clientApiKey);
    if (!clientApiKey && provider) {
      const { profile } = await resolveCurrentUserProfile();
      if (!profile?.isCloudBacked) {
        return NextResponse.json({ error: 'Sign in with a verified account or supply your own Gemini key.' }, { status: 401 });
      }
      // Account-level limit also prevents bypass by changing client IPs.
      const accountRate = checkRateLimit(request, 'ai-account', 10, 60_000, profile.id);
      if (!accountRate.allowed) {
        return NextResponse.json({ error: 'Meal-plan quota reached' }, {
          status: 429, headers: { 'Retry-After': String(accountRate.resetInSeconds) },
        });
      }
    }
    const zipCode: string = (body?.zipCode || '80542').trim();
    const cityLabel: string = (body?.cityLabel || 'Local Area').trim();

    const inventory = await loadInventoryState();
    onHandIngredientIds = Array.isArray(body?.onHandIngredientIds)
      ? onHandIngredientIds.filter((id) => typeof id === 'string' && pantryCatalog.has(id))
      : await readProfilePantryAvailability(inventory.profile);
    const dashboard = await buildDashboardPayload({
      savedRecipes: inventory.savedRecipes,
      zipCode,
      storeFilter,
      pinnedIngredientIds,
      onHandIngredientIds,
      targetServings,
      macroGoal,
      dietaryConstraints,
      applianceFilter,
    });

    if (!provider) {
      return NextResponse.json(
        {
          usedAi: false,
          message:
            'AI generation is not configured. Returned standard meal-prep suggestions tailored to your preferences.',
          dishes: dashboard.recommendedTrio,
        },
        { status: 200 }
      );
    }

    const enrichedDishes = await generateMealPlan(provider, { dashboard, pinnedIngredientIds, onHandIngredientIds,
      targetServings, macroGoal, dietaryConstraints, applianceFilter, customPreference, zipCode, cityLabel }, { signal: request.signal });

    return NextResponse.json({
      usedAi: true,
      message: 'Generated a custom 3-dish meal-prep plan!',
      dishes: enrichedDishes,
    });
  } catch (error: unknown) {
    const known = error instanceof AiGenerationError ? error : null;
    return NextResponse.json({ usedAi: false, code: known?.code ?? 'SERVICE_UNAVAILABLE',
      error: known?.message ?? 'Unable to generate a meal plan. Please try again or use standard suggestions.' },
    { status: known?.code === 'TIMEOUT' ? 504 : known ? 502 : 500 });
  }
}
