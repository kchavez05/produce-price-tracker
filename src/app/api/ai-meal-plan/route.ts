import { applyPantryToRecipe } from '@/lib/pantry/recipe';
import { readProfilePantryAvailability } from '@/lib/pantry/server';
import { pantryCatalog } from '@/lib/pantry/model';
import { checkRateLimit, verifySameOrigin } from '@/lib/security/rate-limit';
import { loadInventoryState, resolveCurrentUserProfile } from '@/lib/supabase/session';
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { buildDashboardPayload } from '@/lib/scoring-and-matcher';
import {
  CookingVesselArchetype,
  DietaryConstraint,
  MacroGoal,
  RecommendedDish,
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

    const serverApiKey = process.env.GEMINI_API_KEY?.trim();
    if (!clientApiKey && serverApiKey) {
      const { profile } = await resolveCurrentUserProfile();
      if (!profile?.isCloudBacked) {
        return NextResponse.json({ error: 'Sign in with a verified account or supply your own Gemini key.' }, { status: 401 });
      }
      // Account-level limit also prevents bypass by changing client IPs.
      const accountRate = checkRateLimit(request, `ai-account:${profile.id}`, 10, 60_000, profile.id);
      if (!accountRate.allowed) {
        return NextResponse.json({ error: 'Meal-plan quota reached' }, {
          status: 429, headers: { 'Retry-After': String(accountRate.resetInSeconds) },
        });
      }
    }
    const apiKey = clientApiKey || serverApiKey;
    const zipCode: string = (body?.zipCode || '80542').trim();
    const cityLabel: string = (body?.cityLabel || 'Local Area').trim();

    const inventory = await loadInventoryState();
    const pantryMode = process.env.PANTRYBOT_PANTRY_ENABLED === 'true';
    if (pantryMode) onHandIngredientIds = Array.isArray(body?.onHandIngredientIds)
      ? onHandIngredientIds.filter((id) => typeof id === 'string' && pantryCatalog.has(id))
      : await readProfilePantryAvailability(inventory.profile);
    const dashboard = await buildDashboardPayload({
      freezerInventory: process.env.PANTRYBOT_PANTRY_ENABLED === 'true' ? [] : inventory.freezerItems,
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

    if (!apiKey) {
      return NextResponse.json(
        {
          usedAi: false,
          message:
            'No Gemini API key detected in .env.local or Quick Settings. Returned algorithmic top 3 meal-prep matches tailored to your Macro & Dietary profile! Add a free Google AI Studio key anytime to unlock custom AI recipes.',
          dishes: dashboard.recommendedTrio,
        },
        { status: 200 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const freezerIds = new Set(
      (dashboard.freezerInventory || []).map((f) => f.canonicalIngredientId)
    );
    const combinedOnHand = new Set([...onHandIngredientIds, ...freezerIds]);

    const topDealsContext = dashboard.commodities.slice(0, 18).map((c) => ({
      ingredientId: c.ingredient.id,
      name: c.ingredient.name,
      category: c.ingredient.category,
      unit: c.ingredient.standardUnit,
      bestStore: c.bestOffer.store,
      normalizedPricePerUnit: c.bestOffer.normalizedPricePerUnit,
      regularPricePerUnit: c.bestOffer.regularPricePerUnit,
      rawDealText: c.bestOffer.rawPriceText,
      dealType: c.bestOffer.dealType,
      dealConditions: c.bestOffer.dealConditions,
      isUserPinned: pinnedIngredientIds.includes(c.ingredient.id),
      isOnHand: combinedOnHand.has(c.ingredient.id),
    }));

    const prompt = `You are a weekend meal-prep chef and grocery value optimizer for a household in ${cityLabel} (${zipCode}) shopping at local supermarkets.
The user strongly prefers LOW-EFFORT, REHEATABLE BATCH MEALS: stews, slow-cooker braises, Dutch oven chilis, curries, sheet-pan roasts, and 9x13 oven casseroles/bakes over multi-component plated meals.
We need exactly 3 distinct batch-prep dishes (${targetServings} servings each) that maximize use of the cheapest on-sale ingredients below ${pantryMode ? '(favor available and pinned ingredients when compatible with strict dietary constraints)' : '(and MUST incorporate any ingredients where isUserPinned or isOnHand is true)'}.

Household Nutrition & Cooking Profile (Milestone v1.2):
- Target Macro Profile: ${macroGoal} ${macroGoal === 'HIGH_PROTEIN' ? '(Target >= 40g protein per serving)' : macroGoal === 'LOW_CARB_KETO' ? '(Target <= 20g net carbs per serving; use cauliflower, cabbage, zucchini, mushrooms, or greens instead of potatoes/beans)' : macroGoal === 'CALORIE_CONSCIOUS' ? '(Target <= 460 kcal per serving)' : '(Balanced macros)'}
- Strict Dietary Constraints: ${dietaryConstraints.length > 0 ? dietaryConstraints.join(', ') : 'None'}
- Preferred Cooking Vessel Archetype: ${applianceFilter}
- User custom note/request: "${customPreference || 'Low-effort reheatable stews, braises, sheet-pan roasts, chilis, or casseroles with great flavor variety across the 3 dishes.'}"

Live ${cityLabel} (${zipCode}) Sale Ingredients JSON:
${JSON.stringify(topDealsContext, null, 2)}

${pantryMode ? `Available catalog IDs: ${JSON.stringify(onHandIngredientIds)}. Pantry availability is boolean and does not imply quantity sufficiency. Favor available ingredients only when compatible with strict dietary constraints and the user request. Never deduct inventory. Put every staple in pantryRequirements using an exact catalog ID, quantity for the entire batch, and the listed kitchen unit. Use an unmapped ID and displayName for ingredients outside this catalog; never invent an identity or price. pantryStaples must be empty when pantryRequirements are supplied. Fixed pantry catalog: ${JSON.stringify([...pantryCatalog.values()].filter((entry) => entry.staticPrice))}` : ''}

Calculate realistic batch costs using the exact normalizedPricePerUnit values provided (set slotCost to 0 if isOnHand is true).`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              subtitle: { type: Type.STRING },
              style: {
                type: Type.STRING,
                enum: ['STEW_BRAISE', 'CHILI_SOUP', 'CASSEROLE_BAKE', 'CURRY_SKILLET'],
              },
              appliance: { type: Type.STRING },
              servings: { type: Type.NUMBER },
              prepTimeMinutes: { type: Type.NUMBER },
              cookTimeMinutes: { type: Type.NUMBER },
              freezerFriendly: { type: Type.BOOLEAN },
              flavorProfile: { type: Type.STRING },
              macrosPerServing: {
                type: Type.OBJECT,
                properties: {
                  calories: { type: Type.NUMBER },
                  proteinGrams: { type: Type.NUMBER },
                  carbsGrams: { type: Type.NUMBER },
                  fatGrams: { type: Type.NUMBER },
                },
                required: ['calories', 'proteinGrams', 'carbsGrams', 'fatGrams'],
              },
              estimatedPantryCost: { type: Type.NUMBER },
              pantryStaples: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              pantryRequirements: {
                type: Type.ARRAY, items: { type: Type.OBJECT, properties: {
                  ingredientId: { type: Type.STRING }, displayName: { type: Type.STRING },
                  quantity: { type: Type.NUMBER }, unit: { type: Type.STRING }, optional: { type: Type.BOOLEAN },
                }, required: ['ingredientId', 'quantity', 'unit'] },
              },
              steps: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              reheatTip: { type: Type.STRING },
              matchedIngredients: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    slotLabel: { type: Type.STRING },
                    ingredientId: { type: Type.STRING },
                    ingredientName: { type: Type.STRING },
                    quantityUsed: { type: Type.NUMBER },
                    unit: { type: Type.STRING, enum: ['lb', 'doz'] },
                    store: {
                      type: Type.STRING,
                      enum: [
                        'KING_SOOPERS',
                        'SAFEWAY',
                        'ALDI',
                        'WALMART',
                        'TARGET',
                        'SPROUTS',
                      ],
                    },
                    rawDealText: { type: Type.STRING },
                    dealType: {
                      type: Type.STRING,
                      enum: [
                        'SHELF_OR_MEMBER',
                        'DIGITAL_COUPON',
                        'MULTI_BUY',
                        'EVERYDAY_LOW',
                      ],
                    },
                    unitCost: { type: Type.NUMBER },
                    slotCost: { type: Type.NUMBER },
                    regularSlotCost: { type: Type.NUMBER },
                    isUserPinned: { type: Type.BOOLEAN },
                    isOnHand: { type: Type.BOOLEAN },
                  },
                  required: [
                    'slotLabel',
                    'ingredientId',
                    'ingredientName',
                    'quantityUsed',
                    'unit',
                    'store',
                    'rawDealText',
                    'dealType',
                    'unitCost',
                    'slotCost',
                    'regularSlotCost',
                    'isUserPinned',
                  ],
                },
              },
            },
            required: [
              'id',
              'title',
              'subtitle',
              'style',
              'appliance',
              'servings',
              'prepTimeMinutes',
              'cookTimeMinutes',
              'freezerFriendly',
              'flavorProfile',
              'macrosPerServing',
              'estimatedPantryCost',
              'pantryStaples',
              ...(pantryMode ? ['pantryRequirements'] : []),
              'steps',
              'reheatTip',
              'matchedIngredients',
            ],
          },
        },
      },
    });

    const parsed = JSON.parse(response.text || '[]') as RecommendedDish[];
    const enrichedDishes: RecommendedDish[] = parsed.map((d, idx) => {
      const storeSum = (d.matchedIngredients || []).reduce(
        (acc, m) => acc + (m.isOnHand ? 0 : Number(m.slotCost) || 0),
        0
      );
      const regSum = (d.matchedIngredients || []).reduce(
        (acc, m) => acc + (Number(m.regularSlotCost) || Number(m.slotCost) * 1.5),
        0
      );
      const pantry = Number(d.estimatedPantryCost) || 2.0;
      const totalBatchCost = Number((storeSum + pantry).toFixed(2));
      const regularBatchCost = Number((regSum + pantry).toFixed(2));
      const totalBatchSavings = Number(
        Math.max(0, regularBatchCost - totalBatchCost).toFixed(2)
      );
      const servings = d.servings || targetServings;
      const costPerServing = Number((totalBatchCost / servings).toFixed(2));

      const macros = d.macrosPerServing || {
        calories: 475,
        proteinGrams: 40,
        carbsGrams: 34,
        fatGrams: 19,
      };

      const macroBadges: string[] = [];
      if (macros.proteinGrams >= 40) {
        macroBadges.push(`💪 High-Protein (${macros.proteinGrams}g)`);
      }
      if (macros.carbsGrams <= 20) {
        macroBadges.push(`🥑 Keto / Low-Carb (${macros.carbsGrams}g Net Carbs)`);
      }
      if (macros.calories <= 460) {
        macroBadges.push(`🔥 Calorie-Conscious (${macros.calories} kcal)`);
      }

      const enriched = {
        ...d,
        id: d.id || `gemini-dish-${Date.now()}-${idx + 1}`,
        servings,
        macrosPerServing: macros,
        dietaryTags: dietaryConstraints,
        macroBadges,
        totalBatchCost,
        regularBatchCost,
        totalBatchSavings,
        costPerServing,
        dishMatchScore: 98 - idx * 2,
        aiGenerated: true,
        savedInLibrary: false,
      };
      return pantryMode ? applyPantryToRecipe(enriched, onHandIngredientIds, dashboard.commodities) : enriched;
    });

    return NextResponse.json({
      usedAi: true,
      message: 'Generated custom 3-dish meal prep plan with Gemini 2.5 Flash!',
      dishes: enrichedDishes,
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown Gemini API error';
    return NextResponse.json(
      {
        usedAi: false,
        error: `Gemini generation failed: ${errMsg}`,
      },
      { status: 500 }
    );
  }
}
