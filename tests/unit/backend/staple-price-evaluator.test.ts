import { describe, expect, it } from 'vitest';
import fixtures from '../../../catalog/proposals/2026-11-09-staple-pricing-qualification/fixtures.json';
import { evaluateStaplePrices, StaplePriceAdmission, StaplePriceContext, StaplePriceQuote, StaplePriceRequirement } from '@/lib/pantry/price-evaluator';

const requirement: StaplePriceRequirement = { key: 'recipe:oil', ingredientId: 'olive-oil', quantity: '2', unit: 'tbsp' };
const admission: StaplePriceAdmission = { ingredientId: 'olive-oil', productId: 'SYNTH_PRODUCT', itemId: 'SYNTH_ITEM',
  productRevision: 'package-v1', ruleVersion: 'rule-v1', sourceSizeLabel: '16 fl oz', packageAmount: '16', packageUnit: 'fl oz' };
const quote: StaplePriceQuote = { id: 'quote-a', source: 'KROGER_PRODUCTION', productId: admission.productId,
  itemId: admission.itemId, productRevision: admission.productRevision, sourceSizeLabel: '16 fl oz',
  marketId: 'SYNTH_MARKET', locationId: 'SYNTH_STORE', observedAtIso: '2026-11-09T18:00:00Z',
  priceKind: 'REGULAR', packagePriceCents: 480, currency: 'USD', conditions: 'UNCONDITIONAL',
  sourceContractVersion: 'SYNTH_CONTRACT', inStore: true, stockLevel: 'HIGH' };
function context(overrides: Partial<StaplePriceContext> = {}): StaplePriceContext {
  return { nowIso: '2026-11-09T20:00:00Z', marketId: 'SYNTH_MARKET', selectedLocationIds: ['SYNTH_STORE'],
    observedPricingEnabled: true, sourceContract: { version: 'SYNTH_CONTRACT', unconditionalUsdVerified: true, useAndRetentionVerified: true },
    admissions: [admission], quotes: [quote], staticPrices: new Map([['olive-oil', { unit: 'tbsp', usdPerUnit: 0.2 }]]), ...overrides };
}
const first = (c: StaplePriceContext, r = requirement) => evaluateStaplePrices([r], c).rows[0];

describe('staple price arithmetic from approved synthetic vectors', () => {
  for (const fixture of fixtures.fixtures) {
    if (fixture.group !== 'arithmetic') continue;
    const input = fixture.input;
    it(fixture.id, () => {
      const packageUnit = input.packageUnit === 'US_fl_oz' ? 'fl oz' : input.packageUnit!;
      const r = { ...requirement, quantity: input.requiredAmount!, unit: input.requiredUnit! };
      const a = { ...admission, packageUnit, packageAmount: input.packageAmount! };
      const q = { ...quote, packagePriceCents: input.packagePriceCents!, explicitFreePriceEvidence: true };
      const result = evaluateStaplePrices([r], context({ admissions: [a], quotes: [q] }));
      expect(result.rows[0].basis).toBe('OBSERVED');
      expect(result.totalCents).toBe(fixture.expected.roundHalfUpCents);
    });
  }
});

