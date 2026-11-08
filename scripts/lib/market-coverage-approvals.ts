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
    return { envelope: batch.envelope, recipeUses: batch.recipeUses, counterparts: batch.counterparts };
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
        !['named-unprepared-potatoes-unspecified-or-variety', 'named-unprepared-apples-unspecified-or-variety', 'named-unprepared-summer-squash-unspecified-or-variety', 'require-exact-reviewed-food-and-qualification', 'require-raw-salmon-fillet-unspecified-or-species', 'require-exact-reviewed-protein-cut-species-and-cooking-state', 'require-exact-reviewed-dairy-type-moisture-flavor-and-fat'].includes(String(value.titlePolicy))) throw new Error('Invalid or conflicting market counterpart');
      seen.add(String(value.id));
      result.push({ marketIngredientId: value.marketIngredientId, pantryIngredientId: value.pantryIngredientId });
    }
  }
  return result;
}
