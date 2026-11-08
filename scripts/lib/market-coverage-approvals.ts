import { EXACT_OFFER_IDS } from '../../src/lib/pantry/exact-offer';
import { CookingIngredient, MarketCounterpart } from '../../src/types/catalog';
import { sha256 } from './catalog-curation';
export const record = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === 'object' && !Array.isArray(value));
export function approvedMarketCoverageBatches(raw: unknown) {
  if (raw === undefined) return [];
  if (!record(raw) || raw.formatVersion !== 1 || !Array.isArray(raw.approvals) || !raw.approvals.length) throw new Error('Invalid market coverage approval ledger');
  const approvals = raw.approvals;
  return approvals.map((batch: unknown, index: number) => {
    if (!record(batch) || !record(batch.review) || !record(batch.envelope) || !record(batch.envelope.fileHashes) || !record(batch.recipeUses) || !record(batch.counterparts) || !record(batch.offerCases) ||
      typeof batch.review.by !== 'string' || !batch.review.by.trim() || typeof batch.review.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(batch.review.date) || batch.review.payloadSha256 !== sha256(batch.envelope) ||
      batch.envelope.fileHashes['recipe-use-proposal.json'] !== sha256(batch.recipeUses) || batch.envelope.fileHashes['market-counterparts.json'] !== sha256(batch.counterparts) || batch.envelope.fileHashes['behavior-cases.json'] !== sha256(batch.offerCases)) throw new Error('Market coverage approval or exact package hash is stale');
    if (index > 0) {
      const previousHash = sha256({ formatVersion: 1, approvals: approvals.slice(0, index) });
      if (batch.envelope.previousCoverageApprovalHash !== previousHash || batch.recipeUses.previousCoverageApprovalHash !== previousHash) throw new Error('Market coverage approval chain is stale');
    }
    for (const [file, key] of [['offer-qualifications.json', 'qualifications'], ['scope-deferrals.json', 'scopeDeferrals']]) {
      if (batch.envelope.fileHashes[file] !== undefined && (!record(batch[key]) || batch.envelope.fileHashes[file] !== sha256(batch[key]))) throw new Error('Qualification or release scope approval is stale');
    }
    return { envelope: batch.envelope, recipeUses: batch.recipeUses, counterparts: batch.counterparts, qualifications: batch.qualifications, scopeDeferrals: batch.scopeDeferrals };
  });
}
export function compileMarketCounterparts(raw: unknown, ingredients: readonly CookingIngredient[], market: readonly { id: string; name: string }[]) {
  const result: MarketCounterpart[] = [];
  const seen = new Set<string>();
  for (const { counterparts } of approvedMarketCoverageBatches(raw)) {
    if (counterparts.formatVersion !== 1 || counterparts.status !== 'proposed' || counterparts.marketHash !== sha256(market) || !Array.isArray(counterparts.decisions) || !record(counterparts.defaults) || (counterparts.ambiguousTerms !== undefined && !Array.isArray(counterparts.ambiguousTerms))) throw new Error('Market counterpart inputs are stale');
    for (const value of counterparts.decisions) {
      if (!record(value)) throw new Error('Invalid market counterpart');
      const { status, payloadSha256, ...payload } = value;
      const ingredient = ingredients.find((r) => r.id === value.pantryIngredientId);
      if (status !== 'proposed' || payloadSha256 !== sha256(payload) || value.revision !== 1 || !ingredient || value.foodName !== ingredient.name ||
        !market.some((r) => r.id === value.marketIngredientId) || typeof value.marketIngredientId !== 'string' || typeof value.pantryIngredientId !== 'string' ||
        value.id !== `counterpart:${value.marketIngredientId}:${value.pantryIngredientId}` || seen.has(String(value.id)) ||
        !['named-unprepared-potatoes-unspecified-or-variety', 'named-unprepared-apples-unspecified-or-variety', 'named-unprepared-summer-squash-unspecified-or-variety', 'require-exact-reviewed-food-and-qualification', 'require-raw-salmon-fillet-unspecified-or-species', 'require-exact-reviewed-protein-cut-species-and-cooking-state', 'require-exact-reviewed-dairy-type-moisture-flavor-and-fat', 'require-exact-existing-identity-qualification'].includes(String(value.titlePolicy))) throw new Error('Invalid or conflicting market counterpart');
      seen.add(String(value.id));
      result.push({ marketIngredientId: value.marketIngredientId, pantryIngredientId: value.pantryIngredientId });
    }
  }
  return result;
}

