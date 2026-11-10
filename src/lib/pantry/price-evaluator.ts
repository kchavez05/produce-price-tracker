/** Pure PQ-01–07 foundation. No network, storage, feature activation or pantry mutation. */
export interface StaplePriceRequirement {
  key: string;
  ingredientId: string;
  quantity: string;
  unit: string;
  quantityBasisVersion?: string;
  available?: boolean;
  optional?: boolean;
}

/** Supplied by reviewed server configuration, never established by a caller's product choice. */
export interface StaplePriceAdmission {
  ingredientId: string;
  productId: string;
  itemId: string;
  productRevision: string;
  ruleVersion: string;
  sourceSizeLabel: string;
  packageAmount: string;
  packageUnit: string;
  quantityBasisVersion?: string;
}

export interface StaplePriceQuote {
  id: string;
  source: 'KROGER_PRODUCTION' | 'KROGER_CERTIFICATION';
  productId: string;
  itemId: string;
  productRevision: string;
  sourceSizeLabel: string;
  marketId: string;
  locationId: string;
  observedAtIso: string;
  effectiveAtIso?: string;
  expiresAtIso?: string;
  priceKind: 'REGULAR' | 'PROMO' | 'NATIONAL' | 'PER_UNIT_ESTIMATE';
  packagePriceCents: number;
  currency?: string;
  conditions?: 'UNCONDITIONAL' | 'MEMBERSHIP' | 'COUPON' | 'MULTI_BUY' | 'UNKNOWN';
  sourceContractVersion?: string;
  explicitFreePriceEvidence?: boolean;
  inStore: boolean;
  stockLevel?: 'HIGH' | 'LOW' | 'TEMPORARILY_OUT_OF_STOCK';
}

export interface StaplePriceContext {
  nowIso: string;
  marketId: string;
  selectedLocationIds: readonly string[];
  observedPricingEnabled?: boolean;
  /** No real contract is enabled by this module. Missing or unverified gates fail closed. */
  sourceContract?: {
    version: string;
    unconditionalUsdVerified: boolean;
    useAndRetentionVerified: boolean;
  };
  admissions: readonly StaplePriceAdmission[];
  quotes: readonly StaplePriceQuote[];
  /** The integration must supply only existing reviewed static estimates. */
  staticPrices: ReadonlyMap<string, { unit: string; usdPerUnit: number }>;
}

export type StaplePriceBasis = 'OBSERVED' | 'STATIC_ESTIMATE' | 'UNPRICED' | 'ON_HAND' | 'OPTIONAL';
export interface StaplePriceRow {
  key: string;
  ingredientId: string;
  basis: StaplePriceBasis;
  allocatedCents: number | null;
  quoteId?: string;
  admissionRuleVersion?: string;
  stockUnconfirmed?: boolean;
}

interface Fraction { numerator: bigint; denominator: bigint }
const ZERO: Fraction = { numerator: 0n, denominator: 1n };
const MAX = BigInt(Number.MAX_SAFE_INTEGER);
const MAX_ROWS = 1000;

function gcd(a: bigint, b: bigint): bigint {
  while (b) [a, b] = [b, a % b];
  return a;
}
function fraction(numerator: bigint, denominator: bigint): Fraction {
  const divisor = gcd(numerator, denominator);
  return { numerator: numerator / divisor, denominator: denominator / divisor };
}
function decimal(value: string, places = 9): Fraction | undefined {
  if (typeof value !== 'string' || value.length > 32 || !/^\d+(?:\.\d+)?$/.test(value)) return;
  const [whole, part = ''] = value.split('.');
  if (part.length > places) return;
  const result = fraction(BigInt(whole + part), 10n ** BigInt(part.length));
  return result.numerator <= MAX * result.denominator ? result : undefined;
}
function add(a: Fraction, b: Fraction): Fraction {
  return fraction(a.numerator * b.denominator + b.numerator * a.denominator, a.denominator * b.denominator);
}
function multiply(a: Fraction, b: Fraction): Fraction {
  return fraction(a.numerator * b.numerator, a.denominator * b.denominator);
}
function compare(a: Fraction, b: Fraction): number {
  const difference = a.numerator * b.denominator - b.numerator * a.denominator;
  return difference < 0n ? -1 : difference > 0n ? 1 : 0;
}
function supported(value: Fraction): boolean { return value.numerator <= MAX * value.denominator; }
function cents(value: number): Fraction | undefined {
  return Number.isSafeInteger(value) && value >= 0 ? { numerator: BigInt(value), denominator: 1n } : undefined;
}

const units: ReadonlyMap<string, { dimension: string; amount: Fraction }> = new Map([
  ['tsp', { dimension: 'volume', amount: decimal('4.92892159375', 14)! }],
  ['tbsp', { dimension: 'volume', amount: decimal('14.78676478125', 14)! }],
  ['cup', { dimension: 'volume', amount: decimal('236.5882365')! }],
  ['fl oz', { dimension: 'volume', amount: decimal('29.5735295625', 14)! }],
  ['mL', { dimension: 'volume', amount: decimal('1')! }],
  ['L', { dimension: 'volume', amount: decimal('1000')! }],
  ['oz', { dimension: 'mass', amount: decimal('28.349523125')! }],
  ['lb', { dimension: 'mass', amount: decimal('453.59237')! }],
  ['g', { dimension: 'mass', amount: decimal('1')! }],
  ['kg', { dimension: 'mass', amount: decimal('1000')! }],
  ['each', { dimension: 'count', amount: decimal('1')! }],
]);

