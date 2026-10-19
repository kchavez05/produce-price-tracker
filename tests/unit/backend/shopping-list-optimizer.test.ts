import { describe, it, expect } from 'vitest';
import { buildShoppingListAndStoreComparison } from '@/lib/shopping-list';
import {
  createMockCommodity,
  createMockDish,
  createMockIngredient,
  createMockOffer,
} from 'tests/test-utils';

describe('shopping-list-optimizer: buildShoppingListAndStoreComparison', () => {
  const chickenIng = createMockIngredient({
    id: 'chicken-thighs-boneless',
    name: 'Boneless Skinless Chicken Thighs',
    category: 'PROTEIN',
    standardUnit: 'lb',
    mountainBaselinePerUnit: 3.49,
    typicalRegularPerUnit: 4.49,
  });

  const carrotsIng = createMockIngredient({
    id: 'carrots-whole-baby',
    name: 'Whole or Baby Carrots',
    category: 'PRODUCE',
    standardUnit: 'lb',
    mountainBaselinePerUnit: 1.19,
    typicalRegularPerUnit: 1.49,
  });

  const ksChickenOffer = createMockOffer({
    id: 'ks-chicken',
    canonicalIngredientId: 'chicken-thighs-boneless',
    store: 'KING_SOOPERS',
    normalizedPricePerUnit: 1.99,
    regularPricePerUnit: 4.49,
    dealType: 'SHELF_OR_MEMBER',
  });

  const swChickenOffer = createMockOffer({
    id: 'sw-chicken',
    canonicalIngredientId: 'chicken-thighs-boneless',
    store: 'SAFEWAY',
    normalizedPricePerUnit: 2.99,
    regularPricePerUnit: 4.49,
    dealType: 'SHELF_OR_MEMBER',
  });

  const aldiChickenOffer = createMockOffer({
    id: 'aldi-chicken',
    canonicalIngredientId: 'chicken-thighs-boneless',
    store: 'ALDI',
    normalizedPricePerUnit: 2.29,
    regularPricePerUnit: 3.99,
    dealType: 'EVERYDAY_LOW',
  });

  const ksCarrotsOffer = createMockOffer({
    id: 'ks-carrots',
    canonicalIngredientId: 'carrots-whole-baby',
    store: 'KING_SOOPERS',
    normalizedPricePerUnit: 1.29,
    regularPricePerUnit: 1.49,
    dealType: 'SHELF_OR_MEMBER',
  });

  const swCarrotsOffer = createMockOffer({
    id: 'sw-carrots',
    canonicalIngredientId: 'carrots-whole-baby',
    store: 'SAFEWAY',
    normalizedPricePerUnit: 0.88,
    regularPricePerUnit: 1.49,
    dealType: 'SHELF_OR_MEMBER',
  });

  const mockCommodityChicken = createMockCommodity({
    ingredient: chickenIng,
    bestOffer: ksChickenOffer,
    storeOffers: {
      KING_SOOPERS: ksChickenOffer,
      SAFEWAY: swChickenOffer,
      ALDI: aldiChickenOffer,
    },
  });

  const mockCommodityCarrots = createMockCommodity({
    ingredient: carrotsIng,
    bestOffer: swCarrotsOffer,
    storeOffers: {
      KING_SOOPERS: ksCarrotsOffer,
      SAFEWAY: swCarrotsOffer,
    },
  });

  const dish1 = createMockDish({
    id: 'dish-1',
    title: 'Braised Chicken & Carrots',
    style: 'STEW_BRAISE',
    matchedIngredients: [
      {
        slotLabel: 'Protein Anchor',
        ingredientId: 'chicken-thighs-boneless',
        ingredientName: 'Chicken Thighs',
        quantityUsed: 2.0,
        unit: 'lb',
        store: 'KING_SOOPERS',
        unitCost: 1.99,
        slotCost: 3.98,
        regularSlotCost: 8.98,
        rawDealText: '$1.99 / lb',
        dealType: 'SHELF_OR_MEMBER',
        isUserPinned: false,
      },
      {
        slotLabel: 'Produce Base',
        ingredientId: 'carrots-whole-baby',
        ingredientName: 'Carrots',
        quantityUsed: 1.0,
        unit: 'lb',
        store: 'SAFEWAY',
        unitCost: 0.88,
        slotCost: 0.88,
        regularSlotCost: 1.49,
        rawDealText: '$0.88 / lb',
        dealType: 'SHELF_OR_MEMBER',
        isUserPinned: false,
      },
    ],
    pantryStaples: ['Olive Oil', 'Salt', 'Black Pepper'],
    estimatedPantryCost: 0,
    totalBatchCost: 4.86,
    costPerServing: 0.81,
    totalBatchSavings: 5.61,
  });

  const dish2 = createMockDish({
    id: 'dish-2',
    title: 'Sheet Pan Chicken Dinner',
    style: 'CASSEROLE_BAKE',
    matchedIngredients: [
      {
        slotLabel: 'Protein Anchor',
        ingredientId: 'chicken-thighs-boneless',
        ingredientName: 'Chicken Thighs',
        quantityUsed: 1.5,
        unit: 'lb',
        store: 'KING_SOOPERS',
        unitCost: 1.99,
        slotCost: 2.99,
        regularSlotCost: 6.74,
        rawDealText: '$1.99 / lb',
        dealType: 'SHELF_OR_MEMBER',
        isUserPinned: false,
      },
    ],
    pantryStaples: ['Garlic Powder', 'Paprika'],
    estimatedPantryCost: 0,
    totalBatchCost: 2.99,
    costPerServing: 0.5,
    totalBatchSavings: 3.75,
  });

  it('aggregates ingredient quantities across multiple dishes', () => {
    const { items } = buildShoppingListAndStoreComparison(
      [dish1, dish2],
      [mockCommodityChicken, mockCommodityCarrots]
    );

    const chickenItem = items.find((i) => i.ingredientId === 'chicken-thighs-boneless');
    expect(chickenItem).toBeDefined();
    // 2.0 lb in dish1 + 1.5 lb in dish2 = 3.5 lb
    expect(chickenItem?.totalQuantityNeeded).toBe(3.5);
    expect(chickenItem?.usedInDishes.length).toBe(2);
    expect(chickenItem?.optimalTotalCost).toBe(Number((3.5 * 1.99).toFixed(2)));
  });

  it('handles Virtual Freezer / On-Hand zero-cost out-of-pocket substitution', () => {
    // Pass chicken-thighs-boneless as onHand
    const { items, tripComparison } = buildShoppingListAndStoreComparison(
      [dish1],
      [mockCommodityChicken, mockCommodityCarrots],
      ['chicken-thighs-boneless']
    );

    const chickenItem = items.find((i) => i.ingredientId === 'chicken-thighs-boneless');
    expect(chickenItem?.isOnHand).toBe(true);
    expect(chickenItem?.optimalTotalCost).toBe(0);
    expect(chickenItem?.storePricing?.KING_SOOPERS?.totalCost).toBe(0);
    expect(chickenItem?.storePricing?.SAFEWAY?.totalCost).toBe(0);

    // Only carrots ($0.88) should be in the total
    expect(tripComparison.optimalSplitTotal).toBe(0.88);
  });

  it('calculates single-store rankings and optimal 2-store split recommendation', () => {
    const { tripComparison } = buildShoppingListAndStoreComparison(
      [dish1],
      [mockCommodityChicken, mockCommodityCarrots]
    );

    expect(tripComparison.singleStoreRankings).toBeDefined();
    expect(tripComparison.singleStoreRankings!.length).toBeGreaterThan(0);
    expect(tripComparison.bestSingleStore).toBeDefined();
    expect(tripComparison.bestTwoStoreSplit).toBeDefined();
    expect(tripComparison.recommendationHeadline).toBeTruthy();
  });
});
