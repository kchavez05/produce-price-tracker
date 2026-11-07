import { PROTEIN_RECIPE_FOODS } from '../../src/lib/pantry/protein-offer';
import { CookingIngredient, ScopedRecipeUse } from '../../src/types/catalog';
import { MealPrepBlueprint } from '../../src/types/domain';
import { sha256 } from './catalog-curation';
import { approvedMarketCoverageBatches, record as object } from './market-coverage-approvals';
import { OFFER_FOOD_TERMS } from '../../src/lib/pantry/offer-food';
const strings = (v: unknown): v is string[] => Array.isArray(v) && v.every((id) => typeof id === 'string');

/** Preserve the original approval and apply only hash-bound, append-only scoped revisions. */
export function compileScopedRecipeUses(raw: unknown, ingredients: readonly CookingIngredient[], market: readonly { id: string; name: string }[], blueprints: readonly MealPrepBlueprint[], coverageApprovals?: unknown) {
  const batches = approvedMarketCoverageBatches(coverageApprovals);
  if (!object(raw) || raw.formatVersion !== 1 || !object(raw.review) || !object(raw.proposal) ||
    typeof raw.review.by !== 'string' || !raw.review.by.trim() || typeof raw.review.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(raw.review.date) ||
    raw.review.payloadSha256 !== sha256(raw.proposal) || raw.integrationMarketHash !== sha256(market)) throw new Error('Scoped recipe approval or integration fingerprint is stale');
  const proposal = raw.proposal;
  if (!strings(proposal.protectedMarketIngredientIds) || !Array.isArray(proposal.decisions)) throw new Error('Invalid scoped recipe proposal');
  const protectedIds = new Set(proposal.protectedMarketIngredientIds);
  const rows = new Map<string, Record<string, unknown>>();
  for (const row of proposal.decisions) {
    if (!object(row)) throw new Error('Invalid scoped recipe decision');
    const { status, payloadSha256, ...payload } = row;
    if (status !== 'proposed' || payloadSha256 !== sha256(payload) || row.revision !== 1 || typeof row.id !== 'string' || rows.has(row.id)) throw new Error('Invalid scoped recipe decision');
    rows.set(row.id, row);
  }
  let blueprintHash = raw.integrationBlueprintHash;
  for (const { recipeUses: revision } of batches) {
    if (revision.formatVersion !== 1 || revision.status !== 'proposed' || revision.blueprintHash !== blueprintHash || revision.marketHash !== sha256(market) || revision.previousScopedApprovalHash !== sha256(raw) ||
      !strings(revision.protectedMarketIngredientIds) || !Array.isArray(revision.decisions)) throw new Error('Scoped revision approval or integration fingerprint is stale');
    for (const id of revision.protectedMarketIngredientIds) protectedIds.add(id);
    const revised = new Set<string>();
    for (const row of revision.decisions) {
      if (!object(row) || typeof row.id !== 'string' || revised.has(row.id)) throw new Error('Invalid scoped revision');
      const { status, payloadSha256, ...payload } = row;
      const previous = rows.get(row.id);
      if (status !== 'proposed' || payloadSha256 !== sha256(payload) || row.revision !== (previous ? Number(previous.revision) + 1 : 1) ||
        row.supersedesPayloadSha256 !== previous?.payloadSha256 || !['allow', 'reject'].includes(String(row.action))) throw new Error('Scoped revision history or payload changed');
      revised.add(row.id);
      rows.set(row.id, row);
    }
    if (revision.auxiliaryCandidateDecisions !== undefined) {
      if (!Array.isArray(revision.auxiliaryCandidateDecisions)) throw new Error('Invalid auxiliary candidate removals');
      const auxiliaryIds = new Set<string>();
      for (const row of revision.auxiliaryCandidateDecisions) {
        if (!object(row)) throw new Error('Invalid auxiliary candidate removal');
        const { status, payloadSha256, ...payload } = row;
        const recipe = blueprints.find((b) => b.id === row.recipeId);
        const slot = recipe?.slots.find((s) => s.slotKey === row.slotKey);
        if (status !== 'proposed' || payloadSha256 !== sha256(payload) || row.action !== 'reject' || !recipe || !slot || typeof row.marketIngredientId !== 'string' ||
          row.id !== `${recipe.id}:${slot.slotKey}:${row.marketIngredientId}` || auxiliaryIds.has(String(row.id)) || protectedIds.has(row.marketIngredientId) ||
          [...slot.candidateIngredientIds, ...slot.lowCarbCandidateIds ?? []].includes(row.marketIngredientId)) throw new Error('Auxiliary rejected candidate remains active or changes protected scope');
        auxiliaryIds.add(String(row.id));
      }
    }
    blueprintHash = revision.proposedImplementedBlueprintHash;
  }
  if (blueprintHash !== sha256(blueprints)) throw new Error('Scoped recipe approval or integration fingerprint is stale');
  const known = new Map(ingredients.map((r) => [r.id, r]));
  const uses: ScopedRecipeUse[] = [];
  const seen = new Set<string>();
  for (const row of rows.values()) {
    const recipe = blueprints.find((b) => b.id === row.recipeId);
    const slot = recipe?.slots.find((s) => s.slotKey === row.slotKey);
    const item = market.find((m) => m.id === row.marketIngredientId);
    if (!recipe || !slot || !item || row.id !== `${recipe.id}:${slot.slotKey}:${item.id}` || !protectedIds.has(item.id) || !strings(row.pantryIngredientIds) || !strings(row.offerFoods)) throw new Error('Invalid or incomplete scoped recipe decision');
    const isCandidate = [...slot.candidateIngredientIds, ...slot.lowCarbCandidateIds ?? []].includes(item.id);
    if (row.action === 'reject') {
      if (isCandidate || row.pantryIngredientIds.length || row.offerFoods.length) throw new Error('Rejected recipe candidate remains active');
      continue;
    }
    if (!isCandidate || new Set(row.pantryIngredientIds).size !== row.pantryIngredientIds.length || row.pantryIngredientIds.some((id) => !known.has(id)) ||
      !row.offerFoods.length || row.offerFoods.some((food) => !Object.hasOwn(OFFER_FOOD_TERMS, food) && !Object.hasOwn(PROTEIN_RECIPE_FOODS, food))) throw new Error('Invalid or incomplete scoped recipe decision');
    const original = proposal.decisions.find((r: { id?: string }) => r.id === row.id);
    const displayName = typeof row.displayName === 'string' ? row.displayName : original?.displayName ?? row.pantryIngredientIds.map((id) => known.get(id)!.name).join(' or ');
    if (typeof displayName !== 'string' || !displayName.trim()) throw new Error('Scoped recipe display name is required');
    seen.add(String(row.id));
    uses.push({ id: String(row.id), recipeId: recipe.id, slotKey: slot.slotKey, slotLabel: slot.label, marketIngredientId: item.id, marketIngredientName: item.name, displayName, pantryIngredientIds: row.pantryIngredientIds, offerFoods: row.offerFoods });
  }
  const expected = blueprints.flatMap((b) => b.slots.flatMap((s) => [...new Set([...s.candidateIngredientIds, ...s.lowCarbCandidateIds ?? []])].filter((id) => protectedIds.has(id)).map((id) => `${b.id}:${s.slotKey}:${id}`)));
  if (expected.length !== seen.size || expected.some((id) => !seen.has(id))) throw new Error('Every protected recipe candidate must be reviewed');
  const recipeIds = new Set(uses.map((u) => u.recipeId));
  return { uses, protectedMarketIds: [...protectedIds].sort(), contexts: blueprints.filter((b) => recipeIds.has(b.id)).map(({ id, title, steps }) => ({ id, title, steps })) };
}