function instant(value: string): number | undefined {
  if (typeof value !== 'string') return;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!match) return;
  const [, year, month, day, hour, minute, second, offset] = match;
  const days = new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate();
  if (Number(month) < 1 || Number(month) > 12 || Number(day) < 1 || Number(day) > days ||
      Number(hour) > 23 || Number(minute) > 59 || Number(second) > 59 ||
      (offset !== 'Z' && (Number(offset.slice(1, 3)) > 14 || Number(offset.slice(4)) > 59 ||
        (Number(offset.slice(1, 3)) === 14 && Number(offset.slice(4)) !== 0)))) return;
  const result = Date.parse(value);
  return Number.isFinite(result) ? result : undefined;
}
const mountainDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Denver', year: 'numeric', month: '2-digit', day: '2-digit' });
const lexical = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;

/** Latest snapshots shadow older ones even when the latest quote cannot qualify. */
function latestQuotes(quotes: readonly StaplePriceQuote[]): StaplePriceQuote[] {
  const groups = new Map<string, { time: number; quote: StaplePriceQuote; signature: string; conflict: boolean; invalidTime: boolean }>();
  for (const quote of quotes) {
    const key = JSON.stringify([quote.source, quote.locationId, quote.productId, quote.itemId]);
    const time = instant(quote.observedAtIso);
    const signature = JSON.stringify([quote.productRevision, quote.sourceSizeLabel, quote.marketId, quote.packagePriceCents,
      quote.currency, quote.conditions, quote.sourceContractVersion, quote.explicitFreePriceEvidence, quote.inStore,
      quote.stockLevel, quote.effectiveAtIso, quote.expiresAtIso, quote.priceKind]);
    const current = groups.get(key);
    if (!current) groups.set(key, { time: time ?? -Infinity, quote, signature, conflict: false, invalidTime: time === undefined });
    else {
      if (time === undefined) current.invalidTime = true;
      else if (time > current.time) groups.set(key, { time, quote, signature, conflict: false, invalidTime: current.invalidTime });
      else if (time === current.time) {
        if (signature !== current.signature) current.conflict = true;
        else if (lexical(quote.id, current.quote.id) < 0) current.quote = quote;
      }
    }
  }
  return [...groups.values()].filter((group) => !group.conflict && !group.invalidTime).map((group) => group.quote);
}

interface Candidate { quote: StaplePriceQuote; admission: StaplePriceAdmission; cost: Fraction; unitCost: Fraction; time: number }
const admissionKey = (ingredientId: string, productId: string, itemId: string, revision: string, label: string, basis?: string) =>
  JSON.stringify([ingredientId, productId, itemId, revision, label, basis]);
function observedCost(requirement: StaplePriceRequirement, amount: Fraction, context: StaplePriceContext,
  quotes: readonly StaplePriceQuote[], now: number, admissions: ReadonlyMap<string, StaplePriceAdmission | null>): Candidate | undefined {
  const contract = context.sourceContract;
  if (context.observedPricingEnabled !== true || !contract?.version || contract.unconditionalUsdVerified !== true || contract.useAndRetentionVerified !== true) return;
  const requestedUnit = units.get(requirement.unit);
  if (!requestedUnit) return;
  const candidates: Candidate[] = [];
  for (const quote of quotes) {
    const time = instant(quote.observedAtIso);
    const price = cents(quote.packagePriceCents);
    if (quote.source !== 'KROGER_PRODUCTION' || quote.marketId !== context.marketId ||
        !context.selectedLocationIds.includes(quote.locationId) || quote.currency !== 'USD' || quote.conditions !== 'UNCONDITIONAL' ||
        quote.sourceContractVersion !== contract.version || quote.priceKind !== 'REGULAR' || quote.inStore !== true ||
        (quote.stockLevel !== undefined && quote.stockLevel !== 'HIGH' && quote.stockLevel !== 'LOW') || !quote.productRevision || !price ||
        (quote.packagePriceCents === 0 && quote.explicitFreePriceEvidence !== true) || time === undefined || time > now ||
        mountainDay.format(time) !== mountainDay.format(now)) continue;
    if (quote.effectiveAtIso !== undefined) {
      const start = instant(quote.effectiveAtIso);
      if (start === undefined || start > now) continue;
    }
    if (quote.expiresAtIso !== undefined) {
      const end = instant(quote.expiresAtIso);
      if (end === undefined || now >= end) continue;
    }
    // Rule identity and package evidence are reviewed configuration; labels alone grant no admission.
    const admission = admissions.get(admissionKey(requirement.ingredientId, quote.productId, quote.itemId,
      quote.productRevision, quote.sourceSizeLabel, requirement.quantityBasisVersion));
    if (!admission?.ruleVersion) continue;
    const packageAmount = decimal(admission.packageAmount);
    const packageUnit = units.get(admission.packageUnit);
    if (!packageAmount?.numerator || !packageUnit || packageUnit.dimension !== requestedUnit.dimension) continue;
    const numerator = multiply(price, requestedUnit.amount);
    const denominator = multiply(packageAmount, packageUnit.amount);
    const unitCost = fraction(numerator.numerator * denominator.denominator, numerator.denominator * denominator.numerator);
    const cost = multiply(unitCost, amount);
    if (supported(cost)) candidates.push({ quote, admission, cost, unitCost, time });
  }
  return candidates.sort((a, b) => compare(a.unitCost, b.unitCost) || b.time - a.time ||
    lexical(a.quote.locationId, b.quote.locationId) || lexical(a.quote.productId, b.quote.productId) ||
    lexical(a.quote.itemId, b.quote.itemId) || lexical(a.quote.id, b.quote.id))[0];
}