describe('source gates and quote qualification', () => {
  it('keeps source activation closed by default and when either independent permission is absent', () => {
    for (const sourceContract of [undefined,
      { version: 'SYNTH_CONTRACT', unconditionalUsdVerified: false, useAndRetentionVerified: true },
      { version: 'SYNTH_CONTRACT', unconditionalUsdVerified: true, useAndRetentionVerified: false }]) {
      expect(first(context({ sourceContract })).basis).toBe('STATIC_ESTIMATE');
    }
    expect(first(context({ observedPricingEnabled: undefined })).basis).toBe('STATIC_ESTIMATE');
    expect(first(context({ observedPricingEnabled: false })).allocatedCents).toBe(40);
  });

  it.each<Partial<StaplePriceQuote>>([
    { source: 'KROGER_CERTIFICATION' }, { marketId: 'OTHER' }, { locationId: 'OTHER' },
    { currency: undefined }, { currency: 'CAD' }, { conditions: 'UNKNOWN' }, { conditions: 'MEMBERSHIP' },
    { conditions: 'COUPON' }, { conditions: 'MULTI_BUY' }, { sourceContractVersion: 'OLD' },
    { priceKind: 'PROMO' }, { priceKind: 'NATIONAL' }, { priceKind: 'PER_UNIT_ESTIMATE' },
    { inStore: false }, { stockLevel: 'TEMPORARILY_OUT_OF_STOCK' },
    { productRevision: 'unreviewed-v2' }, { sourceSizeLabel: '32 fl oz' }, { productId: 'OTHER' }, { itemId: 'OTHER' },
    { packagePriceCents: -1 }, { packagePriceCents: NaN }, { packagePriceCents: Infinity },
    { packagePriceCents: 1.1 }, { packagePriceCents: 0 }, { packagePriceCents: Number.MAX_SAFE_INTEGER + 1 },
    { observedAtIso: '2026-11-09T21:00:00Z' }, { observedAtIso: '2026-11-08T18:00:00Z' },
    { observedAtIso: '2026-02-30T18:00:00Z' }, { observedAtIso: '2026-11-09' },
    { effectiveAtIso: '2026-11-09T21:00:00Z' }, { expiresAtIso: '2026-11-09T19:59:59Z' },
    { expiresAtIso: 'not-a-date' }, { observedAtIso: '2026-11-09T18:00:00+25:00' },
  ])('falls back without admitting an invalid quote: %j', (change) => {
    expect(first(context({ quotes: [{ ...quote, ...change }] })).basis).toBe('STATIC_ESTIMATE');
  });

  it('supports genuine source-evidenced free offers without turning missing prices into zero', () => {
    const row = first(context({ quotes: [{ ...quote, packagePriceCents: 0, explicitFreePriceEvidence: true }] }));
    expect(row).toMatchObject({ basis: 'OBSERVED', allocatedCents: 0 });
  });

  it('distinguishes sold at location from unconfirmed stock', () => {
    expect(first(context({ quotes: [{ ...quote, stockLevel: undefined }] }))).toMatchObject({ basis: 'OBSERVED', stockUnconfirmed: true });
    expect(first(context()).stockUnconfirmed).toBe(false);
  });

  it('invalidates at Mountain midnight and respects explicit timezone offsets', () => {
    const c = context({ nowIso: '2026-11-10T07:00:00Z', quotes: [{ ...quote, observedAtIso: '2026-11-10T06:59:59Z' }] });
    expect(first(c).basis).toBe('STATIC_ESTIMATE');
    expect(first(context({ quotes: [{ ...quote, observedAtIso: '2026-11-09T11:00:00-07:00' }] })).basis).toBe('OBSERVED');
  });

  it('treats expiry as an exclusive boundary', () => {
    const q = { ...quote, expiresAtIso: '2026-11-09T20:00:00Z' };
    expect(first(context({ nowIso: '2026-11-09T19:59:59.999Z', quotes: [q] })).basis).toBe('OBSERVED');
    expect(first(context({ nowIso: '2026-11-09T20:00:00Z', quotes: [q] })).basis).toBe('STATIC_ESTIMATE');
    expect(first(context({ nowIso: '2026-11-09T20:00:00.001Z', quotes: [q] })).basis).toBe('STATIC_ESTIMATE');
  });

  it('never resurrects an older eligible snapshot when the newest is unavailable', () => {
    const newer = { ...quote, id: 'new', observedAtIso: '2026-11-09T19:00:00Z', stockLevel: 'TEMPORARILY_OUT_OF_STOCK' as const };
    for (const quotes of [[quote, newer], [newer, quote]]) expect(first(context({ quotes })).basis).toBe('STATIC_ESTIMATE');
  });

  it('rejects simultaneous conflicting revisions and ambiguous admission configuration', () => {
    const conflict = { ...quote, id: 'conflict', packagePriceCents: 100 };
    for (const quotes of [[quote, conflict], [conflict, quote]]) expect(first(context({ quotes })).basis).toBe('STATIC_ESTIMATE');
    expect(first(context({ admissions: [admission, { ...admission, packageAmount: '32' }] })).basis).toBe('STATIC_ESTIMATE');
  });
});

