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

const packagePath = 'catalog/proposals/2026-11-07-market-produce';
const read = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
const fileHash = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex');
const same = (a: unknown, b: unknown) => assert.equal(sha256(a), sha256(b));
type SlotDecision = { id: string; revision: number; status: string; payloadSha256: string; action: 'allow' | 'reject'; recipeId: string; slotKey: string; slotLabel: string; marketIngredientId: string; pantryIngredientIds: string[]; offerFoods: string[]; supersedesPayloadSha256?: string };
type Counterpart = { id: string; revision: number; status: string; payloadSha256: string; marketIngredientId: string; pantryIngredientId: string; foodName: string };
type Patch = { id: string; status: string; payloadSha256: string; recipeId: string; field: 'steps' | 'title'; stepIndex?: number; before: string; after: string };
function checkHash(row: { status: string; payloadSha256: string }) {
  const { status, payloadSha256, ...payload } = row;
  assert.equal(status, 'proposed');
  assert.equal(payloadSha256, sha256(payload));
}
function run() {
  const { values } = parseArgs({ options: { review: { type: 'string' }, check: { type: 'boolean', default: false } } });
  assert(values.review, '--review must point to the retained full USDA review snapshot');
  const envelope = read(`${packagePath}/review-envelope.json`);
  assert.equal(envelope.status, 'PROPOSED_NOT_APPROVED_NOT_ACTIVE');
  for (const [name, hash] of Object.entries(envelope.fileHashes)) assert.equal(sha256(read(`${packagePath}/${name}`)), hash);
  const parent = parseArtifact(read('catalog/releases/2026-11-06.5/catalog.json'));
  assert.equal(envelope.parentContentHash, parent.contentHash);
  assert.equal(envelope.parentVersion, parent.catalogVersion);
  const runtime = read('src/data/cooking-catalog.json');
  assert.equal(runtime.contentHash, parent.contentHash);
  same(runtime.ingredients, parent.ingredients);
  same(runtime.compatibility, parent.compatibility);
  const active = parseLedger(read('catalog/curation-ledger.json'));
  const ledger = parseLedger(read(`${packagePath}/ledger.json`));
  same(ledger.decisions.filter((r) => r.status === 'approved'), active.decisions);
  const pending = ledger.decisions.filter((r) => r.status === 'proposed');
  assert.equal(pending.length, 38);
  assert(pending.every((r) => !r.review));
  same(read(`${packagePath}/decision-hashes.json`), pending.map((d) => ({ id: d.id, revision: d.revision, payloadSha256: decisionHash(d) })));
  const sources = parseSources(read(`${values.review}/source-records.json`));
  assert.equal(fileHash(`${values.review}/source-records.json`), envelope.sourceSnapshotFileSha256);
  assert.equal(sources.releaseDate, envelope.sourceRelease);
  const evidence = parseSources(read(`${packagePath}/source-evidence.json`));
  const selected = [...new Set(pending.flatMap((r) => r.sourceRefs.map((s) => s.key)))].sort();
  same(evidence.records.map((r) => r.key).sort(), selected);
  for (const row of evidence.records) { assert.equal(row.disposition, 'candidate'); same(row, sources.records.find((r) => r.key === row.key)); }
  const preview = curateCatalog({ ledger, sources, previous: parent, version: '2026-11-07.produce-proposal', asOfDate: '2026-11-07' });
  same(preview.artifact.ingredients, parent.ingredients);
  same(preview.artifact.compatibility, parent.compatibility);
  same(preview.artifact.sourceLinks, parent.sourceLinks);
  same(preview.artifact.decisions, parent.decisions);
  const additions = pending.filter((r) => r.ingredient && !parent.ingredients.some((p) => p.id === r.ingredient!.id));
  assert.equal(additions.length, 26);
  assert.equal(additions.filter((r) => r.sourceKind === 'CURATED').length, 5);
  assert(additions.every((r) => !r.ingredient!.staticPrice && !r.ingredient!.recipeIngredientId));
  for (const before of parent.ingredients) {
    const expected = structuredClone(before);
    if (before.id === 'spinach-fresh') expected.aliases = [...expected.aliases, 'fresh spinach greens'];
    if (before.id === 'kale-fresh') expected.aliases = [...expected.aliases, 'fresh kale greens'];
    same(preview.preview.ingredients.find((r) => r.id === before.id), expected);
  }
  // In-memory schema/evidence validation only. No simulated ledger or artifact is written.
  const simulated: CatalogDecision[] = ledger.decisions.map((d) => d.status === 'approved' ? d : ({ ...d, status: 'approved', review: { by: 'VALIDATION SIMULATION ONLY — NOT MAINTAINER APPROVAL', date: '2026-11-07', payloadSha256: decisionHash(d) } }));
  const options = { ledger: { formatVersion: 1 as const, decisions: simulated }, sources, previous: parent, version: '2026-11-07.produce-validation-only', asOfDate: '2026-11-07' };
  const simulation = curateCatalog(options);
  assert(simulation.report.publishable);
  same(simulation, curateCatalog(options));
  same(simulation.artifact.ingredients, preview.preview.ingredients);
  same(simulation.artifact.compatibility.map((r) => `${r.from}:${r.to}`).sort(), [...parent.compatibility, ...pending.flatMap((r) => r.compatibility ? [r.compatibility] : [])].map((r) => `${r.from}:${r.to}`).sort());
  const fixtures = read(`${packagePath}/search-fixtures.json`) as { query: string; expected: string[] }[];
  assert.equal(fixtures.length, envelope.counts.searchFixtures);
  for (const fixture of fixtures) same(searchCookingCatalog(preview.preview.ingredients, fixture.query).map((r) => r.id).sort(), [...fixture.expected].sort());
  for (const ingredient of preview.preview.ingredients) {
    for (const query of [ingredient.name, ...ingredient.aliases]) assert(searchCookingCatalog(preview.preview.ingredients, query).some((r) => r.id === ingredient.id), query);
    if (ingredient.parentIngredientId) assert(cookingCatalogVariants(preview.preview.ingredients, ingredient.parentIngredientId).some((r) => r.id === ingredient.id));
  }
  const broad = { beans: 12, flour: 11, potatoes: 2, apples: 1, squash: 5, chiles: 5, peppers: 6, mushrooms: 2, greens: 4 };
  for (const [query, count] of Object.entries(broad)) assert.equal(searchCookingCatalog(preview.preview.ingredients, query, 1000).length, count);
  const behavior = read(`${packagePath}/behavior-cases.json`);
  for (const row of behavior.availabilityCases as { positives: string[]; negatives: string[]; requiredId: string; expected: boolean }[]) {
    const entries: PantryEntry[] = [...row.positives.map((ingredientId) => ({ id: `yes:${ingredientId}`, ingredientId, displayName: ingredientId, available: true, revision: 1, updatedAtIso: '' })), ...row.negatives.map((ingredientId) => ({ id: `no:${ingredientId}`, ingredientId, displayName: ingredientId, available: false, revision: 1, updatedAtIso: '' }))];
    assert.equal(availableCookingIngredientIds(entries, preview.preview.ingredients, simulation.artifact.compatibility).includes(row.requiredId), row.expected);
  }
  const counterpart = read(`${packagePath}/market-counterparts.json`);
  const recipe = read(`${packagePath}/recipe-use-proposal.json`);
  same(counterpart.marketHash, sha256(CANONICAL_INGREDIENTS));
  same(recipe.marketHash, sha256(CANONICAL_INGREDIENTS));
  same(recipe.blueprintHash, sha256(MEAL_PREP_BLUEPRINTS));
  same(envelope.blueprintHash, recipe.blueprintHash);
  const original = read('catalog/scoped-recipe-uses.json');
  same(recipe.previousScopedApprovalHash, sha256(original));
  same(recipe.protectedMarketIngredientIds, counterpart.protectedMarketIngredientIds);
  const known = new Map(preview.preview.ingredients.map((r) => [r.id, r]));
  const counterpartRows: Counterpart[] = counterpart.decisions;
  assert.equal(counterpartRows.length, 30);
  assert.equal(new Set(counterpartRows.map((r) => r.id)).size, counterpartRows.length);
  for (const row of counterpartRows) {
    checkHash(row);
    assert.equal(row.id, `counterpart:${row.marketIngredientId}:${row.pantryIngredientId}`);
    assert(counterpart.protectedMarketIngredientIds.includes(row.marketIngredientId));
    assert(CANONICAL_INGREDIENTS.some((r) => r.id === row.marketIngredientId));
    assert.equal(known.get(row.pantryIngredientId)?.name, row.foodName);
  }
  same([...new Set(counterpartRows.map((r) => r.pantryIngredientId))].sort(), [...additions.map((r) => r.ingredient!.id), 'mushrooms-white-fresh', 'tomatoes-fresh', 'spinach-fresh', 'kale-fresh'].sort());
  const slots: SlotDecision[] = recipe.decisions;
  const expectedSlots = MEAL_PREP_BLUEPRINTS.flatMap((b) => b.slots.flatMap((s) => [...new Set([...s.candidateIngredientIds, ...s.lowCarbCandidateIds ?? []])].filter((id) => recipe.protectedMarketIngredientIds.includes(id)).map((id) => `${b.id}:${s.slotKey}:${id}`)));
  same(slots.map((r) => r.id).sort(), expectedSlots.sort());
  assert.equal(new Set(slots.map((r) => r.id)).size, 38);
  for (const row of slots) {
    checkHash(row);
    const before = original.proposal.decisions.find((r: { id: string }) => r.id === row.id);
    if (before) { assert.equal(row.supersedesPayloadSha256, before.payloadSha256); assert.equal(row.revision, 2); assert(before.pantryIngredientIds.every((id: string) => row.pantryIngredientIds.includes(id))); same(row.offerFoods, before.offerFoods); }
    else { assert.equal(row.revision, 1); assert.equal(row.supersedesPayloadSha256, undefined); }
    const slot = MEAL_PREP_BLUEPRINTS.find((b) => b.id === row.recipeId)?.slots.find((s) => s.slotKey === row.slotKey);
    assert.equal(slot?.label, row.slotLabel);
    if (row.action === 'reject') { assert.equal(row.pantryIngredientIds.length, 0); assert.equal(row.offerFoods.length, 0); }
    else { assert.equal(row.action, 'allow'); assert(row.pantryIngredientIds.length && row.offerFoods.length); }
    assert.equal(new Set(row.pantryIngredientIds).size, row.pantryIngredientIds.length);
    for (const id of row.pantryIngredientIds) assert(counterpartRows.some((r) => r.marketIngredientId === row.marketIngredientId && r.pantryIngredientId === id));
  }
  const proposedBlueprints = structuredClone(MEAL_PREP_BLUEPRINTS);
  assert.equal(recipe.candidateRemovals.length, 9);
  same(recipe.candidateRemovals.map((r: { id: string }) => r.id).sort(), slots.filter((r) => r.action === 'reject').map((r) => r.id).sort());
  for (const removal of recipe.candidateRemovals) {
    const row = slots.find((r) => r.id === removal.id)!;
    const slot = proposedBlueprints.find((b) => b.id === row.recipeId)!.slots.find((s) => s.slotKey === row.slotKey)!;
    same(removal.before, { candidateIngredientIds: slot.candidateIngredientIds, lowCarbCandidateIds: slot.lowCarbCandidateIds ?? [] });
    slot.candidateIngredientIds = slot.candidateIngredientIds.filter((id) => id !== row.marketIngredientId);
    if (slot.lowCarbCandidateIds) slot.lowCarbCandidateIds = slot.lowCarbCandidateIds.filter((id) => id !== row.marketIngredientId);
    same(removal.after, { candidateIngredientIds: slot.candidateIngredientIds, lowCarbCandidateIds: slot.lowCarbCandidateIds ?? [] });
  }
  const patches: Patch[] = recipe.instructionAndTitlePatches;
  assert.equal(patches.length, 7);
  assert.equal(new Set(patches.map((r) => r.id)).size, patches.length);
  for (const patch of patches) {
    checkHash(patch);
    const blueprint = proposedBlueprints.find((b) => b.id === patch.recipeId)!;
    if (patch.field === 'title') { assert.equal(blueprint.title, patch.before); blueprint.title = patch.after; }
    else { assert.equal(patch.field, 'steps'); assert(Number.isInteger(patch.stepIndex)); assert.equal(blueprint.steps[patch.stepIndex!], patch.before); blueprint.steps[patch.stepIndex!] = patch.after; }
  }
  same(sha256(proposedBlueprints), recipe.proposedImplementedBlueprintHash);
  const report = { status: 'PROPOSAL_VALIDATED_NOT_APPROVED_NOT_ACTIVE', preparedOn: '2026-11-07', parentVersion: parent.catalogVersion, parentContentHash: parent.contentHash,
    packageHash: sha256(envelope), validatorFileSha256: fileHash('scripts/validate-market-produce-proposal.ts'), counts: envelope.counts,
    checks: { priorApprovalsUnchanged: true, currentRuntimeUnchanged: true, unapprovedProposalDoesNotAffectApprovedContents: true, sourceEvidenceMatchesFullSnapshot: true, noHeldSourceAssigned: true, inMemorySourceAssignmentValidationOnly: true, deterministicSimulation: true, noNewFixedPricesOrGlobalRecipeLinks: true, allPreviewFixturesPass: true, allNamesAliasesAndOptionalChoicesReachable: true, broadQueriesDoNotTruncate: broad, tenAvailabilityCasesPass: true, thirtyCounterpartPayloadHashesValid: true, all38AffectedSlotsReviewed: true, priorScopedPayloadsBoundByHash: true, nineCandidateRemovalsAndSevenTextPatchesReplayExactly: true },
    offerCaseCount: behavior.offerCases.length, offerCaseImplementation: 'PENDING: review expectations only; no new title admission is implemented or claimed tested',
    pendingGates: ['Maintainer exact review of all ingredient/coverage, counterpart, recipe and offer payloads', 'Compiler/runtime support for counterpart records, versioned scoped approvals, new food/form terms and rejected-candidate removal', 'Execute offer/store/cost/shopping and saved-recipe context examples against the implementation', 'Additive accepted-ID migration, rollback and owner/account readiness checks', 'Required proteins/dairy market batches, qualification findings, final audit and hosted v1.6.1 release'] };
  const output = `${packagePath}/validation.json`;
  if (values.check) same(read(output), report);
  else writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ status: report.status, counts: envelope.counts, currentCatalogChanged: false, published: false }));
}
run();