/** Returns only cost decisions; identity coverage and verified ownership stay with the existing pantry model. */
export function evaluateStaplePrices(requirements: readonly StaplePriceRequirement[], context: StaplePriceContext) {
  const now = instant(context.nowIso);
  if (now === undefined) throw new RangeError('Price context requires a valid timestamp with timezone');
  if (requirements.length > MAX_ROWS || context.admissions.length > MAX_ROWS || context.quotes.length > 1000) {
    throw new RangeError('Price evaluation exceeds supported input bounds');
  }
  if (new Set(requirements.map((requirement) => requirement.key)).size !== requirements.length ||
      requirements.some((requirement) => !requirement.key)) throw new Error('Price requirement keys must be nonempty and unique');
  const quotes = latestQuotes(context.quotes);
  const admissions = new Map<string, StaplePriceAdmission | null>();
  for (const rule of context.admissions) {
    const key = admissionKey(rule.ingredientId, rule.productId, rule.itemId, rule.productRevision, rule.sourceSizeLabel, rule.quantityBasisVersion);
    admissions.set(key, admissions.has(key) ? null : rule);
  }
  const exact: Fraction[] = [];
  const rows: StaplePriceRow[] = requirements.map((requirement) => {
    const row: StaplePriceRow = { key: requirement.key, ingredientId: requirement.ingredientId, basis: 'UNPRICED', allocatedCents: null };
    if (requirement.optional === true || requirement.available === true) {
      exact.push(ZERO);
      return { ...row, basis: requirement.optional === true ? 'OPTIONAL' : 'ON_HAND', allocatedCents: 0 };
    }
    const quantity = decimal(requirement.quantity);
    if (!quantity) { exact.push(ZERO); return row; }
    const observed = observedCost(requirement, quantity, context, quotes, now, admissions);
    if (observed) {
      exact.push(observed.cost);
      return { ...row, basis: 'OBSERVED', allocatedCents: 0, quoteId: observed.quote.id,
        admissionRuleVersion: observed.admission.ruleVersion, stockUnconfirmed: observed.quote.stockLevel === undefined };
    }
    const staticPrice = context.staticPrices.get(requirement.ingredientId);
    const perUnit = staticPrice && Number.isFinite(staticPrice.usdPerUnit) && staticPrice.usdPerUnit >= 0
      ? decimal(String(staticPrice.usdPerUnit)) : undefined;
    const cost = perUnit ? multiply(multiply(perUnit, quantity), { numerator: 100n, denominator: 1n }) : undefined;
    if (staticPrice?.unit === requirement.unit && cost && supported(cost)) {
      exact.push(cost);
      return { ...row, basis: 'STATIC_ESTIMATE', allocatedCents: 0 };
    }
    exact.push(ZERO);
    return row;
  });
  const total = exact.reduce(add, ZERO);
  if (!supported(total)) throw new RangeError('Recipe price exceeds the supported range');
  const totalCents = Number((2n * total.numerator + total.denominator) / (2n * total.denominator));
  let floorTotal = 0;
  rows.forEach((row, index) => {
    if (row.allocatedCents !== null) {
      row.allocatedCents = Number(exact[index].numerator / exact[index].denominator);
      floorTotal += row.allocatedCents;
    }
  });
  const remainders = rows.map((row, index) => ({ row, index,
    remainder: fraction(exact[index].numerator % exact[index].denominator, exact[index].denominator) }))
    .filter(({ row, remainder }) => row.allocatedCents !== null && remainder.numerator > 0n)
    .sort((a, b) => compare(b.remainder, a.remainder) || lexical(a.row.key, b.row.key));
  for (let index = 0; index < totalCents - floorTotal; index++) remainders[index].row.allocatedCents! += 1;
  return { rows, totalCents, includesStaticEstimates: rows.some((row) => row.basis === 'STATIC_ESTIMATE'),
    incompleteEstimate: rows.some((row) => row.basis === 'UNPRICED') };
}