describe('reviewed package and recipe identity boundaries', () => {
  it.each(['0', '-1', 'NaN', 'Infinity', '1e3', '1.1234567890', '9007199254740992'])('rejects invalid package amount %s', (packageAmount) => {
    expect(first(context({ admissions: [{ ...admission, packageAmount }] })).basis).toBe('STATIC_ESTIMATE');
  });

  it('allows only a scoped fo override, not an inferred fluid ounce or density', () => {
    const q = { ...quote, sourceSizeLabel: '15 fo' };
    expect(first(context({ quotes: [q] })).basis).toBe('STATIC_ESTIMATE');
    expect(first(context({ quotes: [q], admissions: [{ ...admission, sourceSizeLabel: '15 fo', packageAmount: '15' }] })).basis).toBe('OBSERVED');
    expect(first(context({ admissions: [{ ...admission, packageUnit: 'oz' }] })).basis).toBe('STATIC_ESTIMATE');
    expect(first(context({ admissions: [{ ...admission, packageUnit: 'fo' }] })).basis).toBe('STATIC_ESTIMATE');
  });

  it('does not price dry, lite, mixed or unreviewed foods under another ingredient', () => {
    for (const ingredientId of ['black-beans-canned', 'coconut-milk-canned', 'lime-juice', 'worcestershire-sauce-gluten-free']) {
      expect(first(context(), { ...requirement, ingredientId }).basis).toBe('UNPRICED');
    }
  });

  it('requires the exact reviewed canned quantity basis, including on saved requirements', () => {
    const a = { ...admission, quantityBasisVersion: 'NET_CONTENTS_V1' };
    expect(first(context({ admissions: [a] })).basis).toBe('STATIC_ESTIMATE');
    expect(first(context({ admissions: [a] }), { ...requirement, quantityBasisVersion: 'DRAINED' }).basis).toBe('STATIC_ESTIMATE');
    expect(first(context({ admissions: [a] }), { ...requirement, quantityBasisVersion: 'NET_CONTENTS_V1' }).basis).toBe('OBSERVED');
  });

  it('preserves pinned food identity instead of selecting another cheap food', () => {
    const q = { ...quote, productId: 'DIFFERENT_FOOD', packagePriceCents: 1 };
    expect(first(context({ quotes: [q] })).basis).toBe('STATIC_ESTIMATE');
  });

  it('can price two independently admitted identities from the same product without sharing ownership', () => {
    const other = { ...requirement, key: 'second-identity', ingredientId: 'separately-reviewed-food' };
    const c = context({ admissions: [admission, { ...admission, ingredientId: other.ingredientId }] });
    const result = evaluateStaplePrices([{ ...requirement, available: true }, other], c);
    expect(result.rows.map((row) => row.basis)).toEqual(['ON_HAND', 'OBSERVED']);
    expect(result.totalCents).toBe(30);
  });
});

