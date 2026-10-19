import {
  CanonicalIngredient,
  DealType,
  DishStyle,
  RecommendedDish,
  ScoredCommodity,
  StoreChain,
  StoreOffer,
} from '@/types/domain';

export function createMockIngredient(
  overrides?: Partial<CanonicalIngredient>
): CanonicalIngredient {
  return {
    id: 'test-ingredient',
    name: 'Test Ingredient',
    category: 'PRODUCE',
    subcategory: 'Staple',
    standardUnit: 'lb',
    avgEachWeightLb: 0.5,
    matchKeywords: ['test'],
    mountainBaselinePerUnit: 1.99,
    typicalRegularPerUnit: 2.99,
    splurgeThresholdPerUnit: 4.99,
    usdaSignal: {
      trend: 'STABLE',
      wholesaleChangePct: 0,
      mountainAdFeaturePct: 20,
      note: 'Normal seasonal range',
      usdaReportSlug: '3324',
    },
    ...overrides,
  };
}

export function createMockOffer(overrides?: Partial<StoreOffer>): StoreOffer {
  return {
    id: `offer-${Date.now()}-${Math.random()}`,
    canonicalIngredientId: 'test-ingredient',
    store: 'KING_SOOPERS',
    storeLocationLabel: 'King Soopers (Firestone)',
    rawTitle: 'Test Offer',
    rawPriceText: '$1.99 / lb',
    salePrice: 1.99,
    saleUnit: 'lb',
    normalizedPricePerUnit: 1.99,
    regularPricePerUnit: 2.99,
    dealType: 'SHELF_OR_MEMBER',
    validFrom: '2026-10-14',
    validTo: '2026-10-20',
    source: 'CURATED_FALLBACK',
    ...overrides,
  };
}

export function createMockDish(
  overrides?: Partial<RecommendedDish>
): RecommendedDish {
  return {
    id: `dish-${Date.now()}`,
    title: 'Test Dish',
    subtitle: 'Healthy batch meal',
    style: 'STEW_BRAISE',
    appliance: 'DUTCH_OVEN',
    servings: 6,
    prepTimeMinutes: 15,
    cookTimeMinutes: 45,
    freezerFriendly: true,
    flavorProfile: 'Savory & Rich',
    macrosPerServing: {
      calories: 400,
      proteinGrams: 35,
      carbsGrams: 20,
      fatGrams: 12,
    },
    matchedIngredients: [],
    pantryStaples: ['Salt', 'Black Pepper'],
    estimatedPantryCost: 0.5,
    totalBatchCost: 10.0,
    regularBatchCost: 18.0,
    totalBatchSavings: 8.0,
    costPerServing: 1.67,
    dishMatchScore: 90,
    steps: ['Sear protein', 'Add vegetables', 'Simmer until tender'],
    reheatTip: 'Reheat gently on stovetop',
    ...overrides,
  };
}

export function createMockCommodity(
  overrides?: Partial<ScoredCommodity>
): ScoredCommodity {
  const ingredient = overrides?.ingredient || createMockIngredient();
  const bestOffer = overrides?.bestOffer || createMockOffer({ canonicalIngredientId: ingredient.id });
  return {
    ingredient,
    bestOffer,
    valueScore: 85,
    affordabilityScore: 85,
    discountDepthScore: 80,
    wholesaleBonusScore: 60,
    discountVsBaselinePct: 0.3,
    discountVsRegularPct: 0.4,
    isSplurgeAlert: false,
    actionTag: 'STOCK_UP_ANCHOR',
    priceHistory: [],
    sixWeekLocalAvg: 1.99,
    sixWeekLow: 1.99,
    storeOffers: {
      [bestOffer.store]: bestOffer,
    },
    ...overrides,
  };
}