/** Reviewed exact-food gates and narrow exclusions do not change pantry ownership. */
export function compileExactQualifications(raw: unknown, ingredients: readonly CookingIngredient[], market: readonly { id: string }[], blueprints: readonly import('../../src/types/domain').MealPrepBlueprint[]) {
  const qualifications: { marketIngredientId: string; pantryIngredientId: string }[] = [];
  const exclusions: { recipeId: string; slotKey: string; pantryIngredientId: string }[] = [];
  for (const batch of approvedMarketCoverageBatches(raw)) {
    if (batch.qualifications === undefined) continue;
    const data = batch.qualifications, scope = batch.scopeDeferrals;
    if (!record(data) || data.formatVersion !== 1 || data.status !== 'proposed' || data.preserveExactPantryLinks !== true || !Array.isArray(data.decisions) || data.marketHash !== sha256(market) || !record(scope) || !Array.isArray(scope.decisions) || scope.decisions.length !== 5) throw new Error('Invalid exact qualification or scope decisions');
    for (const row of [...data.decisions, ...scope.decisions]) {
      if (!record(row)) throw new Error('Invalid exact decision');
      const { status, payloadSha256, ...payload } = row;
      if (status !== 'proposed' || payloadSha256 !== sha256(payload)) throw new Error('Exact decision payload changed');
    }
    for (const row of data.decisions) {
      if (!record(row) || typeof row.marketIngredientId !== 'string' || row.marketIngredientId !== row.pantryIngredientId || !ingredients.some((i) => i.id === row.pantryIngredientId && i.recipeIngredientId === row.marketIngredientId) || qualifications.some((q) => q.marketIngredientId === row.marketIngredientId)) throw new Error('Exact qualification changes ownership');
      qualifications.push({ marketIngredientId: row.marketIngredientId, pantryIngredientId: row.marketIngredientId });
    }
    const rows = batch.recipeUses.exactRecipeExclusions;
    if (!Array.isArray(rows)) throw new Error('Exact exclusions are missing');
    for (const row of rows) {
      if (!record(row)) throw new Error('Invalid exact exclusion');
      const { status, payloadSha256, ...payload } = row;
      const recipe = blueprints.find((b) => b.id === row.recipeId);
      if (status !== 'proposed' || payloadSha256 !== sha256(payload) || !recipe || typeof row.slotKey !== 'string' || !recipe.slots.some((s) => s.slotKey === row.slotKey) || typeof row.pantryIngredientId !== 'string' || row.marketIngredientId !== row.pantryIngredientId || !qualifications.some((q) => q.pantryIngredientId === row.pantryIngredientId) || recipe.slots.some((s) => [...s.candidateIngredientIds,...s.lowCarbCandidateIds ?? []].includes(String(row.pantryIngredientId))) || exclusions.some((r) => r.recipeId === row.recipeId && r.pantryIngredientId === row.pantryIngredientId)) throw new Error('Exact exclusion blocks a legitimate slot or changes ownership');
      exclusions.push({ recipeId: recipe.id, slotKey: row.slotKey, pantryIngredientId: row.pantryIngredientId });
    }
  }
  if (qualifications.length && sha256(qualifications.map((q) => q.marketIngredientId).sort()) !== sha256([...EXACT_OFFER_IDS].sort())) throw new Error('Runtime qualification policy does not match approval');
  return { qualifications, exclusions };
}
