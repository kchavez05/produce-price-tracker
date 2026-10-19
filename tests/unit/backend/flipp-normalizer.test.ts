import { describe, it, expect } from 'vitest';
import { resolveEffectiveUnitPrice, normalizeFlyerPrice } from '@/lib/connectors/flipp';
import { createMockIngredient } from 'tests/test-utils';

describe('flipp-normalizer: resolveEffectiveUnitPrice', () => {
  it('detects "Buy 1 Get 1 Free" and cuts price in half', () => {
    const result = resolveEffectiveUnitPrice(6.99, 'Honeycrisp Apples Buy 1 Get 1 Free', 3.99);
    expect(result.effectiveItemPrice).toBe(3.5);
    expect(result.multiBuyQty).toBe(2);
  });

  it('detects "BOGO" keyword case-insensitively', () => {
    const result = resolveEffectiveUnitPrice(4.0, 'Fresh Berries BOGO special', 2.99);
    expect(result.effectiveItemPrice).toBe(2.0);
    expect(result.multiBuyQty).toBe(2);
  });

  it('resolves "N for $M" bundles (e.g., 4 for $5.00 -> $1.25 each)', () => {
    const result = resolveEffectiveUnitPrice(5.0, 'Sweet Corn 4 for $5.00', 1.5);
    expect(result.effectiveItemPrice).toBe(1.25);
    expect(result.multiBuyQty).toBe(4);
  });

  it('resolves "N/$M" notation (e.g., 2/$6 -> $3.00 each)', () => {
    const result = resolveEffectiveUnitPrice(6.0, 'Organic Bell Peppers 2/$6', 3.5);
    expect(result.effectiveItemPrice).toBe(3.0);
    expect(result.multiBuyQty).toBe(2);
  });

  it('returns rawPrice unchanged when no multi-buy or BOGO pattern matches', () => {
    const result = resolveEffectiveUnitPrice(2.49, 'Russet Potatoes on sale', 2.99);
    expect(result.effectiveItemPrice).toBe(2.49);
    expect(result.multiBuyQty).toBeUndefined();
  });
});

describe('flipp-normalizer: normalizeFlyerPrice', () => {
  const mockProduceIngredient = createMockIngredient({
    id: 'russet-potatoes',
    name: 'Russet Potatoes',
    category: 'PRODUCE',
    standardUnit: 'lb',
    mountainBaselinePerUnit: 0.99,
    typicalRegularPerUnit: 1.49,
  });

  const mockEggIngredient = createMockIngredient({
    id: 'large-eggs-dozen',
    name: 'Large Grade A Eggs',
    category: 'DAIRY_EGGS',
    standardUnit: 'doz',
    mountainBaselinePerUnit: 2.79,
    typicalRegularPerUnit: 3.49,
  });

  it('normalizes multi-pound bags (e.g. 5 lb bag for $2.99 -> $0.60/lb)', () => {
    const norm = normalizeFlyerPrice(2.99, 'Russet Potatoes 5 lb bag', mockProduceIngredient);
    expect(norm.normalizedPricePerUnit).toBe(0.6);
    expect(norm.saleUnit).toBe('5 lb bag');

    const normDot = normalizeFlyerPrice(2.99, 'Russet Potatoes 5 lb. bag', mockProduceIngredient);
    expect(normDot.normalizedPricePerUnit).toBe(0.6);
    expect(normDot.saleUnit).toBe('5 lb bag');
  });

  it('normalizes 16 oz package to 1 lb', () => {
    const norm = normalizeFlyerPrice(3.29, 'Fresh Cut Carrots 16 oz pack', mockProduceIngredient);
    expect(norm.normalizedPricePerUnit).toBe(3.29);
    expect(norm.saleUnit).toBe('16 oz');
  });

  it('normalizes 8 oz package to 0.5 lb ($/lb doubled)', () => {
    const norm = normalizeFlyerPrice(2.0, 'Sliced Mushrooms 8 oz', mockProduceIngredient);
    expect(norm.normalizedPricePerUnit).toBe(4.0);
    expect(norm.saleUnit).toBe('8 oz');
  });

  it('normalizes egg cartons with 18 count to standard dozen price', () => {
    // 18 count for $3.60 = $0.20/egg -> $2.40/doz
    const norm = normalizeFlyerPrice(3.6, 'Large Grade A Eggs 18 ct', mockEggIngredient);
    expect(norm.normalizedPricePerUnit).toBe(2.4);
    expect(norm.saleUnit).toBe('18 ct');
  });

  it('normalizes standard dozen eggs', () => {
    const norm = normalizeFlyerPrice(2.29, 'Large Brown Eggs 1 doz', mockEggIngredient);
    expect(norm.normalizedPricePerUnit).toBe(2.29);
    expect(norm.saleUnit).toBe('doz');
  });

  it('handles explicit per-pound pricing', () => {
    const norm = normalizeFlyerPrice(1.99, 'Boneless Chicken Breast $1.99 / lb', mockProduceIngredient);
    expect(norm.normalizedPricePerUnit).toBe(1.99);
    expect(norm.saleUnit).toBe('lb');

    const normDot = normalizeFlyerPrice(1.99, 'Honeycrisp Apples $1.99 lb.', mockProduceIngredient);
    expect(normDot.normalizedPricePerUnit).toBe(1.99);
    expect(normDot.saleUnit).toBe('lb');
  });
});
