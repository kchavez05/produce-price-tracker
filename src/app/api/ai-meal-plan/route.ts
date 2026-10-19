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
  try {
    const body = await request.json();
    const pinnedIngredientIds: string[] = Array.isArray(body?.pinnedIngredientIds)
      ? body.pinnedIngredientIds
      : [];
    const onHandIngredientIds: string[] = Array.isArray(body?.onHandIngredientIds)
      ? body.onHandIngredientIds
      : [];
    const targetServings: number = Number(body?.targetServings) || 6;
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

    const apiKey = clientApiKey || process.env.GEMINI_API_KEY?.trim();
    const zipCode: string = (body?.zipCode || '80542').trim();
    const cityLabel: string = (body?.cityLabel || 'Local Area').trim();

    const dashboard = await buildDashboardPayload({
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
We need exactly 3 distinct batch-prep dishes (${targetServings} servings each) that maximize use of the cheapest on-sale ingredients below (and MUST incorporate any ingredients where isUserPinned or isOnHand is true).

Household Nutrition & Cooking Profile (Milestone v1.2):
- Target Macro Profile: ${macroGoal} ${macroGoal === 'HIGH_PROTEIN' ? '(Target >= 40g protein per serving)' : macroGoal === 'LOW_CARB_KETO' ? '(Target <= 20g net carbs per serving; use cauliflower, cabbage, zucchini, mushrooms, or greens instead of potatoes/beans)' : macroGoal === 'CALORIE_CONSCIOUS' ? '(Target <= 460 kcal per serving)' : '(Balanced macros)'}
- Strict Dietary Constraints: ${dietaryConstraints.length > 0 ? dietaryConstraints.join(', ') : 'None'}
- Preferred Cooking Vessel Archetype: ${applianceFilter}
- User custom note/request: "${customPreference || 'Low-effort reheatable stews, braises, sheet-pan roasts, chilis, or casseroles with great flavor variety across the 3 dishes.'}"

Live ${cityLabel} (${zipCode}) Sale Ingredients JSON:
${JSON.stringify(topDealsContext, null, 2)}

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

      return {
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
