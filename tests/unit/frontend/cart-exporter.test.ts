import { describe, it, expect } from 'vitest';
import {
  buildStoreSearchUrl,
  cleanSearchQueryForIngredient,
  formatShoppingListForClipboard,
  getItemCurbsideLinks,
  ResolvedExportItem,
} from '@/lib/cart-exporter';
import { StoreTripComparison } from '@/types/domain';
import { createMockDish } from 'tests/test-utils';

describe('cart-exporter: search query cleaner', () => {
  it('strips parenthetical weight/bag sizes from raw names', () => {
    expect(
      cleanSearchQueryForIngredient('Russet or Yukon Gold Potatoes (5 lb Bag)')
    ).toBe('Russet potatoes');
  });

  it('strips "or" alternatives to produce clean grocery query tokens', () => {
    expect(
      cleanSearchQueryForIngredient('Honeycrisp or Gala Apples (3 lb Bag)')
    ).toBe('Honeycrisp apples');
  });

  it('preserves clean ingredient names without parens or alternatives', () => {
    expect(cleanSearchQueryForIngredient('Boneless Skinless Chicken Breast')).toBe(
      'Boneless Skinless Chicken Breast'
    );
  });
});

describe('cart-exporter: curbside deep links', () => {
  it('generates Walmart curbside search URLs with pickup facet', () => {
    const link = buildStoreSearchUrl('WALMART', 'Jalapeño Peppers');
    expect(link.provider).toBe('WALMART');
    expect(link.url).toContain('walmart.com/search');
    expect(link.url).toContain('fulfillment_method_in_store%3APickup');
    expect(link.url).toContain('Jalape%C3%B1o%20Peppers');
  });

  it('resolves localized Kroger family pickup URL based on ZIP', () => {
    const coLink = buildStoreSearchUrl('KING_SOOPERS', 'Chicken Breast', '80542');
    expect(coLink.url).toContain('kingsoopers.com');

    const caLink = buildStoreSearchUrl('KING_SOOPERS', 'Chicken Breast', '90210');
    expect(caLink.url).toContain('ralphs.com');
  });

  it('generates multi-provider bridge links without duplicates', () => {
    const { primaryLink, bridgeLinks } = getItemCurbsideLinks(
      'KING_SOOPERS',
      'Sweet Corn',
      '80542'
    );
    expect(primaryLink.provider).toBe('KING_SOOPERS');
    expect(bridgeLinks.length).toBeGreaterThan(1);

    const providers = bridgeLinks.map((l) => l.provider);
    const unique = new Set(providers);
    expect(unique.size).toBe(bridgeLinks.length);
  });
});

describe('cart-exporter: formatShoppingListForClipboard', () => {
  const sampleItems: ResolvedExportItem[] = [
    {
      ingredientId: 'chicken-thighs',
      ingredientName: 'Chicken Thighs',
      category: 'PROTEIN',
      subcategory: 'Poultry',
      totalQuantityNeeded: 3.0,
      unit: 'lb',
      usedInDishes: [{ dishTitle: 'Braised Stew', quantity: 3.0 }],
      isOnHand: false,
      optimalStore: 'KING_SOOPERS',
      optimalUnitCost: 1.99,
      optimalTotalCost: 5.97,
      optimalRawDealText: '$1.99 / lb with Card',
      optimalDealType: 'DIGITAL_COUPON',
      optimalDealConditions: 'Clip in King Soopers App',
      activeStore: 'KING_SOOPERS',
      activeUnitCost: 1.99,
      activeTotalCost: 5.97,
      activeRawDealText: '$1.99 / lb with Card',
      activeDealType: 'DIGITAL_COUPON',
      activeDealConditions: 'Clip in King Soopers App',
      kingSoopersUnitCost: 1.99,
      kingSoopersTotalCost: 5.97,
      kingSoopersRawDealText: '$1.99 / lb with Card',
      kingSoopersDealType: 'DIGITAL_COUPON',
      safewayUnitCost: 2.99,
      safewayTotalCost: 8.97,
      safewayRawDealText: '$2.99 / lb',
      safewayDealType: 'SHELF_OR_MEMBER',
      regularTotalCost: 12.0,
    },
    {
      ingredientId: 'russet-potatoes',
      ingredientName: 'Russet Potatoes',
      category: 'PRODUCE',
      subcategory: 'Roots',
      totalQuantityNeeded: 5.0,
      unit: 'lb',
      usedInDishes: [{ dishTitle: 'Braised Stew', quantity: 5.0 }],
      isOnHand: true,
      optimalStore: 'SAFEWAY',
      optimalUnitCost: 0.6,
      optimalTotalCost: 0,
      optimalRawDealText: 'Already On-Hand',
      optimalDealType: 'EVERYDAY_LOW',
      activeStore: 'SAFEWAY',
      activeUnitCost: 0.6,
      activeTotalCost: 0,
      activeRawDealText: 'Already On-Hand',
      activeDealType: 'EVERYDAY_LOW',
      kingSoopersUnitCost: 0.8,
      kingSoopersTotalCost: 0,
      kingSoopersRawDealText: 'Already On-Hand',
      kingSoopersDealType: 'SHELF_OR_MEMBER',
      safewayUnitCost: 0.6,
      safewayTotalCost: 0,
      safewayRawDealText: 'Already On-Hand',
      safewayDealType: 'EVERYDAY_LOW',
      regularTotalCost: 5.0,
    },
  ];

  const sampleTripComparison: StoreTripComparison = {
    optimalSplitTotal: 5.97,
    kingSoopersOnlyTotal: 5.97,
    safewayOnlyTotal: 8.97,
    regularShelfTotal: 17.0,
    estimatedPantryTotal: 0,
    bestSingleStore: 'KING_SOOPERS',
    bestSingleStoreTotal: 5.97,
    extraSavingsFromSplitting: 0,
    recommendationHeadline: '1-Stop at King Soopers is the sweet spot ($5.97)',
    recommendationDetail: 'Single store trip minimizes drive time.',
  };

  const sampleDish = createMockDish({
    id: 'dish-1',
    title: 'Braised Stew',
    style: 'STEW_BRAISE',
    appliance: 'DUTCH_OVEN',
    servings: 6,
    matchedIngredients: [],
    pantryStaples: ['Salt', 'Black Pepper'],
    totalBatchCost: 5.97,
    costPerServing: 0.99,
    totalBatchSavings: 11.03,
  });

  it('formats shopping list into markdown checklist with sections', () => {
    const text = formatShoppingListForClipboard({
      items: sampleItems,
      pantryChecklist: ['Salt', 'Black Pepper'],
      tripComparison: sampleTripComparison,
      activeTrio: [sampleDish],
      zipCode: '80542',
      cityLabel: 'Mead, CO',
      tripMode: 'SPLIT',
      checkedItems: {},
    });

    expect(text).toContain('PANTRYBOT WEEKEND SHOPPING CHECKLIST');
    expect(text).toContain('Mead, CO (80542)');
    expect(text).toContain('PRE-FLIGHT DIGITAL COUPONS TO CLIP');
    expect(text).toContain('MEAT, POULTRY & SEAFOOD COUNTER');
    expect(text).toContain('PULL FROM VIRTUAL FREEZER / PANTRY');
    expect(text).toContain('PANTRY & SPICE CABINET CHECK');
  });
});
