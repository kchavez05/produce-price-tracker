import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { strict as assert } from 'node:assert';
import { CatalogDecision } from '../src/types/catalog';
import { PantryEntry } from '../src/types/pantry';
import { MEAL_PREP_BLUEPRINTS } from '../src/data/meal-prep-blueprints';
import { CANONICAL_INGREDIENTS } from '../src/data/canonical-ingredients';
import { availableCookingIngredientIds, cookingCatalogVariants, searchCookingCatalog } from '../src/lib/pantry/catalog-search';
import { curateCatalog, decisionHash, parseArtifact, parseLedger, parseSources, sha256 } from './lib/catalog-curation';
import { compileScopedRecipeUses } from './lib/scoped-recipe-uses';
import { compileMarketCounterparts } from './lib/market-coverage-approvals';

const packagePath = 'catalog/proposals/2026-11-07-market-dairy';
const read = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
const fileHash = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex');
const same = (a: unknown, b: unknown) => assert.equal(sha256(a), sha256(b));
type Row = { id: string; revision: number; status: string; payloadSha256: string; action: string; recipeId: string; slotKey: string; marketIngredientId: string; pantryIngredientIds: string[]; offerFoods: string[] };
type Patch = { id: string; status: string; payloadSha256: string; recipeId: string; field: string; stepIndex?: number; slotKey?: string; before: string; after: string };
function checkHash(row: { status: string; payloadSha256: string }) {
  const { status, payloadSha256, ...payload } = row;
  assert.equal(status, 'proposed'); assert.equal(payloadSha256, sha256(payload));
}
function run() {
  const { values } = parseArgs({ options: { review: { type: 'string' }, check: { type: 'boolean', default: false } } });
  assert(values.review, '--review must identify the retained full USDA source review');
  const envelope = read(`${packagePath}/review-envelope.json`);
  assert.equal(envelope.status, 'PROPOSED_NOT_APPROVED_NOT_ACTIVE');
  for (const [file, hash] of Object.entries(envelope.fileHashes)) assert.equal(sha256(read(`${packagePath}/${file}`)), hash);
  const parent = parseArtifact(read('catalog/releases/2026-11-07.2/catalog.json'));
  const runtime = read('src/data/cooking-catalog.json');
  assert.equal(envelope.parentVersion, parent.catalogVersion); assert.equal(envelope.parentContentHash, parent.contentHash);
  assert.equal(runtime.contentHash, parent.contentHash); same(runtime.ingredients, parent.ingredients); same(runtime.compatibility, parent.compatibility);
  const active = parseLedger(read('catalog/curation-ledger.json'));
  const ledger = parseLedger(read(`${packagePath}/ledger.json`));
  same(ledger.decisions.filter((d) => d.status === 'approved'), active.decisions);
  const pending = ledger.decisions.filter((d) => d.status === 'proposed');
  assert.equal(active.decisions.length, 216); assert.equal(pending.length, 36); assert(pending.every((d) => !d.review));
  same(read(`${packagePath}/decision-hashes.json`), pending.map((d) => ({ id: d.id, revision: d.revision, payloadSha256: decisionHash(d) })));
  const sourcePath = `${values.review}/source-records.json`, sources = parseSources(read(sourcePath));
  assert.equal(fileHash(sourcePath), envelope.sourceSnapshotFileSha256); assert.equal(sources.releaseDate, envelope.sourceRelease);
  const evidence = parseSources(read(`${packagePath}/source-evidence.json`));
  assert.equal(evidence.records.length, 15);
  same(evidence.records.map((r) => r.key).sort(), [...new Set(pending.flatMap((d) => d.sourceRefs.map((r) => r.key)))].sort());
  for (const r of evidence.records) { assert.equal(r.disposition, 'candidate'); same(r, sources.records.find((s) => s.key === r.key)); assert(!parent.sourceLinks.some((s) => s.key === r.key)); }
  const gaps = read(`${packagePath}/curated-gaps.json`) as { ingredientId: string; rationale: string; hintPurpose: string; candidateHints: unknown[] }[];
  assert.equal(gaps.length, 8);
  same(gaps.map((r) => r.ingredientId).sort(), pending.filter((d) => d.ingredient && d.sourceKind === 'CURATED').map((d) => d.ingredient!.id).sort());
  for (const gap of gaps) { assert.equal(gap.rationale, pending.find((d) => d.ingredient?.id === gap.ingredientId)!.rationale); assert.equal(gap.hintPurpose, 'INVESTIGATION_ONLY_NOT_A_SOURCE_ASSIGNMENT'); for (const hint of gap.candidateHints) { const r = parseSources({ formatVersion: 1, rulesVersion: sources.rulesVersion, records: [hint] }).records[0]; assert.equal(r.disposition, 'candidate'); same(r, sources.records.find((s) => s.key === r.key)); } }
  const preview = curateCatalog({ ledger, sources, previous: parent, version: '2026-11-07.dairy-proposal', asOfDate: '2026-11-07' });
  same(preview.artifact.ingredients, parent.ingredients); same(preview.artifact.compatibility, parent.compatibility); same(preview.artifact.sourceLinks, parent.sourceLinks); same(preview.artifact.decisions, parent.decisions);
  assert.equal(preview.preview.ingredients.length, 222);
  for (const i of parent.ingredients) same(preview.preview.ingredients.find((r) => r.id === i.id), i);
  const additions = pending.flatMap((d) => d.ingredient ? [d.ingredient] : []);
  assert.equal(additions.length, 23); assert(additions.every((i) => !parent.ingredients.some((p) => p.id === i.id) && !i.staticPrice && !i.recipeIngredientId));
  const edges = pending.flatMap((d) => d.compatibility ? [d.compatibility] : []); assert.equal(edges.length, 13);
  for (const edge of edges) { const from = additions.find((i) => i.id === edge.from)!, to = additions.find((i) => i.id === edge.to)!; assert.equal(from.parentIngredientId, to.id); assert.equal(from.form, to.form); assert.equal(from.familyId, to.familyId); }
  // Validate proposed approval only in memory. Persist no simulated approval/artifact.
  const simulated: CatalogDecision[] = ledger.decisions.map((d) => d.status === 'approved' ? d : ({ ...d, status: 'approved', review: { by: 'VALIDATION SIMULATION ONLY — NOT MAINTAINER APPROVAL', date: '2026-11-07', payloadSha256: decisionHash(d) } }));
  const options = { ledger: { formatVersion: 1 as const, decisions: simulated }, sources, previous: parent, version: '2026-11-07.dairy-validation-only', asOfDate: '2026-11-07' };
  const simulation = curateCatalog(options); assert(simulation.report.publishable); same(simulation, curateCatalog(options)); same(simulation.artifact.ingredients, preview.preview.ingredients);
  const fixtures = read(`${packagePath}/search-fixtures.json`) as { query: string; expected: string[] }[]; assert.equal(fixtures.length, 457);
  for (const f of fixtures) same(searchCookingCatalog(preview.preview.ingredients, f.query).map((r) => r.id).sort(), [...f.expected].sort());
  for (const i of preview.preview.ingredients) { for (const q of [i.name, ...i.aliases]) assert(searchCookingCatalog(preview.preview.ingredients, q).some((r) => r.id === i.id), `${i.id}: ${q}`); if (i.parentIngredientId) assert(cookingCatalogVariants(preview.preview.ingredients, i.parentIngredientId).some((r) => r.id === i.id)); }
  const broad = { cheese: 9, mozzarella: 3, 'Greek yogurt': 2, yogurt: 3, milk: 3, cream: 2, 'cottage cheese': 1, 'sour cream': 1, vanilla: 0 };
  for (const [q, count] of Object.entries(broad)) assert.equal(searchCookingCatalog(preview.preview.ingredients, q, 1000).length, count);
  assert(!searchCookingCatalog(preview.preview.ingredients, 'milk', 1000).some((i) => i.familyId === 'greek-yogurt'));
  const behavior = read(`${packagePath}/behavior-cases.json`); assert.equal(behavior.offerCases.length, 57); assert.equal(behavior.availabilityCases.length, 16);
  for (const r of behavior.availabilityCases as { positives: string[]; negatives: string[]; requiredIds: string[]; expectedCovered: number }[]) { const entries: PantryEntry[] = [...r.positives.map((ingredientId) => ({ id: `yes:${ingredientId}`, ingredientId, displayName: ingredientId, available: true, revision: 1, updatedAtIso: '' })), ...r.negatives.map((ingredientId) => ({ id: `no:${ingredientId}`, ingredientId, displayName: ingredientId, available: false, revision: 1, updatedAtIso: '' }))]; const available = availableCookingIngredientIds(entries, preview.preview.ingredients, simulation.artifact.compatibility); assert.equal(r.requiredIds.filter((id) => available.includes(id)).length, r.expectedCovered); }
  const currentApproval = read('catalog/market-coverage-approvals.json'), original = read('catalog/scoped-recipe-uses.json');
  const compiled = compileScopedRecipeUses(original, parent.ingredients, CANONICAL_INGREDIENTS, MEAL_PREP_BLUEPRINTS, currentApproval);
  same(compiled.uses, runtime.scopedRecipeUses); same(compiled.contexts, runtime.scopedRecipeContexts); same(compiled.protectedMarketIds, runtime.protectedRecipeMarketIds); same(compileMarketCounterparts(currentApproval, parent.ingredients, CANONICAL_INGREDIENTS), runtime.marketCounterparts);
  const market = read(`${packagePath}/market-counterparts.json`), recipe = read(`${packagePath}/recipe-use-proposal.json`);
  assert.equal(envelope.blueprintHash, sha256(MEAL_PREP_BLUEPRINTS)); assert.equal(envelope.marketHash, sha256(CANONICAL_INGREDIENTS)); assert.equal(recipe.blueprintHash, envelope.blueprintHash); assert.equal(recipe.marketHash, envelope.marketHash); assert.equal(market.marketHash, envelope.marketHash); assert.equal(market.baseCatalogHash, parent.contentHash);
  assert.equal(recipe.previousCoverageApprovalHash, sha256(currentApproval)); assert.equal(envelope.previousCoverageApprovalHash, sha256(currentApproval)); assert.equal(recipe.previousScopedApprovalHash, sha256(original)); same(recipe.protectedMarketIngredientIds, market.protectedMarketIngredientIds);
  const groups: string[] = recipe.protectedMarketIngredientIds;
  same([...groups].sort(), ['shredded-block-cheese', 'cottage-cheese-sour-cream', 'greek-yogurt-tub'].sort());
  assert.equal(market.decisions.length, 23); assert.equal(new Set(market.decisions.map((r: { id: string }) => r.id)).size, 23);
  for (const row of market.decisions) { checkHash(row); assert.equal(row.revision, 1); assert.equal(row.id, `counterpart:${row.marketIngredientId}:${row.pantryIngredientId}`); assert(groups.includes(row.marketIngredientId)); assert.equal(additions.find((i) => i.id === row.pantryIngredientId)?.name, row.foodName); }
  same(market.decisions.map((r: { pantryIngredientId: string }) => r.pantryIngredientId).sort(), additions.map((i) => i.id).sort());
  const rows: Row[] = recipe.decisions; assert.equal(rows.length, 16); assert.equal(new Set(rows.map((r) => r.id)).size, 16);
  const beforeSlots = MEAL_PREP_BLUEPRINTS.flatMap((b) => b.slots.flatMap((s) => [...new Set([...s.candidateIngredientIds, ...s.lowCarbCandidateIds ?? []])].filter((id) => groups.includes(id)).map((id) => `${b.id}:${s.slotKey}:${id}`)));
  same(rows.map((r) => r.id).sort(), [...beforeSlots, 'high-protein-sausage-egg-sweet-potato-breakfast-casserole:cheddar_top:shredded-block-cheese'].sort());
  for (const row of rows) { checkHash(row); assert.equal(row.revision, 1); assert.equal(row.id, `${row.recipeId}:${row.slotKey}:${row.marketIngredientId}`); assert.equal(new Set(row.pantryIngredientIds).size, row.pantryIngredientIds.length); if (row.action === 'reject') { same(row.pantryIngredientIds, []); same(row.offerFoods, []); } else { assert.equal(row.action, 'allow'); assert(row.pantryIngredientIds.length); same(row.offerFoods, row.pantryIngredientIds); for (const id of row.pantryIngredientIds) assert(market.decisions.some((r: { marketIngredientId: string; pantryIngredientId: string }) => r.marketIngredientId === row.marketIngredientId && r.pantryIngredientId === id)); } }
  assert.equal(rows.filter((r) => r.action === 'allow').length, 14); assert.equal(rows.filter((r) => r.action === 'reject').length, 2);
  same(behavior.rejectedScopeContexts.map((r: { recipeId: string; slotKey: string; marketIngredientId: string }) => `${r.recipeId}:${r.slotKey}:${r.marketIngredientId}`).sort(), rows.filter((r) => r.action === 'reject').map((r) => r.id).sort());
  for (const r of behavior.offerCases) { assert(groups.includes(r.marketIngredientId)); assert.equal(new Set(r.expectedCounterpartIds).size, r.expectedCounterpartIds.length); for (const id of r.expectedCounterpartIds) assert(market.decisions.some((c: { marketIngredientId: string; pantryIngredientId: string }) => c.marketIngredientId === r.marketIngredientId && c.pantryIngredientId === id)); for (const id of r.allowedRecipeFoodIds) assert(r.expectedCounterpartIds.includes(id) && rows.some((s) => s.action === 'allow' && s.pantryIngredientIds.includes(id))); }
  const transformed = structuredClone(MEAL_PREP_BLUEPRINTS);
  assert.equal(recipe.candidateRemovals.length, 1);
  for (const removal of recipe.candidateRemovals) { const row = rows.find((r) => r.id === removal.id)!; assert.equal(row.action, 'reject'); const s = transformed.find((b) => b.id === row.recipeId)!.slots.find((s) => s.slotKey === row.slotKey)!; same(removal.before, { candidateIngredientIds: s.candidateIngredientIds, lowCarbCandidateIds: s.lowCarbCandidateIds ?? [] }); s.candidateIngredientIds = s.candidateIngredientIds.filter((id) => id !== row.marketIngredientId); same(removal.after, { candidateIngredientIds: s.candidateIngredientIds, lowCarbCandidateIds: s.lowCarbCandidateIds ?? [] }); }
  assert.equal(recipe.slotStructurePatches.length, 1);
  const split = recipe.slotStructurePatches[0]; checkHash(split); assert.equal(split.action, 'split-required-slot');
  const breakfast = transformed.find((b) => b.id === split.recipeId)!; assert.equal(breakfast.id, 'high-protein-sausage-egg-sweet-potato-breakfast-casserole');
  const index = breakfast.slots.findIndex((s) => s.slotKey === 'dairy_protein'); same(breakfast.slots[index], split.before); assert.equal(split.after.length, 2); assert.equal(split.after.reduce((n: number, s: { quantityRequired: number }) => n + s.quantityRequired, 0), split.before.quantityRequired);
  same(split.after.map((s: { slotKey: string; candidateIngredientIds: string[]; quantityRequired: number; optional?: boolean }) => ({ key: s.slotKey, ids: s.candidateIngredientIds, quantity: s.quantityRequired, optional: Boolean(s.optional) })), [{ key: 'dairy_protein', ids: ['cottage-cheese-sour-cream'], quantity: 0.5, optional: false }, { key: 'cheddar_top', ids: ['shredded-block-cheese'], quantity: 0.5, optional: false }]);
  breakfast.slots.splice(index, 1, ...split.after);
  const patches: Patch[] = recipe.instructionTitleAndLabelPatches; assert.equal(patches.length, 13); assert.equal(new Set(patches.map((p) => p.id)).size, patches.length);
  for (const p of patches) { checkHash(p); const b = transformed.find((b) => b.id === p.recipeId)!; if (p.field === 'steps') { assert(Number.isInteger(p.stepIndex)); assert.equal(b.steps[p.stepIndex!], p.before); b.steps[p.stepIndex!] = p.after; } else { assert.equal(p.field, 'slotLabel'); const s = b.slots.find((s) => s.slotKey === p.slotKey)!; assert.equal(s.label, p.before); s.label = p.after; } }
  assert.equal(sha256(transformed), recipe.proposedImplementedBlueprintHash);
  for (const row of rows) { const b = transformed.find((b) => b.id === row.recipeId)!, s = b.slots.find((s) => s.slotKey === row.slotKey)!; assert(s); assert.equal([...s.candidateIngredientIds, ...s.lowCarbCandidateIds ?? []].includes(row.marketIngredientId), row.action === 'allow'); }
  // Reverse only the declared transformations to prove no hidden recipe edits.
  const reversed = structuredClone(transformed);
  for (const p of [...patches].reverse()) { const b = reversed.find((b) => b.id === p.recipeId)!; if (p.field === 'steps') b.steps[p.stepIndex!] = p.before; else b.slots.find((s) => s.slotKey === p.slotKey)!.label = p.before; }
  reversed.find((b) => b.id === split.recipeId)!.slots.splice(index, 2, split.before);
  for (const removal of recipe.candidateRemovals) { const row = rows.find((r) => r.id === removal.id)!; const s = reversed.find((b) => b.id === row.recipeId)!.slots.find((s) => s.slotKey === row.slotKey)!; s.candidateIngredientIds = removal.before.candidateIngredientIds; }
  same(reversed, MEAL_PREP_BLUEPRINTS);
  const preparation = read(`${packagePath}/preparation-evidence.json`); assert.equal(preparation.sources.length, 4);
  const report = { status: 'PROPOSAL_VALIDATED_NOT_APPROVED_NOT_ACTIVE', preparedOn: '2026-11-07', parentVersion: parent.catalogVersion, parentContentHash: parent.contentHash, packageHash: sha256(envelope), validatorFileSha256: fileHash('scripts/validate-market-dairy-proposal.ts'), counts: envelope.counts,
    checks: { activeCatalogAnd216PriorDecisionsUnchanged: true, exact36ProposedHashesNoApprovalClaims: true, fullSnapshot15SelectedSourcesAndEightCuratedGapsVerified: true, noHeldSourceAssigned: true, deterministicInMemoryApprovalSimulationOnly: true, all199PriorIngredientsPricesAndGlobalLinksPreserved: true, all457PreviewSearchFixturesPass: true, allNamesAliasesAndOptionalChoicesReachable: true, yogurtQualifiedDiscovery: true, unboundedBroadQueryCounts: broad, all13EdgesSameFormSpecificToGeneric: true, sixteenAvailabilityCasesPass: true, breakfastFourConjunctionCasesPass: true, current58Counterparts49ScopedUsesAnd17ProtectedGroupsUnchanged: true, all23CounterpartAnd16ScopePayloadsBound: true, ordinaryRemovalAndRequiredSlotSplitReplayExactly: true, thirteenTextPatchesReplayExactly: true, inverseReplayRestoresEveryBlueprintField: true, breakfastCombinedQuantityExplicitlyReallocated: true, proposedMarketGroupsCovered: new Set([...parent.ingredients.flatMap((i) => i.recipeIngredientId ? [i.recipeIngredientId] : []), ...[...runtime.recipeLinks, ...runtime.scopedRecipeUses, ...runtime.marketCounterparts, ...market.decisions].map((r: { marketIngredientId: string }) => r.marketIngredientId)]).size },
    offerCases: { count: 57, implementation: 'PENDING: hashed review expectations only, not executed dairy offer admission or recipe runtime' },
    pendingGates: ['Maintainer approval of the exact ingredient/source/alias/edge, counterpart, recipe/quantity/slot split, text and offer choices', 'Append-only dairy compiler and runtime admission support; execute all offer, saved-recipe, cost, shopping, store-pool and two-required-slot cases', 'Additive 23-ID accepted registry migration, private-account restart/retry and rollback/readiness verification before hosted rollout', 'Four prior qualification findings, pending non-market scope decisions, final release audit and v1.6.1 release workflow'] };
  assert.equal(report.checks.proposedMarketGroupsCovered, 35);
  if (values.check) same(read(`${packagePath}/validation.json`), report); else writeFileSync(`${packagePath}/validation.json`, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ status: report.status, counts: report.counts, currentCatalogChanged: false, published: false }));
}
run();
