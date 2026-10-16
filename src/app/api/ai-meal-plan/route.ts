import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { buildDashboardPayload } from '@/lib/scoring-and-matcher';
import { RecommendedDish, StoreChain } from '@/types/domain';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const pinnedIngredientIds: string[] = Array.isArray(body?.pinnedIngredientIds)
      ? body.pinnedIngredientIds
      : [];
    const customPreference: string = (body?.customPreference || '').trim();
    const storeFilter: 'ALL' | StoreChain = body?.storeFilter || 'ALL';
    const clientApiKey: string = (body?.geminiApiKey || '').trim();

    const apiKey = clientApiKey || process.env.GEMINI_API_KEY?.trim();

    const dashboard = await buildDashboardPayload({
      zipCode: '80542',
      storeFilter,
      pinnedIngredientIds,
    });

    if (!apiKey) {
      return NextResponse.json(
        {
          usedAi: false,
          message:
            'No Gemini API key detected in .env.local or Quick Settings. Returned algorithmic top 3 stew/casserole matches. Add a free Google AI Studio key anytime to unlock custom AI recipes!',
          dishes: dashboard.recommendedTrio,
        },
        { status: 200 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    // Prepare compact deal context for Gemini 2.5 Flash
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
    }));

    const prompt = `You are a weekend meal-prep chef and grocery value optimizer for a household in Mead, Colorado (80542) shopping at King Soopers and Safeway.
The user strongly prefers LOW-EFFORT, REHEATABLE ONE-POT MEALS: stews, slow-cooker braises, Dutch oven chilis, curries, and 9x13 oven casseroles/bakes over multi-component plated meals.
We need exactly 3 distinct batch-prep dishes (6 servings each) that maximize use of the cheapest on-sale ingredients below (and MUST incorporate any ingredients where isUserPinned is true).

User custom note/request: "${customPreference || 'Low-effort reheatable stews, braises, chilis, or casseroles with great flavor variety across the 3 dishes.'}"

Live Mead, CO (80542) Sale Ingredients JSON:
${JSON.stringify(topDealsContext, null, 2)}

Calculate realistic batch costs using the exact normalizedPricePerUnit values provided.`;

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
                    store: { type: Type.STRING, enum: ['KING_SOOPERS', 'SAFEWAY'] },
                    rawDealText: { type: Type.STRING },
                    dealType: {
                      type: Type.STRING,
                      enum: ['SHELF_OR_MEMBER', 'DIGITAL_COUPON', 'MULTI_BUY', 'EVERYDAY_LOW'],
                    },
                    unitCost: { type: Type.NUMBER },
                    slotCost: { type: Type.NUMBER },
                    regularSlotCost: { type: Type.NUMBER },
                    isUserPinned: { type: Type.BOOLEAN },
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
        (acc, m) => acc + (Number(m.slotCost) || 0),
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
      const servings = d.servings || 6;
      const costPerServing = Number((totalBatchCost / servings).toFixed(2));

      return {
        ...d,
        id: d.id || `gemini-dish-${idx + 1}`,
        servings,
        totalBatchCost,
        regularBatchCost,
        totalBatchSavings,
        costPerServing,
        dishMatchScore: 98 - idx * 2,
        aiGenerated: true,
      };
    });

    return NextResponse.json({
      usedAi: true,
      message: 'Generated custom 3-dish one-pot meal prep plan with Gemini 2.5 Flash!',
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
