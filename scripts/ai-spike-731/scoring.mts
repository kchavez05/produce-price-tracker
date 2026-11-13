import { object, percentile95, schemaErrors, type Fixture, type ObjectValue, type Packet } from './core.mjs';

export interface SpeechScore {
  schemaValid: boolean; taskValid: boolean; tp: number; fp: number; fn: number;
  quantityCorrect: number; quantityTotal: number; critical: string[]; errors: string[];
}
export function speechScore(value: unknown, fixture: Fixture, packet: Packet): SpeechScore {
  const rawSchemaErrors = schemaErrors(value, packet.speechSchema);
  const expected = fixture.expected.items as ObjectValue[];
  const raw = value && typeof value === 'object' && !Array.isArray(value) ? object(value) : {};
  const rawItems = Array.isArray(raw.items) ? raw.items.filter(item => item && typeof item === 'object' && !Array.isArray(item)).map(object) : [];
  const aliases = object(packet.prompts.unitAliases);
  const canonical = (unit: unknown): string | undefined => Object.entries(aliases).find(([, values]) => (values as unknown[]).includes(unit))?.[0];
  // Only the explicitly approved unit aliases are normalized. Missing fields,
  // numeric quantities, identities and unknown units are never repaired.
  const normalized = { ...raw, ...(Array.isArray(raw.items) ? { items:raw.items.map(item => item && typeof item === 'object' && !Array.isArray(item) ? { ...object(item), ...('unit' in object(item) && canonical(object(item).unit) ? { unit:canonical(object(item).unit) } : {}) } : item) } : {}) };
  const errors = schemaErrors(normalized,packet.speechSchema);
  const critical: string[] = [];
  if (fixture.expected.maxProposedItems === 0 && rawItems.length) critical.push('unexpected_proposal_in_no_add_case');
  const excluded = new Set(fixture.expected.excludedIngredientIds as string[]);
  if (rawItems.some(item => typeof item.ingredientId==='string' && excluded.has(item.ingredientId))) critical.push('negated_or_wrong_form_proposal');
  // All proposals remain in an isolated harness; no mutation tool/route exists.
  const predictions = errors.length ? [] : (normalized.items as ObjectValue[]);
  const unmatched = [...predictions]; let tp = 0; let quantityCorrect = 0;
  for (const reference of expected) {
    const index = unmatched.findIndex(item => item.ingredientId === reference.ingredientId);
    if (index < 0) continue;
    tp++; const [prediction] = unmatched.splice(index,1);
    if (!('quantity' in reference) && (prediction.quantity !== null || prediction.unit !== null)) errors.push('invented_unspoken_quantity');
    if ('quantity' in reference && prediction.quantity === reference.quantity && canonical(prediction.unit) === canonical(reference.unit)) quantityCorrect++;
  }
  const accepted = (fixture.expected.acceptedStatuses ?? [fixture.expected.status]) as string[];
  const statusValid = typeof raw.status==='string' && accepted.includes(raw.status);
  const needsReview = fixture.expected.status === 'needs_review' && raw.status !== 'no_change';
  const reviewValid = !needsReview || Array.isArray(raw.reviewRequired) && raw.reviewRequired.some(item => typeof item === 'string' && item.trim().length > 0);
  const quantityTotal = expected.filter(item => 'quantity' in item).length;
  const fp = unmatched.length; const fn = expected.length - tp;
  if (!statusValid) errors.push('oracle_status');
  if (!reviewValid) errors.push('review_explanation_missing');
  return { schemaValid:rawSchemaErrors.length === 0, taskValid:errors.length === 0 && !critical.length && fp === 0 && fn === 0 && quantityCorrect === quantityTotal,
    tp, fp, fn, quantityCorrect, quantityTotal, critical, errors };
}
export function recipeChecks(value: unknown, fixture: Fixture, packet: Packet): ObjectValue {
  const schema = schemaErrors(value,packet.recipeSchema);
  const errors = [...schema]; const critical: string[] = [];
  if (!schema.length) {
    const root = object(value); const dishes = root.dishes as ObjectValue[];
    if (root.status !== fixture.expected.status || dishes.length !== fixture.expected.dishCount) errors.push('oracle_status_or_count');
    const ids = new Set(packet.catalog.map(item => item.id));
    const ingredients = dishes.flatMap(dish => dish.ingredients as ObjectValue[]);
    const used = new Set(ingredients.map(item => item.ingredientId));
    if (ingredients.some(item => item.ingredientId !== null && !ids.has(String(item.ingredientId)))) errors.push('unknown_catalog_id');
    if (dishes.some(dish => dish.servings !== fixture.context?.targetServings)) errors.push('target_servings');
    if ((fixture.expected.forbiddenIngredientIds as string[]).some(id => used.has(id))) critical.push('forbidden_ingredient_id');
    if (((fixture.expected.requiredIngredientIds ?? []) as string[]).some(id => !used.has(id))) errors.push('required_food_or_form');
    if (new Set(dishes.map(dish => String(dish.title).trim().toLowerCase())).size !== dishes.length) errors.push('duplicate_dish_title');
  }
  return { schemaValid:schema.length === 0, automaticErrors:errors, automaticCritical:critical,
    humanReviewRequired:true, businessRulesPassed:null, culinaryGrade:null };
}
export interface RunReceipt { job: { key: string; target: string; fixture: string; task: string }; completed: boolean; completionMs: number | null; score: ObjectValue }
export function summarize(receipts: RunReceipt[], expectedAttempts: number): ObjectValue {
  // Missing/failed results stay in all denominators and in the p95 latency sample.
  if (receipts.length > expectedAttempts || new Set(receipts.map(item => item.job.key)).size !== receipts.length) throw new Error('Duplicate/extra results');
  const times = receipts.map(item => item.completed && item.completionMs !== null ? item.completionMs : Infinity);
  while (times.length < expectedAttempts) times.push(Infinity);
  const p95 = percentile95(times);
  const schemaValid = receipts.filter(item => item.score.schemaValid === true).length;
  return { expectedAttempts, observedAttempts:receipts.length, schemaValid, firstAttemptSchemaRate:expectedAttempts ? schemaValid/expectedAttempts : 0,
    observedP95Ms:Number.isFinite(p95) ? p95 : null, p95IncludesFailures:true,
    humanReviewPending:receipts.some(item => item.score.humanReviewRequired === true), decisionComplete:false };
}
