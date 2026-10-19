import { describe, it, expect } from 'vitest';
import { scoreAllCommodities } from '@/lib/scoring-and-matcher';
import { compareAgainstWholesaleClubs } from '@/data/wholesale-club-benchmarks';
import { StoreOffer } from '@/types/domain';

describe('scoring-and-wholesale: scoreAllCommodities', () => {
  const sampleOffers: StoreOffer[] = [
    {
      id: 'offer-ks-chicken',
      canonicalIngredientId: 'chicken-thighs-boneless',
      store: 'KING_SOOPERS',
      storeLocationLabel: 'King Soopers (Firestone)',
      validFrom: '2026-10-14',
      validTo: '2026-10-20',
      rawTitle: 'Fresh Heritage Farm Boneless Skinless Chicken Thighs',
      rawPriceText: '$1.99 / lb with Card',
      salePrice: 1.99,
      saleUnit: 'lb',
      normalizedPricePerUnit: 1.99,
      regularPricePerUnit: 4.49,
      dealType: 'SHELF_OR_MEMBER',
      source: 'CURATED_FALLBACK',
    },
    {
      id: 'offer-sw-chicken',
      canonicalIngredientId: 'chicken-thighs-boneless',
      store: 'SAFEWAY',
      storeLocationLabel: 'Safeway (Longmont)',
      validFrom: '2026-10-14',
      validTo: '2026-10-20',
      rawTitle: 'Signature Farms Boneless Chicken Thighs',
      rawPriceText: '$2.49 / lb member price',
      salePrice: 2.49,
      saleUnit: 'lb',
      normalizedPricePerUnit: 2.49,
      regularPricePerUnit: 4.99,
      dealType: 'SHELF_OR_MEMBER',
      source: 'CURATED_FALLBACK',
    },
    {
      id: 'offer-ks-apples',
      canonicalIngredientId: 'honeycrisp-gala-apples',
      store: 'KING_SOOPERS',
      storeLocationLabel: 'King Soopers (Firestone)',
      validFrom: '2026-10-14',
      validTo: '2026-10-20',
      rawTitle: 'Crisp Honeycrisp Apples',
      rawPriceText: '$0.99 / lb',
      salePrice: 0.99,
      saleUnit: 'lb',
      normalizedPricePerUnit: 0.99,
      regularPricePerUnit: 2.49,
      dealType: 'SHELF_OR_MEMBER',
      source: 'CURATED_FALLBACK',
    },
  ];

  it('correctly scores commodities and identifies the best offer', () => {
    const scored = scoreAllCommodities(sampleOffers, 'ALL');
    expect(scored.length).toBeGreaterThan(0);

    const chicken = scored.find((c) => c.ingredient.id === 'chicken-thighs-boneless');
    expect(chicken).toBeDefined();
    expect(chicken?.bestOffer.store).toBe('KING_SOOPERS');
    expect(chicken?.bestOffer.normalizedPricePerUnit).toBe(1.99);
    expect(chicken?.valueScore).toBeGreaterThan(0);
    expect(chicken?.valueScore).toBeLessThanOrEqual(100);
  });

  it('filters offers when a specific store is requested', () => {
    const scoredSafeway = scoreAllCommodities(sampleOffers, 'SAFEWAY');
    const chicken = scoredSafeway.find((c) => c.ingredient.id === 'chicken-thighs-boneless');
    expect(chicken).toBeDefined();
    expect(chicken?.bestOffer.store).toBe('SAFEWAY');
    expect(chicken?.bestOffer.normalizedPricePerUnit).toBe(2.49);
  });

  it('applies USDA baseline overrides dynamically', () => {
    const overrides = {
      'chicken-thighs-boneless': {
        mountainBaseline: 3.5,
        mountainAdFeaturePct: 60,
      },
    };
    const scored = scoreAllCommodities(sampleOffers, 'ALL', overrides);
    const chicken = scored.find((c) => c.ingredient.id === 'chicken-thighs-boneless');
    expect(chicken?.ingredient.mountainBaselinePerUnit).toBe(3.5);
    expect(chicken?.ingredient.usdaSignal.mountainAdFeaturePct).toBe(60);
  });
});

describe('scoring-and-wholesale: compareAgainstWholesaleClubs', () => {
  it('identifies when supermarket promotion beats Costco/Sam Club bulk price', () => {
    // Boneless chicken thighs: Costco is $2.99, Sam's is $2.88.
    // Supermarket at $1.99 should beat club bulk
    const comp = compareAgainstWholesaleClubs('chicken-thighs-boneless', 1.99, 'lb');
    expect(comp).toBeDefined();
    expect(comp?.beatsClubBulk).toBe(true);
    expect(comp?.bestClubPricePerUnit).toBe(2.88); // Sam's Club is cheaper baseline
    expect(comp?.savingsVsClubPerUnit).toBe(0.89); // 2.88 - 1.99
    expect(comp?.verdictLabel).toContain('Beats');
  });

  it('identifies when wholesale club bulk price is cheaper than supermarket price', () => {
    // Supermarket at $4.49 is more expensive than $2.88 bulk
    const comp = compareAgainstWholesaleClubs('chicken-thighs-boneless', 4.49, 'lb');
    expect(comp).toBeDefined();
    expect(comp?.beatsClubBulk).toBe(false);
    expect(comp?.verdictLabel).toContain('cheaper');
  });

  it('returns undefined for ingredients without a wholesale club benchmark', () => {
    const comp = compareAgainstWholesaleClubs('unknown-specialty-item', 5.99, 'lb');
    expect(comp).toBeUndefined();
  });
});
