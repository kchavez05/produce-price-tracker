import { describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import cases from '../../../catalog/proposals/2026-11-07-market-dairy/behavior-cases.json';
import proposal from '../../../catalog/proposals/2026-11-07-market-dairy/recipe-use-proposal.json';
import hashes from '../../../catalog/proposals/2026-11-07-market-dairy/decision-hashes.json';
import evidence from '../../../catalog/proposals/2026-11-07-market-dairy/source-evidence.json';
import ledgerData from '../../../catalog/curation-ledger.json';
import previous from '../../../catalog/releases/2026-11-07.2/catalog.json';
import artifactData from '../../../catalog/releases/2026-11-07.3/catalog.json';
import approval from '../../../catalog/market-coverage-approvals.json';
import originalScoped from '../../../catalog/scoped-recipe-uses.json';
import runtime from '@/data/cooking-catalog.json';
import { MEAL_PREP_BLUEPRINTS } from '@/data/meal-prep-blueprints';
import { CANONICAL_INGREDIENTS } from '@/data/canonical-ingredients';
import { MatchedSlotIngredient, RecommendedDish, StoreChain } from '@/types/domain';
import { PantryEntry } from '@/types/pantry';
import { ScopedRecipeUse } from '@/types/catalog';
import { decisionHash, parseArtifact, parseLedger, parseSources, sha256 } from '../../../scripts/lib/catalog-curation';
import { compileScopedRecipeUses } from '../../../scripts/lib/scoped-recipe-uses';
import { compileMarketCounterparts } from '../../../scripts/lib/market-coverage-approvals';
import { cookingCatalogView, availablePantryIngredientIds, canSavePantryIngredient } from '@/lib/pantry/model';
import { marketCounterpartIds } from '@/lib/pantry/market-counterparts';
import { recipeOfferAllowed, recipeUseForSlot, scopedRecipeCommodity, isProtectedMarketIngredient } from '@/lib/pantry/recipe-use';
import { recipeUseRequirementId, scopedRecipeUses } from '@/lib/pantry/recipe-identity';
import { applyPantryToRecipe } from '@/lib/pantry/recipe';
import { buildShoppingListAndStoreComparison } from '@/lib/shopping-list';
import { cleanSearchQueryForIngredient } from '@/lib/cart-exporter';
import { scoreAllCommodities } from '@/lib/scoring-and-matcher';
import { rankMealPrepDishes } from '@/lib/meal-prep-matcher';
import { createMockCommodity, createMockDish, createMockOffer } from 'tests/test-utils';
import { beforeDairyBlueprints } from '../../helpers/dairy-blueprints';
const artifact = parseArtifact(artifactData);
const entry = (ingredientId: string, available = true): PantryEntry => ({ id: `${available}:${ingredientId}`, ingredientId, displayName: ingredientId, available, revision: 1, updatedAtIso: '', quantity: 0, useByDate: '2000-01-01' });
const positive = (...ids: string[]) => availablePantryIngredientIds(ids.map((id) => entry(id)));
function slot(use: ScopedRecipeUse, quantityUsed = 2): MatchedSlotIngredient { return { slotLabel: use.slotLabel, ingredientId: use.marketIngredientId, ingredientName: use.marketIngredientName, quantityUsed, unit: 'lb', store: 'KING_SOOPERS', rawDealText: 'old estimate', dealType: 'SHELF_OR_MEMBER', unitCost: 99, slotCost: 99 * quantityUsed, regularSlotCost: 99 * quantityUsed, isUserPinned: false }; }
function dish(uses: ScopedRecipeUse[], quantity = 2): RecommendedDish { const b = MEAL_PREP_BLUEPRINTS.find((b) => b.id === uses[0].recipeId)!; return createMockDish({ id: b.id, title: b.title, steps: [...b.steps], matchedIngredients: uses.map((u) => slot(u, quantity)), pantryStaples: [], pantryRequirements: [], estimatedPantryCost: 0 }); }
function market(use: ScopedRecipeUse, offers: [string, number, StoreChain][], pool: StoreChain[] = ['KING_SOOPERS']) { const recipeOffers = offers.map(([rawTitle, normalizedPricePerUnit, store]) => createMockOffer({ canonicalIngredientId: use.marketIngredientId, rawTitle, normalizedPricePerUnit, regularPricePerUnit: normalizedPricePerUnit + 1, store })); return createMockCommodity({ ingredient: CANONICAL_INGREDIENTS.find((r) => r.id === use.marketIngredientId)!, bestOffer: recipeOffers[0], recipeOffers, recipeStorePool: pool, storeOffers: { [recipeOffers[0].store]: recipeOffers[0] } }); }
const accepted = proposal.decisions.filter((r) => r.action === 'allow').flatMap((row) => row.pantryIngredientIds.map((pantryId) => ({ row, pantryId })));
const dairyUses = scopedRecipeUses.filter((u) => proposal.protectedMarketIngredientIds.includes(u.marketIngredientId));
const breakfast = 'high-protein-sausage-egg-sweet-potato-breakfast-casserole';
const breakfastUses = dairyUses.filter((u) => u.recipeId === breakfast);

describe('approved dairy market integration', () => {
  it('binds all exact approvals while retaining every prior ingredient, estimate and global link', () => {
    const ledger = parseLedger(ledgerData);
    expect(artifact.ingredients).toHaveLength(222); expect(artifact.decisions).toHaveLength(252); expect(hashes).toHaveLength(36);
    expect(artifact.decisions).toEqual(expect.arrayContaining(previous.decisions));
    for (const before of previous.ingredients) expect(artifact.ingredients.find((i) => i.id === before.id)).toEqual(before);
    for (const h of hashes) { const d = ledger.decisions.find((r) => r.id === h.id && r.revision === h.revision)!; expect(d.status).toBe('approved'); expect(decisionHash(d)).toBe(h.payloadSha256); expect(d.review).toMatchObject({ date: '2026-11-07', payloadSha256: h.payloadSha256 }); }
    const added = artifact.ingredients.filter((i) => !previous.ingredients.some((p) => p.id === i.id)); expect(added).toHaveLength(23); expect(added.every((i) => !i.staticPrice && !i.recipeIngredientId)).toBe(true);
    expect(artifact.compatibility).toHaveLength(previous.compatibility.length + 13);
    expect(artifact.sourceLinks.filter((r) => r.purpose === 'identity')).toHaveLength(178); expect(artifact.sourceLinks.filter((r) => r.purpose === 'general-reference')).toHaveLength(5); expect(new Set(artifact.sourceLinks.map((r) => r.ingredientId)).size).toBe(175);
    const old = new Set(previous.sourceLinks.map((r) => `${r.ingredientId}:${r.key}`)); const selected = parseSources(evidence);
    for (const link of artifact.sourceLinks.filter((r) => !old.has(`${r.ingredientId}:${r.key}`))) expect(selected.records.find((r) => r.key === link.key)).toMatchObject({ fingerprint: link.fingerprint, disposition: 'candidate' });
  });
  it.each(cases.availabilityCases)('preserves independent foods and generic No: $id', (r) => {
    const ids = availablePantryIngredientIds([...r.positives.map((id) => entry(id)), ...r.negatives.map((id) => entry(id, false))]); expect(r.requiredIds.filter((id) => ids.includes(id))).toHaveLength(r.expectedCovered);
  });
  it.each(cases.offerCases)('qualifies "$title" before any recipe price or pantry ownership', (r) => {
    for (const title of [r.title, ...(/nonfat/i.test(r.title) ? ['Fat-Free', 'Fat Free', 'Non-Fat'].map((q) => r.title.replace(/nonfat/gi, q)) : [])]) {
      expect(marketCounterpartIds(r.marketIngredientId, title)).toEqual([...r.expectedCounterpartIds].sort());
      for (const use of dairyUses.filter((u) => u.marketIngredientId === r.marketIngredientId)) expect(recipeOfferAllowed(use, title), use.id).toBe(use.offerFoods.some((f) => r.allowedRecipeFoodIds.includes(f)));
    }
  });
  it('admits equivalent nonfat wet-curd cottage labels without inventing a fat-specific identity', () => {
    for (const qualifier of ['Nonfat', 'Fat-Free', 'Fat Free', 'Non-Fat']) {
      const title = `Plain ${qualifier} Cottage Cheese`;
      expect(marketCounterpartIds('cottage-cheese-sour-cream', title)).toEqual(['cottage-cheese-plain']);
      for (const use of dairyUses.filter((u) => u.pantryIngredientIds.includes('cottage-cheese-plain'))) expect(recipeOfferAllowed(use, title)).toBe(true);
      expect(marketCounterpartIds('cottage-cheese-sour-cream', `Plain ${qualifier} Dry Curd Cottage Cheese`)).toEqual([]);
    }
  });
  it.each(accepted)('covers/prices $pantryId only in $row.id', ({ row, pantryId }) => {
    const use = dairyUses.find((u) => u.id === row.id)!;
    const example = cases.offerCases.find((c) => c.marketIngredientId === row.marketIngredientId && c.allowedRecipeFoodIds.includes(pantryId))!; expect(example).toBeDefined();
    const quote = market(use, [[example.title, 2, 'KING_SOOPERS']]), input = dish([use]), before = JSON.stringify(input);
    const owned = applyPantryToRecipe(input, positive(pantryId), [quote]); expect(owned.pantryCoverage).toMatchObject({ requiredCount: 1, availableRequiredCount: 1 }); expect(owned.totalBatchCost).toBe(0);
    expect(buildShoppingListAndStoreComparison([owned], [quote], positive(pantryId), '80542', ['KING_SOOPERS'], true).items).toHaveLength(0);
    expect(applyPantryToRecipe(input, [], [quote]).totalBatchCost).toBe(4);
    const no = availablePantryIngredientIds([entry(pantryId), entry(pantryId, false)]); expect(applyPantryToRecipe(input, no, [quote]).totalBatchCost).toBe(4);
    const unpriced = applyPantryToRecipe(input, [], []); expect(unpriced.additionalCostEstimateComplete).toBe(false); expect(applyPantryToRecipe(unpriced, [], [quote]).totalBatchCost).toBe(4); expect(JSON.stringify(input)).toBe(before);
  });
  it.each(([[], ['cottage-cheese-plain'], ['cheddar-cheese'], ['cottage-cheese-plain', 'cheddar-cheese']] as string[][]).map((ids) => ({ ids })))('requires both breakfast dairy components with pantry $ids', ({ ids }) => {
    expect(breakfastUses).toHaveLength(2);
    const input = dish(breakfastUses, 0.5), original = JSON.stringify(input);
    const quotes = breakfastUses.map((u) => market(u, [[u.slotKey === 'cheddar_top' ? 'Natural Cheddar Cheese Block' : 'Plain Cottage Cheese', 2, 'KING_SOOPERS']]));
    const available = positive(...ids), result = applyPantryToRecipe(input, available, quotes);
    expect(result.pantryCoverage).toMatchObject({ requiredCount: 2, availableRequiredCount: ids.length }); expect(result.totalBatchCost).toBe(2 - ids.length);
    const shopping = buildShoppingListAndStoreComparison([result], quotes, available, '80542', ['KING_SOOPERS'], true); expect(shopping.items).toHaveLength(2 - ids.length);
    for (const u of breakfastUses) expect(shopping.items.some((i) => i.ingredientId === recipeUseRequirementId(u))).toBe(!ids.includes(u.pantryIngredientIds[0]));
    expect(JSON.stringify(input)).toBe(original);
  });
  it('keeps the conjunction through actual ranking, saved unpriced needs, variant No and dairy-free adaptation', () => {
    const quotes = breakfastUses.map((u) => market(u, [[u.slotKey === 'cheddar_top' ? 'Natural Cheddar Cheese Block' : 'Plain Cottage Cheese', 2, 'KING_SOOPERS']]));
    const ranked = rankMealPrepDishes(quotes, [], [], 6, { pantryMode: true }).allRankedDishes.find((r) => r.id === breakfast)!;
    expect(ranked.matchedIngredients.filter((i) => ['Plain Cottage Cheese', 'Shredded Cheddar'].includes(i.slotLabel))).toHaveLength(2);
    for (const u of breakfastUses) expect(ranked.matchedIngredients.find((i) => i.slotLabel === u.slotLabel)?.quantityUsed).toBe(0.5);
    for (const servings of [4,8]) { const scaled = rankMealPrepDishes(quotes, [], [], servings, { pantryMode: true }).allRankedDishes.find((r) => r.id === breakfast)!; for (const u of breakfastUses) expect(scaled.matchedIngredients.find((i) => i.slotLabel === u.slotLabel)?.quantityUsed).toBe(Number((0.5 * servings / 6).toFixed(2))); }
    const input = dish(breakfastUses, 0.5), unpriced = applyPantryToRecipe(input, [], []); expect(unpriced.pantryRequirements).toHaveLength(2); expect(new Set(unpriced.pantryRequirements!.map((r) => r.ingredientId)).size).toBe(2);
    expect(applyPantryToRecipe(unpriced, positive('cottage-cheese-plain-2-percent'), quotes).pantryCoverage).toMatchObject({ requiredCount: 2, availableRequiredCount: 1 });
    const ids = availablePantryIngredientIds([entry('cottage-cheese-plain-2-percent'), entry('cottage-cheese-plain', false), entry('cheddar-cheese')]); expect(applyPantryToRecipe(input, ids, quotes).pantryCoverage!.availableRequiredCount).toBe(1);
    const adapted = rankMealPrepDishes(quotes, [], [], 6, { pantryMode: true, dietaryConstraints: ['DAIRY_FREE'] }).allRankedDishes.find((r) => r.id === breakfast)!;
    expect(adapted.matchedIngredients.some((i) => breakfastUses.some((u) => u.slotLabel === i.slotLabel))).toBe(false);
  });
  it.each<StoreChain>(['KING_SOOPERS', 'SAFEWAY', 'ALDI', 'WALMART', 'TARGET', 'SPROUTS'])('recovers exact original dairy offers before selection at %s', (store) => {
    const use = dairyUses.find((u) => u.marketIngredientId === 'greek-yogurt-tub')!;
    const quote = market(use, [['Vanilla Nonfat Greek Yogurt', 1, store], ['Plain Whole Milk Greek Yogurt', 3, store]], [store]);
    expect(scopedRecipeCommodity(use, quote)!.bestOffer.rawTitle).toBe('Plain Whole Milk Greek Yogurt');
    const scored = scoreAllCommodities(quote.recipeOffers!, store, {}, [store], {}); expect(scored[0].recipeOffers).toHaveLength(2);
    const result = applyPantryToRecipe(dish([use]), [], scored); expect(result.totalBatchCost).toBe(6);
    const shopping = buildShoppingListAndStoreComparison([result], scored, [], '80542', [store], true); expect(shopping.items[0].storePricing?.[store]?.ingredientName).toBe('Plain Whole Milk Greek Yogurt');
  });
  it('retains selected stores, dairy nouns, explicit hot fat requirements and unpriced rejected siblings', () => {
    const use = dairyUses.find((u) => u.marketIngredientId === 'greek-yogurt-tub')!;
    const quote = market(use, [['Vanilla Greek Yogurt', 1, 'KING_SOOPERS'], ['Plain Whole Milk Greek Yogurt', 2, 'SAFEWAY']]); expect(scopedRecipeCommodity(use, quote)).toBeUndefined(); expect(scopedRecipeCommodity(use, { ...quote, recipeStorePool: ['SAFEWAY'] })!.bestOffer.store).toBe('SAFEWAY');
    for (const title of ['Plain Greek Yogurt', 'Plain Lowfat Greek Yogurt', 'Plain Nonfat Greek Yogurt', 'Plain Whole Milk Yogurt', 'Vanilla Whole Milk Greek Yogurt', 'Not Full Fat Plain Greek Yogurt', 'Full Fat Farms Plain Greek Yogurt']) expect(recipeOfferAllowed(use, title)).toBe(false);
    for (const title of ['Plain Whole Milk Greek Yogurt', 'Plain Cottage Cheese', 'Natural Cheddar Cheese Block', 'Full Fat Sour Cream', 'Mexican-style Cheese Blend']) expect(cleanSearchQueryForIngredient(title)).toMatch(/yogurt|cheese|cream/i);
    expect(cleanSearchQueryForIngredient('Plain Whole Milk or Nonfat Greek Yogurt')).toContain('Greek yogurt');
  });
  it('rejects mixed dairy foods, prepared snacks and conflicting retail qualifiers', () => {
    for (const [group, titles] of [
      ['shredded-block-cheese', ['Cheddar Cheese, Sour Cream', 'Natural Cheddar Cream Cheese', 'Natural Cheddar Cheese 2% Milk', 'Natural Cheddar Cheese 50% Less Fat', 'Cheddar Gouda Cheese', 'Natural Cheddar Cheese, Plain Greek Yogurt', 'Smoked Cheddar Cheese', 'Habanero Cheddar Cheese']],
      ['cottage-cheese-sour-cream', ['Plain Cottage Cheese, Greek Yogurt', 'Plain Cottage Cheese 2% 4%', 'Regular Light Sour Cream', 'Plain Cottage Cheese, Monterey Jack', 'Plain Nonfat Cottage Cheese 4%', 'Plain Cottage Cheese with Basil']],
      ['greek-yogurt-tub', ['Plain Whole Milk Greek Yogurt Bars', 'Plain Whole Milk Greek Yogurt Covered Pretzels', 'Plain Whole Milk Greek Yogurt Granola Parfait', 'Plain Whole Milk Greek Yogurt, Sour Cream', 'Plain Whole Milk Greek Yogurt 2%', 'Plain Whole Milk Greek Yogurt with Honey', 'Plain Banana Whole Milk Greek Yogurt', 'Plain Whole Milk Greek Yogurt Cheesecake', 'No Full Fat Plain Greek Yogurt']],
    ] as [string, string[]][]) for (const title of titles) expect(marketCounterpartIds(group, title), title).toEqual([]);
  });
  it.each(cases.rejectedScopeContexts)('blocks removed $marketIngredientId in $recipeId across current/custom/old contexts', (r) => {
    const b = MEAL_PREP_BLUEPRINTS.find((b) => b.id === r.recipeId)!, s = b.slots.find((s) => s.slotKey === r.slotKey)!; expect(s.candidateIngredientIds).not.toContain(r.marketIngredientId); expect(isProtectedMarketIngredient(r.marketIngredientId)).toBe(true); expect(recipeUseForSlot(r.recipeId, s.label, r.marketIngredientId)).toBeUndefined();
    const fake: ScopedRecipeUse = { id: `${r.recipeId}:${r.slotKey}:${r.marketIngredientId}`, recipeId: r.recipeId, slotKey: r.slotKey, slotLabel: s.label, marketIngredientId: r.marketIngredientId, marketIngredientName: CANONICAL_INGREDIENTS.find((m) => m.id === r.marketIngredientId)!.name, displayName: s.label, pantryIngredientIds: ['cheddar-cheese'], offerFoods: ['cheddar-cheese'] };
    const input = dish([fake]), quote = market(fake, [['Natural Cheddar Cheese Block', 2, 'KING_SOOPERS']]);
    for (const stale of [input, { ...input, aiGenerated: true }, { ...input, title: 'Custom dairy recipe' }, { ...input, steps: ['Edited instructions'] }]) { const out = applyPantryToRecipe(stale, positive('cheddar-cheese'), [quote]); expect(out.pantryCoverage!.availableRequiredCount).toBe(0); expect(out.additionalCostEstimateComplete).toBe(false); }
  });
  it('rejects the old combined breakfast slot even when its old title and dairy group survive', () => {
    const old = beforeDairyBlueprints().find((b) => b.id === breakfast)!, use = breakfastUses[0];
    const input = { ...dish([use]), steps: old.steps, matchedIngredients: [{ ...slot(use), slotLabel: 'Cottage Cheese & Shredded Cheddar' }] };
    const out = applyPantryToRecipe(input, positive('cottage-cheese-plain', 'cheddar-cheese'), []); expect(out.pantryCoverage!.availableRequiredCount).toBe(0); expect(out.additionalCostEstimateComplete).toBe(false);
  });
  it('binds the append-only approval, exact required quantities and all previous scope payloads', () => {
    const compile = (raw: unknown = approval) => compileScopedRecipeUses(originalScoped, artifact.ingredients, CANONICAL_INGREDIENTS, MEAL_PREP_BLUEPRINTS, raw);
    expect(compile().uses).toEqual(scopedRecipeUses); expect(scopedRecipeUses).toHaveLength(63); expect(dairyUses).toHaveLength(14); expect(compile().protectedMarketIds).toEqual(runtime.protectedRecipeMarketIds); expect(runtime.protectedRecipeMarketIds).toHaveLength(20);
    expect(compileMarketCounterparts(approval, artifact.ingredients, CANONICAL_INGREDIENTS)).toEqual(runtime.marketCounterparts); expect(runtime.marketCounterparts).toHaveLength(81);
    expect(sha256(beforeDairyBlueprints())).toBe(proposal.blueprintHash); expect(sha256(MEAL_PREP_BLUEPRINTS)).toBe(proposal.proposedImplementedBlueprintHash);
    expect(sha256(scopedRecipeUses.slice(0,49))).toBe('d619f0f38cef09ddd632117df8dcb102558c6b67ed61043a77ad56f2c8423cc6');
    expect(approval.approvals[2].recipeUses.previousCoverageApprovalHash).toBe(sha256({ formatVersion: 1, approvals: approval.approvals.slice(0,2) }));
    const altered = structuredClone(approval); altered.approvals[2].recipeUses.slotStructurePatches![0].after[0].quantityRequired = 1; expect(() => compile(altered)).toThrow('stale');
    const changed = structuredClone(MEAL_PREP_BLUEPRINTS); changed.find((b) => b.id === breakfast)!.slots.find((s) => s.slotKey === 'cheddar_top')!.optional = true; expect(() => compileScopedRecipeUses(originalScoped, artifact.ingredients, CANONICAL_INGREDIENTS, changed, approval)).toThrow('split');
  });
  it('retains the exact 199-identity view and gates new writes on accepted IDs without deleting saved unknowns', () => {
    expect(cookingCatalogView(previous.catalogVersion).ingredients).toEqual(previous.ingredients); expect(cookingCatalogView(previous.catalogVersion).compatibility).toEqual(previous.compatibility);
    const saved = entry('greek-yogurt-vanilla'); expect(canSavePantryIngredient(saved, undefined, previous.ingredients.map((i) => i.id))).toBe(false); expect(canSavePantryIngredient(saved, undefined, artifact.ingredients.map((i) => i.id))).toBe(true); expect(canSavePantryIngredient(saved, saved, [])).toBe(true);
  });
  it('keeps plain/vanilla and component Yes/No private through guest restart and lost acknowledgment replay', () => {
    const folder = mkdtempSync(join(tmpdir(), 'dairy-guest-')), database = join(folder, 'private.sqlite');
    const prelude = `const assert=require('node:assert/strict');const s=require(${JSON.stringify(resolve('src/lib/db/sqlite.ts'))});const a='guest:dairy-a',b='guest:dairy-b';`;
    const run = (code: string) => { const r = spawnSync(process.execPath, ['--import','tsx','-e',prelude+code], {encoding:'utf8',env:{...process.env,PANTRYBOT_SQLITE_PATH:database}}); expect(r.status,r.stderr).toBe(0); };
    try { run(`for(const id of ['dairy-a','dairy-b'])s.upsertUserProfileToSqlite({id,email:'',displayName:id,provider:'google',createdAtIso:'2026-11-07',updatedAtIso:'2026-11-07',isCloudBacked:false});s.migratePantryInSqlite(a);s.migratePantryInSqlite(b);const m={mutationId:'plain',entryId:'p',expectedRevision:0,operation:'put',entry:{ingredientId:'greek-yogurt-plain',displayName:'Plain Greek yogurt',available:false}};assert.equal(s.mutatePantryInSqlite(a,m).entry.revision,1);assert.deepEqual(s.mutatePantryInSqlite(a,m),s.mutatePantryInSqlite(a,m));s.mutatePantryInSqlite(a,{...m,mutationId:'vanilla',entryId:'v',entry:{ingredientId:'greek-yogurt-vanilla',displayName:'Vanilla Greek yogurt',available:true,quantity:0}});assert.equal(s.readPantryFromSqlite(b).entries.length,0);`); run(`assert.equal(s.readPantryFromSqlite(a).entries.length,2);assert.equal(s.readPantryFromSqlite(b).entries.length,0);assert(s.readAcceptedPantryCatalogFromSqlite().includes('cottage-cheese-plain'));const m={mutationId:'plain',entryId:'p',expectedRevision:0,operation:'put',entry:{ingredientId:'greek-yogurt-plain',displayName:'Plain Greek yogurt',available:false}};assert.equal(s.mutatePantryInSqlite(a,m).entry.revision,1);`); } finally { rmSync(folder,{recursive:true,force:true}); }
  }, 15000);
});