describe('selection, fallback, ownership and reconciled presentation', () => {
  it('compares exact unit costs before rounded display amounts, independent of input order', () => {
    const cheaper = { ...quote, id: 'cheaper', productId: 'LOWER_UNIT', packagePriceCents: 479 };
    const a = { ...admission, productId: cheaper.productId };
    for (const quotes of [[quote, cheaper], [cheaper, quote]]) {
      expect(first(context({ quotes, admissions: [admission, a] })).quoteId).toBe('cheaper');
    }
  });

  it('breaks cost ties by observation then stable identifiers', () => {
    const newer = { ...quote, id: 'newer', productId: 'B', observedAtIso: '2026-11-09T19:00:00Z' };
    const a = { ...admission, productId: 'B' };
    expect(first(context({ quotes: [quote, newer], admissions: [admission, a] })).quoteId).toBe('newer');
    const sameTime = { ...newer, observedAtIso: quote.observedAtIso };
    const row = first(context({ quotes: [sameTime, quote], admissions: [admission, a] }));
    expect(row.quoteId).toBe('newer'); // B sorts before SYNTH_PRODUCT.
  });

  it('reconciles half-cent detail rows to the recipe total and preserves input order', () => {
    const requirements = ['c', 'b', 'a'].map((key) => ({ ...requirement, key, quantity: '1', unit: 'g' }));
    const result = evaluateStaplePrices(requirements, context({ admissions: [{ ...admission, packageAmount: '200', packageUnit: 'g' }], quotes: [{ ...quote, packagePriceCents: 100 }] }));
    expect(result.totalCents).toBe(2);
    expect(result.rows.map((row) => [row.key, row.allocatedCents])).toEqual([['c', 0], ['b', 1], ['a', 1]]);
    expect(result.rows.reduce((total, row) => total + (row.allocatedCents ?? 0), 0)).toBe(result.totalCents);
  });

  it('preserves Yes and optional exclusions, while No retains an additional need', () => {
    expect(first(context(), { ...requirement, available: true })).toMatchObject({ basis: 'ON_HAND', allocatedCents: 0 });
    expect(first(context(), { ...requirement, available: false })).toMatchObject({ basis: 'OBSERVED', allocatedCents: 30 });
    expect(first(context(), { ...requirement, optional: true, quantity: 'invalid' })).toMatchObject({ basis: 'OPTIONAL', allocatedCents: 0 });
  });

  it('uses exact existing static units and reports mixed/incomplete totals', () => {
    const requirements = [requirement, { ...requirement, key: 'static', ingredientId: 'static-food', quantity: '1' },
      { ...requirement, key: 'unknown', ingredientId: 'unknown-food', quantity: '1' }];
    const staticPrices = new Map([['static-food', { unit: 'tbsp', usdPerUnit: 0.1 }]]);
    const result = evaluateStaplePrices(requirements, context({ staticPrices }));
    expect(result).toMatchObject({ totalCents: 40, includesStaticEstimates: true, incompleteEstimate: true });
    expect(result.rows.map((row) => row.basis)).toEqual(['OBSERVED', 'STATIC_ESTIMATE', 'UNPRICED']);
    expect(first(context({ quotes: [] }), { ...requirement, unit: 'tsp' }).basis).toBe('UNPRICED');
  });

  it('rejects individual overflow and invalid recipe quantities, and checks aggregate overflow', () => {
    expect(first(context(), { ...requirement, quantity: 'NaN' }).basis).toBe('UNPRICED');
    expect(first(context({ quotes: [{ ...quote, packagePriceCents: Number.MAX_SAFE_INTEGER }], admissions: [{ ...admission, packageAmount: '0.000000001' }] })).basis).toBe('STATIC_ESTIMATE');
    const c = context({ admissions: [{ ...admission, packageAmount: '1', packageUnit: 'tbsp' }], quotes: [{ ...quote, packagePriceCents: Number.MAX_SAFE_INTEGER }] });
    expect(() => evaluateStaplePrices([{ ...requirement, quantity: '1' }, { ...requirement, key: 'second', quantity: '1' }], c)).toThrow(RangeError);
  });

  it('rejects ambiguous requirement keys and invalid evaluation clocks', () => {
    expect(() => evaluateStaplePrices([requirement, requirement], context())).toThrow('unique');
    expect(() => evaluateStaplePrices([requirement], context({ nowIso: '2026-02-30T20:00:00Z' }))).toThrow(RangeError);
  });

  it('bounds quote workloads and rejects malformed static estimates', () => {
    expect(() => evaluateStaplePrices([requirement], context({ quotes: Array.from({ length: 1001 }, () => quote) }))).toThrow(RangeError);
    for (const usdPerUnit of [NaN, Infinity, -0.1]) {
      expect(first(context({ quotes: [], staticPrices: new Map([['olive-oil', { unit: 'tbsp', usdPerUnit }]]) })).basis).toBe('UNPRICED');
    }
  });

  it('does not mutate requirements, source observations, admissions or source configuration', () => {
    const c = context();
    const before = JSON.stringify([requirement, c.quotes, c.admissions, c.sourceContract]);
    evaluateStaplePrices([requirement], c);
    expect(JSON.stringify([requirement, c.quotes, c.admissions, c.sourceContract])).toBe(before);
  });
});
