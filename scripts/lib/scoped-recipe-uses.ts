import { CookingIngredient, ScopedRecipeUse } from '../../src/types/catalog';
import { MealPrepBlueprint } from '../../src/types/domain';
import { sha256 } from './catalog-curation';

const object = (v: unknown): v is Record<string, unknown> => Boolean(v && typeof v === 'object' && !Array.isArray(v));
const strings = (v: unknown): v is string[] => Array.isArray(v) && v.every((id) => typeof id === 'string');
const foods = new Set(['carrots', 'broccoli', 'cauliflower', 'spinach', 'kale', 'white-mushrooms', 'cremini-mushrooms', 'tomatoes', 'tomatillos']);

/** Approval binds the original proposal; integration fingerprints bind the implemented directions. */
export function compileScopedRecipeUses(raw: unknown, ingredients: readonly CookingIngredient[], market: readonly { id: string; name: string }[], blueprints: readonly MealPrepBlueprint[]) {
  if (!object(raw) || raw.formatVersion !== 1 || !object(raw.review) || !object(raw.proposal) ||
    typeof raw.review.by !== 'string' || !raw.review.by.trim() || typeof raw.review.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(raw.review.date) ||
    raw.review.payloadSha256 !== sha256(raw.proposal) || raw.integrationBlueprintHash !== sha256(blueprints) || raw.integrationMarketHash !== sha256(market)) throw new Error('Scoped recipe approval or integration fingerprint is stale');
  const proposal = raw.proposal;
  if (!strings(proposal.protectedMarketIngredientIds) || !Array.isArray(proposal.decisions)) throw new Error('Invalid scoped recipe proposal');
  const protectedIds = new Set(proposal.protectedMarketIngredientIds);
  const known = new Set(ingredients.map((r) => r.id));
  const uses: ScopedRecipeUse[] = [];
  const seen = new Set<string>();
  for (const row of proposal.decisions) {
    if (!object(row)) throw new Error('Invalid scoped recipe decision');
    const { status, payloadSha256, ...payload } = row;
    const recipe = blueprints.find((b) => b.id === row.recipeId);
    const slot = recipe?.slots.find((s) => s.slotKey === row.slotKey);
    const item = market.find((m) => m.id === row.marketIngredientId);
    if (status !== 'proposed' || payloadSha256 !== sha256(payload) || !recipe || !slot || !item || row.revision !== 1 ||
      row.id !== `${recipe.id}:${slot.slotKey}:${item.id}` || seen.has(row.id as string) || !protectedIds.has(item.id) ||
      ![...slot.candidateIngredientIds, ...slot.lowCarbCandidateIds ?? []].includes(item.id) ||
      typeof row.displayName !== 'string' || !row.displayName.trim() || !strings(row.pantryIngredientIds) ||
      new Set(row.pantryIngredientIds).size !== row.pantryIngredientIds.length || row.pantryIngredientIds.some((id) => !known.has(id)) ||
      !strings(row.offerFoods) || !row.offerFoods.length || row.offerFoods.some((food) => !foods.has(food))) throw new Error('Invalid or incomplete scoped recipe decision');
    seen.add(row.id as string);
    uses.push({ id: row.id as string, recipeId: recipe.id, slotKey: slot.slotKey, slotLabel: slot.label,
      marketIngredientId: item.id, marketIngredientName: item.name, displayName: row.displayName,
      pantryIngredientIds: row.pantryIngredientIds, offerFoods: row.offerFoods });
  }
  const expected = blueprints.flatMap((b) => b.slots.flatMap((s) => [...new Set([...s.candidateIngredientIds, ...s.lowCarbCandidateIds ?? []])]
    .filter((id) => protectedIds.has(id)).map((id) => `${b.id}:${s.slotKey}:${id}`)));
  if (expected.length !== seen.size || expected.some((id) => !seen.has(id))) throw new Error('Every protected recipe candidate must be reviewed');
  const recipeIds = new Set(uses.map((u) => u.recipeId));
  const contexts = blueprints.filter((b) => recipeIds.has(b.id)).map(({ id, title, steps }) => ({ id, title, steps }));
  return { uses, contexts };
}
