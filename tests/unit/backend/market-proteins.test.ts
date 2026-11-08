import activeArtifact from '../../../catalog/releases/2026-11-07.4/catalog.json';
import { beforeDairyBlueprints } from '../../helpers/dairy-blueprints';
import { describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import cases from '../../../catalog/proposals/2026-11-07-market-proteins/behavior-cases.json';
import proposal from '../../../catalog/proposals/2026-11-07-market-proteins/recipe-use-proposal.json';
import hashes from '../../../catalog/proposals/2026-11-07-market-proteins/decision-hashes.json';
import evidence from '../../../catalog/proposals/2026-11-07-market-proteins/source-evidence.json';
import ledgerData from '../../../catalog/curation-ledger.json';
import previous from '../../../catalog/releases/2026-11-07.1/catalog.json';
import artifactData from '../../../catalog/releases/2026-11-07.2/catalog.json';
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
import { isProtectedMarketIngredient, recipeOfferAllowed, recipeUseForSlot, scopedRecipeCommodity } from '@/lib/pantry/recipe-use';
import { recipeAvailableIngredientIds, recipeUseRequirementId, scopedRecipeUses } from '@/lib/pantry/recipe-identity';
import { applyPantryToRecipe } from '@/lib/pantry/recipe';
import { buildShoppingListAndStoreComparison } from '@/lib/shopping-list';
import { cleanSearchQueryForIngredient } from '@/lib/cart-exporter';
import { scoreAllCommodities } from '@/lib/scoring-and-matcher';
import { createMockCommodity, createMockDish, createMockOffer } from 'tests/test-utils';
const artifact = parseArtifact(artifactData);
const entry = (ingredientId: string, available = true): PantryEntry => ({ id: `${available}:${ingredientId}`, ingredientId, displayName: ingredientId, available, revision: 1, updatedAtIso: '', quantity: 0, useByDate: '2000-01-01' });
const positive = (ingredientId: string) => availablePantryIngredientIds([entry(ingredientId)]);
function slot(use: ScopedRecipeUse): MatchedSlotIngredient { return { slotLabel: use.slotLabel, ingredientId: use.marketIngredientId, ingredientName: use.marketIngredientName, quantityUsed: 2, unit: 'lb', store: 'KING_SOOPERS', rawDealText: 'old estimate', dealType: 'SHELF_OR_MEMBER', unitCost: 99, slotCost: 198, regularSlotCost: 198, isUserPinned: false }; }
function dish(use: ScopedRecipeUse): RecommendedDish { const b = MEAL_PREP_BLUEPRINTS.find((b) => b.id === use.recipeId)!; return createMockDish({ id: b.id, title: b.title, steps: [...b.steps], matchedIngredients: [slot(use)], pantryStaples: [], pantryRequirements: [], estimatedPantryCost: 0 }); }
function market(use: ScopedRecipeUse, offers: [string, number, StoreChain][], pool: StoreChain[] = ['KING_SOOPERS']) { const recipeOffers = offers.map(([rawTitle, normalizedPricePerUnit, store]) => createMockOffer({ canonicalIngredientId: use.marketIngredientId, rawTitle, normalizedPricePerUnit, regularPricePerUnit: normalizedPricePerUnit + 1, store })); return createMockCommodity({ ingredient: CANONICAL_INGREDIENTS.find((r) => r.id === use.marketIngredientId)!, bestOffer: recipeOffers[0], recipeOffers, recipeStorePool: pool, storeOffers: { [recipeOffers[0].store]: recipeOffers[0] } }); }
const accepted = proposal.decisions.filter((r) => r.action === 'allow').flatMap((row) => row.pantryIngredientIds.map((pantryId) => ({ row, pantryId })));

describe('approved protein market integration', () => {
  it('binds every approval and preserves all prior identities, fields, links and fixed estimates', () => {
    const ledger = parseLedger(ledgerData);
    expect(artifact.ingredients).toHaveLength(199); expect(artifact.decisions).toHaveLength(216); expect(hashes).toHaveLength(31);
    expect(artifact.decisions).toEqual(expect.arrayContaining(previous.decisions));
    for (const before of previous.ingredients) expect(artifact.ingredients.find((r) => r.id === before.id)).toEqual(before);
    for (const h of hashes) { const d = ledger.decisions.find((r) => r.id === h.id && r.revision === h.revision)!; expect(d.status).toBe('approved'); expect(decisionHash(d)).toBe(h.payloadSha256); expect(d.review).toMatchObject({ date: '2026-11-07', payloadSha256: h.payloadSha256 }); }
    const added = artifact.ingredients.filter((r) => !previous.ingredients.some((p) => p.id === r.id));
    expect(added).toHaveLength(28); expect(added.every((r) => !r.staticPrice && !r.recipeIngredientId)).toBe(true);
    expect(artifact.compatibility).toHaveLength(previous.compatibility.length + 3);
    expect(artifact.sourceLinks.filter((r) => r.purpose === 'identity')).toHaveLength(163); expect(artifact.sourceLinks.filter((r) => r.purpose === 'general-reference')).toHaveLength(5);
    expect(new Set(artifact.sourceLinks.map((r) => r.ingredientId)).size).toBe(160);
    const old = new Set(previous.sourceLinks.map((r) => `${r.ingredientId}:${r.key}`)); const selected = parseSources(evidence);
    for (const link of artifact.sourceLinks.filter((r) => !old.has(`${r.ingredientId}:${r.key}`))) expect(selected.records.find((r) => r.key === link.key)).toMatchObject({ fingerprint: link.fingerprint, disposition: 'candidate' });
  });
  it.each(cases.availabilityCases)('preserves exact state/cut and directional coverage: $positives / No $negatives → $requiredId', (r) => { const ids = availablePantryIngredientIds([...r.positives.map((id) => entry(id)), ...r.negatives.map((id) => entry(id, false))]); expect(ids.includes(r.requiredId)).toBe(r.expected); });
  it.each(cases.offerCases)('qualifies "$title" without creating inventory ownership', (r) => {
    expect(marketCounterpartIds(r.marketIngredientId, r.title)).toEqual([...r.counterpartIds].sort());
    const use = r.recipeFood ? scopedRecipeUses.find((u) => u.marketIngredientId === r.marketIngredientId && u.offerFoods.includes(r.recipeFood!)) : undefined;
    if (r.recipeFood) expect(use).toBeDefined();
    expect(use ? recipeOfferAllowed(use, r.title) : false).toBe(r.admit);
  });
  it.each(accepted)('uses approved $pantryId in $row.id with exact No and repricing', ({ row, pantryId }) => {
    const use = scopedRecipeUses.find((r) => r.id === row.id)!;
    const example = cases.offerCases.find((r) => r.marketIngredientId === row.marketIngredientId && r.admit && r.counterpartIds.includes(pantryId))!;
    expect(example).toBeDefined();
    const quote = market(use, [[example.title, 2, 'KING_SOOPERS']]), input = dish(use), before = JSON.stringify(input);
    const owned = applyPantryToRecipe(input, positive(pantryId), [quote]);
    expect(owned.pantryCoverage).toMatchObject({ requiredCount: 1, availableRequiredCount: 1 }); expect(owned.totalBatchCost).toBe(0);
    expect(buildShoppingListAndStoreComparison([owned], [quote], positive(pantryId), '80542', ['KING_SOOPERS'], true).items).toHaveLength(0);
    const priced = applyPantryToRecipe(input, [], [quote]); expect(priced.totalBatchCost).toBe(4);
    const no = availablePantryIngredientIds([entry(pantryId), entry(pantryId, false)]); expect(applyPantryToRecipe(input, no, [quote]).totalBatchCost).toBe(4);
    const unknown = applyPantryToRecipe(input, [], []); expect(unknown.additionalCostEstimateComplete).toBe(false); expect(applyPantryToRecipe(unknown, [], [quote]).totalBatchCost).toBe(4);
    expect(JSON.stringify(input)).toBe(before);
  });
  it.each(cases.rejectedScopeContexts)('keeps removed grouped candidate $marketIngredientId blocked in $recipeId', (r) => {
    const b = MEAL_PREP_BLUEPRINTS.find((b) => b.id === r.recipeId)!, s = b.slots.find((s) => s.slotKey === r.slotKey)!;
    expect([...s.candidateIngredientIds, ...s.lowCarbCandidateIds ?? []]).not.toContain(r.marketIngredientId); expect(isProtectedMarketIngredient(r.marketIngredientId)).toBe(true);
    expect(recipeUseForSlot(r.recipeId, s.label, r.marketIngredientId)).toBeUndefined();
    const example = cases.offerCases.find((c) => c.marketIngredientId === r.marketIngredientId && c.counterpartIds.length)!;
    const fake: ScopedRecipeUse = { id: `${r.recipeId}:${r.slotKey}:${r.marketIngredientId}`, recipeId: r.recipeId, slotKey: r.slotKey, slotLabel: s.label, marketIngredientId: r.marketIngredientId, marketIngredientName: CANONICAL_INGREDIENTS.find((c) => c.id === r.marketIngredientId)!.name, displayName: s.label, pantryIngredientIds: example.counterpartIds, offerFoods: [] };
    const input = dish(fake), quote = market(fake, [[example.title, 2, 'KING_SOOPERS']]);
    for (const value of [input, { ...input, title: 'Old/custom recipe' }, { ...input, steps: ['Old or edited directions'] }, { ...input, aiGenerated: true }]) { const result = applyPantryToRecipe(value, example.counterpartIds, [quote]); expect(result.pantryCoverage!.availableRequiredCount).toBe(0); expect(result.additionalCostEstimateComplete).toBe(false); expect(result.matchedIngredients).toHaveLength(0); }
  });
  it('removes auxiliary ground-beef braise candidates without broadening mixed-group protection', () => {
    for (const row of proposal.auxiliaryCandidateDecisions) expect(MEAL_PREP_BLUEPRINTS.find((r) => r.id === row.recipeId)!.slots.find((r) => r.slotKey === row.slotKey)!.candidateIngredientIds).not.toContain(row.marketIngredientId);
    expect(isProtectedMarketIngredient('ground-beef-80-20')).toBe(false);
    expect(MEAL_PREP_BLUEPRINTS.find((r) => r.id === 'southwest-sweet-potato-ground-beef-chili-bake')!.slots.find((r) => r.slotKey === 'primary_protein')!.candidateIngredientIds).toContain('ground-beef-80-20');
    expect(recipeAvailableIngredientIds(['ground-beef-80-20'])).toContain('ground-beef-80-20');
  });
  it('enforces generic salmon No in actual recipe coverage and preserves independent sausage alternatives', () => {
    const use = scopedRecipeUses.find((r) => r.marketIngredientId === 'salmon-fillets')!;
    const ids = availablePantryIngredientIds([entry('coho-salmon-fillets-raw'), entry('salmon-fillets-raw', false)]);
    expect(recipeAvailableIngredientIds(ids)).not.toContain(recipeUseRequirementId(use));
    expect(recipeAvailableIngredientIds(positive('coho-salmon-fillets-raw'))).toContain(recipeUseRequirementId(use));
    expect(recipeAvailableIngredientIds(['salmon-fillets', recipeUseRequirementId(use)])).not.toContain(recipeUseRequirementId(use));
    const sausage = scopedRecipeUses.find((r) => r.marketIngredientId === 'smoked-sausage-kielbasa')!;
    expect(recipeAvailableIngredientIds(availablePantryIngredientIds([entry('kielbasa-raw'), entry('kielbasa-fully-cooked', false)]))).not.toContain(recipeUseRequirementId(sausage));
    expect(recipeAvailableIngredientIds(availablePantryIngredientIds([entry('andouille-fully-cooked'), entry('kielbasa-fully-cooked', false)]))).toContain(recipeUseRequirementId(sausage));
    expect(availablePantryIngredientIds([{ ...entry('salmon-fillets-raw'), ingredientId: undefined }])).toEqual([]);
  });
  it.each<StoreChain>(['KING_SOOPERS', 'SAFEWAY', 'ALDI', 'WALMART', 'TARGET', 'SPROUTS'])('recovers a qualifying original offer before per-store selection at %s', (store) => {
    const use = scopedRecipeUses.find((r) => r.marketIngredientId === 'italian-pork-sausage')!;
    const quote = market(use, [['Fully cooked Italian pork sausage', 1, store], ['Raw Italian pork sausage', 2, store]], [store]);
    expect(scopedRecipeCommodity(use, quote)!.bestOffer.rawTitle).toBe('Raw Italian pork sausage');
    const scored = scoreAllCommodities(quote.recipeOffers!, store, {}, [store], {}); expect(scored[0].recipeOffers).toHaveLength(2);
    const result = applyPantryToRecipe(dish(use), [], scored); expect(result.totalBatchCost).toBe(4);
    const shopping = buildShoppingListAndStoreComparison([result], scored, [], '80542', [store], true); expect(shopping.items[0].storePricing?.[store]?.ingredientName).toBe('Raw Italian pork sausage');
    expect(cleanSearchQueryForIngredient('Raw Italian pork sausage')).toContain('sausage');
  });
  it('keeps selected stores, prepared products, contradictory labels and brand words from manufacturing a quote', () => {
    const use = scopedRecipeUses.find((r) => r.marketIngredientId === 'salmon-fillets')!;
    const quote = market(use, [['Smoked salmon fillets', 1, 'KING_SOOPERS'], ['Raw Atlantic salmon fillets', 2, 'SAFEWAY']]); expect(scopedRecipeCommodity(use, quote)).toBeUndefined(); expect(scopedRecipeCommodity(use, { ...quote, recipeStorePool: ['SAFEWAY'] })!.bestOffer.store).toBe('SAFEWAY');
    for (const title of ['Raw fully cooked salmon fillets', 'Marinated raw Atlantic salmon fillets', 'Raw salmon fillet dinner kit', 'Raw salmon fillets with asparagus', 'Raw salmon fillets + asparagus', 'Raw Farms salmon fillets', 'Raw whole salmon fillets', 'Raw Atlantic coho salmon fillets']) expect(recipeOfferAllowed(use, title)).toBe(false);
    for (const title of ['Not fully cooked kielbasa', 'Partially cooked ready-to-eat kielbasa', 'Fully Cooked Farms smoked sausage', 'Raw and fully cooked smoked sausage', 'Eckrich', 'Fully cooked kielbasa and andouille sausage']) expect(marketCounterpartIds('smoked-sausage-kielbasa', title)).toEqual([]);
    expect(marketCounterpartIds('salmon-fillets', 'Raw salmon fillets with skin')).toEqual(['salmon-fillets-raw']);
    expect(marketCounterpartIds('beef-chuck-roast', 'Raw boneless beef chuck roast with bones')).toEqual([]);
    expect(marketCounterpartIds('italian-pork-sausage', 'Seasoned raw Italian pork sausage')).toEqual(['italian-pork-sausage-raw']);
    expect(marketCounterpartIds('italian-pork-sausage', 'Raw Italian pork sausage seasoning')).toEqual([]);
    expect(marketCounterpartIds('italian-pork-sausage', 'Raw pork and beef sausage')).toEqual([]);
    expect(marketCounterpartIds('smoked-sausage-kielbasa', 'Fully cooked pork and beef smoked sausage')).toEqual(['smoked-sausage-fully-cooked']);
    expect(cleanSearchQueryForIngredient('Raw Atlantic or sockeye salmon fillets')).toBe('Atlantic salmon fillets');
    expect(cleanSearchQueryForIngredient('Raw New York strip or top sirloin steak')).toBe('New York strip steak');
  });
  it('binds 63 current scopes, 85 counterparts and all 20 protected mixed groups to the append-only approvals', () => {
    const compile = (raw: unknown = approval) => compileScopedRecipeUses(originalScoped, parseArtifact(activeArtifact).ingredients, CANONICAL_INGREDIENTS, MEAL_PREP_BLUEPRINTS, raw);
    expect(compile().uses).toEqual(scopedRecipeUses); expect(scopedRecipeUses).toHaveLength(63); expect(compile().protectedMarketIds).toEqual(runtime.protectedRecipeMarketIds); expect(runtime.protectedRecipeMarketIds).toHaveLength(20);
    expect(compileMarketCounterparts(approval, parseArtifact(activeArtifact).ingredients, CANONICAL_INGREDIENTS)).toEqual(runtime.marketCounterparts); expect(runtime.marketCounterparts).toHaveLength(85);
    const altered = structuredClone(approval); altered.approvals[1].recipeUses.decisions[0].pantryIngredientIds = ['salmon-fillets-raw']; expect(() => compile(altered)).toThrow('stale');
    const firstChanged = structuredClone(approval); firstChanged.approvals[0].review.by = 'Different reviewer'; expect(() => compile(firstChanged)).toThrow('chain');
    expect(approval.approvals[1].recipeUses.previousCoverageApprovalHash).toBe(sha256({ formatVersion: 1, approvals: approval.approvals.slice(0, 1) }));
  });
  it('replays exactly 19 text edits and eight removals without changing quantities, macro fields or prior produce choices', () => {
    expect(sha256(beforeDairyBlueprints())).toBe(proposal.proposedImplementedBlueprintHash);
    const before = beforeDairyBlueprints();
    for (const patch of [...proposal.instructionTitleAndLabelPatches].reverse()) { const b = before.find((r) => r.id === patch.recipeId)!; if (patch.field === 'title') { expect(b.title).toBe(patch.after); b.title = patch.before; } else if (patch.field === 'steps') { expect(b.steps[patch.stepIndex!]).toBe(patch.after); b.steps[patch.stepIndex!] = patch.before; } else { const s = b.slots.find((r) => r.slotKey === patch.slotKey)!; expect(s.label).toBe(patch.after); s.label = patch.before; } }
    for (const removal of [...proposal.candidateRemovals].reverse()) { const r = [...proposal.decisions, ...proposal.auxiliaryCandidateDecisions].find((r) => r.id === removal.id)!; const s = before.find((b) => b.id === r.recipeId)!.slots.find((s) => s.slotKey === r.slotKey)!; expect(s.candidateIngredientIds).toEqual(removal.after.candidateIngredientIds); s.candidateIngredientIds = removal.before.candidateIngredientIds; if (s.lowCarbCandidateIds) s.lowCarbCandidateIds = removal.before.lowCarbCandidateIds; }
    expect(sha256(before)).toBe(proposal.blueprintHash);
    expect(MEAL_PREP_BLUEPRINTS.find((r) => r.id === 'sheet-pan-salmon-asparagus-brussels-potato-roast')!.steps[2]).toContain('145°F');
  });
  it('retains the exact 171-identity view and requires account installation before new references', () => {
    expect(cookingCatalogView(previous.catalogVersion).ingredients).toEqual(previous.ingredients); expect(cookingCatalogView(previous.catalogVersion).compatibility).toEqual(previous.compatibility);
    const saved = entry('salmon-fillets-raw'); expect(canSavePantryIngredient(saved, undefined, previous.ingredients.map((r) => r.id))).toBe(false); expect(canSavePantryIngredient(saved, undefined, artifact.ingredients.map((r) => r.id))).toBe(true); expect(canSavePantryIngredient(saved, saved, [])).toBe(true);
  });
  it('persists raw/cooked choices privately for two guest sessions and replays lost acknowledgments after restart', () => {
    const folder = mkdtempSync(join(tmpdir(), 'protein-guest-'));
    const database = join(folder, 'private.sqlite');
    const prelude = `const assert=require('node:assert/strict');const s=require(${JSON.stringify(resolve('src/lib/db/sqlite.ts'))});const a='guest:protein-a',b='guest:protein-b';`;
    const run = (code: string) => { const result = spawnSync(process.execPath, ['--import', 'tsx', '-e', prelude + code], { encoding: 'utf8', env: { ...process.env, PANTRYBOT_SQLITE_PATH: database } }); expect(result.status, result.stderr).toBe(0); };
    try {
      run(`for(const id of ['protein-a','protein-b'])s.upsertUserProfileToSqlite({id,email:'',displayName:id,provider:'google',createdAtIso:'2026-11-07',updatedAtIso:'2026-11-07',isCloudBacked:false});s.migratePantryInSqlite(a);s.migratePantryInSqlite(b);const m={mutationId:'one',entryId:'k',expectedRevision:0,operation:'put',entry:{ingredientId:'kielbasa-raw',displayName:'Raw kielbasa',available:false}};assert.equal(s.mutatePantryInSqlite(a,m).entry.revision,1);assert.deepEqual(s.mutatePantryInSqlite(a,m),s.mutatePantryInSqlite(a,m));assert.equal(s.readPantryFromSqlite(b).entries.length,0);s.mutatePantryInSqlite(a,{...m,mutationId:'cooked',entryId:'c',entry:{ingredientId:'kielbasa-fully-cooked',displayName:'Fully cooked kielbasa',available:true,quantity:0}});`);
      run(`assert.equal(s.readPantryFromSqlite(a).entries.length,2);assert.equal(s.readPantryFromSqlite(b).entries.length,0);assert(s.readAcceptedPantryCatalogFromSqlite().includes('salmon-fillets-raw'));const m={mutationId:'one',entryId:'k',expectedRevision:0,operation:'put',entry:{ingredientId:'kielbasa-raw',displayName:'Raw kielbasa',available:false}};assert.equal(s.mutatePantryInSqlite(a,m).entry.revision,1);`);
    } finally { rmSync(folder, { recursive: true, force: true }); }
  }, 15000);
});
