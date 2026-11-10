import { pantryCatalog } from './model';
import { evaluateStaplePrices, StaplePriceContext } from './price-evaluator';
import { PantryPriceDetail, PantryRequirement } from '@/types/pantry';

/** Internal request/render snapshot. Never accept source permissions from an HTTP payload. */
export type PantryPriceContext = Readonly<Omit<StaplePriceContext, 'staticPrices'>>;

export function createPantryPriceContext(options: Partial<PantryPriceContext> = {}): PantryPriceContext {
  return Object.freeze({
    nowIso: options.nowIso ?? new Date().toISOString(), marketId: options.marketId ?? '',
    selectedLocationIds: Object.freeze([...(options.selectedLocationIds ?? [])]),
    observedPricingEnabled: options.observedPricingEnabled === true,
    sourceContract: options.sourceContract ? Object.freeze({ ...options.sourceContract }) : undefined,
    admissions: Object.freeze((options.admissions ?? []).map((rule) => Object.freeze({ ...rule }))),
    quotes: Object.freeze((options.quotes ?? []).map((quote) => Object.freeze({ ...quote }))),
  });
}

// Values come exclusively from the existing reviewed catalog, never saved costs or caller prices.
const staticPrices = new Map([...pantryCatalog].flatMap(([id, ingredient]) => ingredient.staticPrice ? [[id, ingredient.staticPrice] as const] : []));

/** Expand JS number notation without rounding away a valid fractional recipe amount. */
function recipeQuantityDecimal(value: number): string {
  const text = String(value);
  if (!Number.isFinite(value) || value < 0 || !text.includes('e')) return text;
  const [coefficient, exponent] = text.split('e');
  const [whole, fraction = ''] = coefficient.split('.');
  const digits = whole + fraction;
  const point = whole.length + Number(exponent);
  if (point <= 0) return `0.${'0'.repeat(-point)}${digits}`;
  if (point >= digits.length) return digits + '0'.repeat(point - digits.length);
  return `${digits.slice(0, point)}.${digits.slice(point)}`;
}

export function pricePantryRequirements(requirements: readonly PantryRequirement[], available: ReadonlySet<string>, context: PantryPriceContext) {
  const evaluation = evaluateStaplePrices(requirements.map((requirement, index) => ({
    key: `requirement:${String(index).padStart(4, '0')}`, ingredientId: requirement.ingredientId,
    quantity: recipeQuantityDecimal(requirement.quantity), unit: requirement.unit, quantityBasisVersion: requirement.quantityBasisVersion,
    available: available.has(requirement.ingredientId), optional: requirement.optional,
  })), { ...context, staticPrices });
  const rows: PantryPriceDetail[] = evaluation.rows.map((row, index) => {
    const detail: PantryPriceDetail = { ...requirements[index], requirementKey: row.key, priceBasis: row.basis, allocatedCents: row.allocatedCents,
      estimatedCost: row.allocatedCents === null ? null : row.allocatedCents / 100 };
    if (row.basis === 'OBSERVED') {
      const quote = row.selectedQuote;
      const admission = row.selectedAdmission;
      if (quote && admission) detail.observation = { source: 'KROGER_PRODUCTION', quoteId: quote.id, locationId: quote.locationId,
        productId: quote.productId, itemId: quote.itemId, observedAtIso: quote.observedAtIso,
        effectiveAtIso: quote.effectiveAtIso, expiresAtIso: quote.expiresAtIso, packagePrice: quote.packagePriceCents / 100,
        packageAmount: admission.packageAmount, packageUnit: admission.packageUnit, sourceSizeLabel: quote.sourceSizeLabel,
        ruleVersion: admission.ruleVersion, stockUnconfirmed: row.stockUnconfirmed === true };
    }
    return detail;
  });
  return { rows, total: evaluation.totalCents / 100, includesStaticEstimates: evaluation.includesStaticEstimates,
    incompleteEstimate: evaluation.incompleteEstimate, evaluatedAtIso: context.nowIso,
    marketId: context.marketId, selectedLocationIds: [...context.selectedLocationIds] };
}

export function pantryPriceLabel(detail: Pick<PantryPriceDetail, 'priceBasis' | 'observation'>): string {
  if (detail.priceBasis === 'ON_HAND') return 'Already have';
  if (detail.priceBasis === 'OPTIONAL') return 'Optional';
  if (detail.priceBasis === 'UNPRICED') return 'Price unavailable';
  if (detail.priceBasis === 'STATIC_ESTIMATE') return 'Static estimate';
  const observation = detail.observation;
  return observation ? `Observed recipe-use estimate — King Soopers #${observation.locationId}, ${observation.observedAtIso}; $${observation.packagePrice.toFixed(2)} / ${observation.packageAmount} ${observation.packageUnit} package (${observation.sourceSizeLabel})${observation.stockUnconfirmed ? '; Stock unconfirmed' : ''}` : 'Observed recipe-use estimate';
}
