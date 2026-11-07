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
const packagePath = 'catalog/proposals/2026-11-07-market-proteins';
const read = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
const fileHash = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex');
const same = (a: unknown, b: unknown) => assert.equal(sha256(a), sha256(b));
type Slot = { id: string; status: string; payloadSha256: string; revision: number; action: string; recipeId: string; slotKey: string; marketIngredientId: string; pantryIngredientIds: string[]; offerFoods: string[] };
type Auxiliary = { id: string; status: string; payloadSha256: string; action: string; recipeId: string; slotKey: string; marketIngredientId: string };
type Patch = { id: string; status: string; payloadSha256: string; recipeId: string; field: string; stepIndex?: number; slotKey?: string; before: string; after: string };
function checkHash(row: { status: string; payloadSha256: string }) { const { status, payloadSha256, ...payload } = row; assert.equal(status, 'proposed'); assert.equal(payloadSha256, sha256(payload)); }
function run() {
  const { values } = parseArgs({ options: { review: { type: 'string' }, check: { type: 'boolean', default: false } } });
  assert(values.review, '--review must identify the retained full USDA review');
  const envelope = read(`${packagePath}/review-envelope.json`);
  assert.equal(envelope.status, 'PROPOSED_NOT_APPROVED_NOT_ACTIVE');
  for (const [file, hash] of Object.entries(envelope.fileHashes)) assert.equal(sha256(read(`${packagePath}/${file}`)), hash);
  const parent = parseArtifact(read('catalog/releases/2026-11-07.1/catalog.json'));
  assert.equal(envelope.parentVersion, parent.catalogVersion); assert.equal(envelope.parentContentHash, parent.contentHash);
  const runtime = read('src/data/cooking-catalog.json');
  assert.equal(runtime.contentHash, parent.contentHash); same(runtime.ingredients, parent.ingredients); same(runtime.compatibility, parent.compatibility);
  const active = parseLedger(read('catalog/curation-ledger.json'));
  const ledger = parseLedger(read(`${packagePath}/ledger.json`));
  same(ledger.decisions.filter((r) => r.status === 'approved'), active.decisions);
  const pending = ledger.decisions.filter((r) => r.status === 'proposed');
  assert.equal(pending.length, 31); assert(pending.every((r) => !r.review));
  same(read(`${packagePath}/decision-hashes.json`), pending.map((d) => ({ id: d.id, revision: d.revision, payloadSha256: decisionHash(d) })));
  const sourcePath = `${values.review}/source-records.json`;
  const sources = parseSources(read(sourcePath)); assert.equal(fileHash(sourcePath), envelope.sourceSnapshotFileSha256); assert.equal(sources.releaseDate, envelope.sourceRelease);
  const evidence = parseSources(read(`${packagePath}/source-evidence.json`));
  same(evidence.records.map((r) => r.key).sort(), [...new Set(pending.flatMap((d) => d.sourceRefs.map((r) => r.key)))].sort());
  for (const r of evidence.records) { assert.equal(r.disposition, 'candidate'); same(r, sources.records.find((s) => s.key === r.key)); assert(!parent.sourceLinks.some((s) => s.key === r.key)); }
  const preview = curateCatalog({ ledger, sources, previous: parent, version: '2026-11-07.proteins-proposal', asOfDate: '2026-11-07' });
  same(preview.artifact.ingredients, parent.ingredients); same(preview.artifact.compatibility, parent.compatibility); same(preview.artifact.sourceLinks, parent.sourceLinks); same(preview.artifact.decisions, parent.decisions);
  for (const before of parent.ingredients) same(preview.preview.ingredients.find((r) => r.id === before.id), before);
  const additions = pending.filter((r) => r.ingredient); assert.equal(additions.length, 28); assert(additions.every((r) => !parent.ingredients.some((p) => p.id === r.ingredient!.id) && !r.ingredient!.staticPrice && !r.ingredient!.recipeIngredientId));
  assert.equal(pending.filter((r) => r.compatibility).length, 3);
  const gaps = read(`${packagePath}/curated-gaps.json`) as { ingredientId: string; rationale: string; hintPurpose: string; candidateHints: unknown[] }[];
  same(gaps.map((r) => r.ingredientId).sort(), additions.filter((r) => r.sourceKind === 'CURATED').map((r) => r.ingredient!.id).sort()); assert.equal(gaps.length, 11); assert.equal(new Set(gaps.map((r) => r.ingredientId)).size, 11);
  for (const gap of gaps) {
    assert.equal(gap.rationale, additions.find((d) => d.ingredient!.id === gap.ingredientId)?.rationale); assert.equal(gap.hintPurpose, 'INVESTIGATION_ONLY_NOT_A_SOURCE_ASSIGNMENT');
    for (const hint of gap.candidateHints) { const r = parseSources({ formatVersion: 1, rulesVersion: sources.rulesVersion, records: [hint] }).records[0]; assert.equal(r.disposition, 'candidate'); same(r, sources.records.find((s) => s.key === r.key)); }
  }
  // Validation only: never persist simulated approval records or publish this artifact.
  const simulated: CatalogDecision[] = ledger.decisions.map((d) => d.status === 'approved' ? d : ({ ...d, status: 'approved', review: { by: 'VALIDATION SIMULATION ONLY — NOT MAINTAINER APPROVAL', date: '2026-11-07', payloadSha256: decisionHash(d) } }));
  const options = { ledger: { formatVersion: 1 as const, decisions: simulated }, sources, previous: parent, version: '2026-11-07.proteins-validation-only', asOfDate: '2026-11-07' };
  const simulation = curateCatalog(options); assert(simulation.report.publishable); same(simulation, curateCatalog(options)); same(simulation.artifact.ingredients, preview.preview.ingredients);
  same(simulation.artifact.compatibility.map((r) => `${r.from}:${r.to}`).sort(), [...parent.compatibility, ...pending.flatMap((r) => r.compatibility ? [r.compatibility] : [])].map((r) => `${r.from}:${r.to}`).sort());
  const fixtures = read(`${packagePath}/search-fixtures.json`) as { query: string; expected: string[] }[];
  assert.equal(fixtures.length, 372);
  for (const f of fixtures) same(searchCookingCatalog(preview.preview.ingredients, f.query).map((r) => r.id).sort(), [...f.expected].sort());
  for (const i of preview.preview.ingredients) { for (const q of [i.name, ...i.aliases]) assert(searchCookingCatalog(preview.preview.ingredients, q).some((r) => r.id === i.id), q); if (i.parentIngredientId) assert(cookingCatalogVariants(preview.preview.ingredients, i.parentIngredientId).some((r) => r.id === i.id)); }
  const broad = { beans: 12, flour: 11, beef: 10, pork: 8, chicken: 7, sausage: 9, salmon: 1, steak: 4, kielbasa: 2, andouille: 2 };
  for (const [query, count] of Object.entries(broad)) assert.equal(searchCookingCatalog(preview.preview.ingredients, query, 1000).length, count);
  const behavior = read(`${packagePath}/behavior-cases.json`);
  assert.equal(behavior.availabilityCases.length, 10); assert.equal(behavior.offerCases.length, 40);
  for (const r of behavior.availabilityCases as { positives: string[]; negatives: string[]; requiredId: string; expected: boolean }[]) {
    const entries: PantryEntry[] = [...r.positives.map((ingredientId) => ({ id: `yes:${ingredientId}`, ingredientId, displayName: ingredientId, available: true, revision: 1, updatedAtIso: '' })), ...r.negatives.map((ingredientId) => ({ id: `no:${ingredientId}`, ingredientId, displayName: ingredientId, available: false, revision: 1, updatedAtIso: '' }))];
    assert.equal(availableCookingIngredientIds(entries, preview.preview.ingredients, simulation.artifact.compatibility).includes(r.requiredId), r.expected);
  }
  const currentApproval = read('catalog/market-coverage-approvals.json');
  const original = read('catalog/scoped-recipe-uses.json');
  const currentCompiled = compileScopedRecipeUses(original, parent.ingredients, CANONICAL_INGREDIENTS, MEAL_PREP_BLUEPRINTS, currentApproval);
  same(currentCompiled.uses, runtime.scopedRecipeUses); same(currentCompiled.contexts, runtime.scopedRecipeContexts); same(compileMarketCounterparts(currentApproval, parent.ingredients, CANONICAL_INGREDIENTS), runtime.marketCounterparts);
  const counterparts = read(`${packagePath}/market-counterparts.json`);
  const recipe = read(`${packagePath}/recipe-use-proposal.json`);
  same(envelope.blueprintHash, sha256(MEAL_PREP_BLUEPRINTS)); same(envelope.marketHash, sha256(CANONICAL_INGREDIENTS)); same(recipe.blueprintHash, envelope.blueprintHash); same(recipe.marketHash, envelope.marketHash); same(counterparts.marketHash, envelope.marketHash);
  same(recipe.previousCoverageApprovalHash, sha256(currentApproval)); same(envelope.previousCoverageApprovalHash, sha256(currentApproval)); same(recipe.previousScopedApprovalHash, sha256(original)); same(recipe.protectedMarketIngredientIds, counterparts.protectedMarketIngredientIds);
  const groupIds: string[] = recipe.protectedMarketIngredientIds;
  same([...groupIds].sort(), ['chicken-thighs-bone-in', 'pork-loin-roast-chops', 'beef-chuck-roast', 'italian-pork-sausage', 'smoked-sausage-kielbasa', 'sirloin-strip-steak', 'salmon-fillets'].sort());
  assert.equal(counterparts.decisions.length, 28); assert.equal(new Set(counterparts.decisions.map((r: { id: string }) => r.id)).size, 28);
  const counterpartRows = counterparts.decisions as { id: string; status: string; payloadSha256: string; revision: number; marketIngredientId: string; pantryIngredientId: string; foodName: string }[];
  for (const row of counterpartRows) { checkHash(row); assert.equal(row.revision, 1); assert.equal(row.id, `counterpart:${row.marketIngredientId}:${row.pantryIngredientId}`); assert(groupIds.includes(row.marketIngredientId)); assert.equal(preview.preview.ingredients.find((r) => r.id === row.pantryIngredientId)?.name, row.foodName); }
  same(counterpartRows.map((r) => r.pantryIngredientId).sort(), additions.map((r) => r.ingredient!.id).sort());
  const slots: Slot[] = recipe.decisions;
  const expected = MEAL_PREP_BLUEPRINTS.flatMap((b) => b.slots.flatMap((s) => [...new Set([...s.candidateIngredientIds, ...s.lowCarbCandidateIds ?? []])].filter((id) => groupIds.includes(id)).map((id) => `${b.id}:${s.slotKey}:${id}`)));
  same(slots.map((r) => r.id).sort(), expected.sort()); assert.equal(new Set(slots.map((r) => r.id)).size, 14);
  for (const row of slots) {
    checkHash(row); assert.equal(row.revision, 1); assert.equal(new Set(row.pantryIngredientIds).size, row.pantryIngredientIds.length);
    if (row.action === 'reject') { assert.equal(row.pantryIngredientIds.length, 0); assert.equal(row.offerFoods.length, 0); }
    else { assert.equal(row.action, 'allow'); assert(row.pantryIngredientIds.length && row.offerFoods.length); }
    for (const id of row.pantryIngredientIds) assert(counterpartRows.some((r) => r.marketIngredientId === row.marketIngredientId && r.pantryIngredientId === id));
  }
  assert.equal(slots.filter((r) => r.action === 'allow').length, 8);
  same(behavior.rejectedScopeContexts.map((r: { recipeId: string; slotKey: string; marketIngredientId: string }) => `${r.recipeId}:${r.slotKey}:${r.marketIngredientId}`).sort(), slots.filter((r) => r.action === 'reject').map((r) => r.id).sort());
  const aux: Auxiliary[] = recipe.auxiliaryCandidateDecisions;
  assert.equal(aux.length, 2);
  for (const row of aux) { checkHash(row); assert.equal(row.action, 'reject'); assert.equal(row.slotKey, 'primary_protein'); assert.equal(row.marketIngredientId, 'ground-beef-80-20'); assert(!groupIds.includes(row.marketIngredientId)); assert(['dutch-oven-beef-chuck-pot-roast-stew', 'keto-caveman-beef-chuck-mushroom-cauliflower-braise'].includes(row.recipeId)); assert.equal(row.id, `${row.recipeId}:${row.slotKey}:${row.marketIngredientId}`); }
  const transformed = structuredClone(MEAL_PREP_BLUEPRINTS);
  same(recipe.candidateRemovals.map((r: { id: string }) => r.id).sort(), [...slots.filter((r) => r.action === 'reject'), ...aux].map((r) => r.id).sort()); assert.equal(recipe.candidateRemovals.length, 8);
  for (const removal of recipe.candidateRemovals) {
    const row = [...slots, ...aux].find((r) => r.id === removal.id)!;
    const slot = transformed.find((b) => b.id === row.recipeId)!.slots.find((s) => s.slotKey === row.slotKey)!;
    same(removal.before, { candidateIngredientIds: slot.candidateIngredientIds, lowCarbCandidateIds: slot.lowCarbCandidateIds ?? [] });
    slot.candidateIngredientIds = slot.candidateIngredientIds.filter((id) => id !== row.marketIngredientId);
    if (slot.lowCarbCandidateIds) slot.lowCarbCandidateIds = slot.lowCarbCandidateIds.filter((id) => id !== row.marketIngredientId);
    same(removal.after, { candidateIngredientIds: slot.candidateIngredientIds, lowCarbCandidateIds: slot.lowCarbCandidateIds ?? [] });
  }
  const patches: Patch[] = recipe.instructionTitleAndLabelPatches; assert.equal(patches.length, 19); assert.equal(new Set(patches.map((r) => r.id)).size, patches.length);
  for (const patch of patches) { checkHash(patch); const b = transformed.find((r) => r.id === patch.recipeId)!;
    if (patch.field === 'title') { assert.equal(b.title, patch.before); b.title = patch.after; }
    else if (patch.field === 'steps') { assert(Number.isInteger(patch.stepIndex)); assert.equal(b.steps[patch.stepIndex!], patch.before); b.steps[patch.stepIndex!] = patch.after; }
    else { assert.equal(patch.field, 'slotLabel'); const s = b.slots.find((r) => r.slotKey === patch.slotKey)!; assert.equal(s.label, patch.before); s.label = patch.after; }
  }
  same(sha256(transformed), recipe.proposedImplementedBlueprintHash);
  // No other recipe fields (quantities, macro fields, tags, estimates) may change.
  for (const before of MEAL_PREP_BLUEPRINTS) {
    const after = transformed.find((r) => r.id === before.id)!;
    same({ ...after, title: before.title, steps: before.steps, slots: before.slots }, before);
    for (const s of before.slots) { const changed = after.slots.find((r) => r.slotKey === s.slotKey)!; same({ ...changed, label: s.label, candidateIngredientIds: s.candidateIngredientIds, ...(s.lowCarbCandidateIds ? { lowCarbCandidateIds: s.lowCarbCandidateIds } : {}) }, s); }
  }
  assert(transformed.find((b) => b.id === 'sheet-pan-salmon-asparagus-brussels-potato-roast')!.steps[2].includes('145°F'));
  assert(!transformed.find((b) => b.id === 'sheet-pan-salmon-asparagus-brussels-potato-roast')!.steps[2].includes('135°F'));
  const preparation = read(`${packagePath}/preparation-evidence.json`); assert.equal(preparation.sources.length, 4); assert(preparation.sources.every((s: { url: string }) => /^https:\/\/(?:www\.foodsafety\.gov|ask\.fsis\.usda\.gov)\//.test(s.url)));
  const report = { status: 'PROPOSAL_VALIDATED_NOT_APPROVED_NOT_ACTIVE', preparedOn: '2026-11-07', parentVersion: parent.catalogVersion, parentContentHash: parent.contentHash, packageHash: sha256(envelope), validatorFileSha256: fileHash('scripts/validate-market-protein-proposal.ts'), counts: envelope.counts,
    checks: { priorApprovalsAndRuntimeUnchanged: true, unapprovedChoicesNeverAffectApprovedContents: true, sourceEvidenceAndResearchHintsMatchFullSnapshot: true, noHeldOrPreviouslyAssignedSourceReused: true, deterministicInMemoryApprovalSimulationOnly: true, allExistingIngredientsPricesAndGlobalRecipeLinksUnchanged: true, all372PreviewSearchFixturesPass: true, allNamesAliasesAndOptionalChoicesReachable: true, unboundedBroadQueryCounts: broad, tenAvailabilityExamplesPass: true, existingProduceCounterpartsAndScopedUsesUnchanged: true, all28CounterpartAnd14SlotPayloadsBound: true, sixScopedAndTwoAuxiliaryCandidateRemovalsReplayExactly: true, nineteenTextPatchesReplayExactly: true, noOtherRecipeFieldsChanged: true, salmonEndpointCorrectionIncluded: true },
    offerCases: { count: 40, implementation: 'PENDING: exact review expectations only; no new protein title admission or recipe runtime is claimed implemented/tested' },
    pendingGates: ['Maintainer approval of the exact ingredient/coverage, counterpart, recipe/removal/text, frozen-raw storage policy and offer payloads', 'Append-only protein compiler/runtime support while preserving the approved produce batch and exact ground-beef ownership elsewhere', 'Execute cooking-state/cut/bone/species, offer, price/store/shopping, saved-context and private ownership cases against implementation', 'Additive 28-ID registry migration, rollback/readiness tests and hosted verification', 'Dairy batch, four earlier qualification findings, remaining category scope decisions, final audit and v1.6.1 release'] };
  if (values.check) same(read(`${packagePath}/validation.json`), report); else writeFileSync(`${packagePath}/validation.json`, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ status: report.status, counts: envelope.counts, currentCatalogChanged: false, published: false }));
}
run();
