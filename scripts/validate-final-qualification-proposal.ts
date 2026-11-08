import { strict as assert } from 'node:assert';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { MEAL_PREP_BLUEPRINTS } from '../src/data/meal-prep-blueprints';
import { CANONICAL_INGREDIENTS } from '../src/data/canonical-ingredients';
import { availableCookingIngredientIds, searchCookingCatalog } from '../src/lib/pantry/catalog-search';
import { parseArtifact, parseLedger, parseSources, curateCatalog, sha256 } from './lib/catalog-curation';
import { compileScopedRecipeUses } from './lib/scoped-recipe-uses';
import { compileMarketCounterparts } from './lib/market-coverage-approvals';
import { PantryEntry } from '../src/types/pantry';
const folder = 'catalog/proposals/2026-11-07-final-qualification';
const read = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
const same = (a: unknown, b: unknown) => assert.equal(sha256(a), sha256(b));
const fileHash = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex');
function checkHash(row: { status: string; payloadSha256: string }) { const { status, payloadSha256, ...payload } = row; assert.equal(status, 'proposed'); assert.equal(payloadSha256, sha256(payload)); }
function run() {
  const { values } = parseArgs({ options: { review: { type: 'string' }, check: { type: 'boolean', default: false } } });
  assert(values.review, '--review must identify the retained full source review');
  const envelope = read(`${folder}/review-envelope.json`), artifact = parseArtifact(read('catalog/releases/2026-11-07.3/catalog.json')), ledger = parseLedger(read('catalog/curation-ledger.json')), runtime = read('src/data/cooking-catalog.json');
  assert.equal(envelope.status, 'PROPOSED_NOT_APPROVED_NOT_ACTIVE');
  for (const [file, hash] of Object.entries(envelope.fileHashes)) assert.equal(sha256(read(`${folder}/${file}`)), hash);
  assert.equal(envelope.parentVersion, artifact.catalogVersion); assert.equal(envelope.parentContentHash, artifact.contentHash); assert.equal(sha256(ledger), envelope.activeLedgerHash);
  assert.equal(artifact.ingredients.length, 222); assert.equal(artifact.decisions.length, 252); assert.equal(ledger.decisions.length, 252); assert(ledger.decisions.every((d) => d.status === 'approved'));
  assert.equal(runtime.contentHash, artifact.contentHash); same(runtime.ingredients, artifact.ingredients); same(runtime.compatibility, artifact.compatibility);
  const sourcePath = `${values.review}/source-records.json`, sources = parseSources(read(sourcePath));
  assert.equal(fileHash(sourcePath), envelope.sourceSnapshotFileSha256); assert.equal(sources.releaseDate, envelope.sourceRelease);
  const replay = curateCatalog({ ledger, sources, previous: artifact, version: artifact.catalogVersion, asOfDate: '2026-11-07' });
  assert(replay.report.publishable); same(replay.artifact, artifact);
  const bindings = read(`${folder}/ingredient-bindings.json`), evidence = parseSources(read(`${folder}/source-evidence.json`));
  assert.equal(bindings.decisionsHash, sha256(ledger.decisions)); assert.equal(bindings.contentHash, artifact.contentHash); assert.equal(bindings.bindings.length, 4); assert.equal(evidence.records.length, 4);
  const ids: string[] = bindings.bindings.map((r: { marketIngredientId: string }) => r.marketIngredientId);
  same([...ids].sort(), ['avocados-hass','chicken-breast-boneless','green-cabbage','sweet-potatoes'].sort());
  for (const b of bindings.bindings) { same(b.pantryIngredient, artifact.ingredients.find((i) => i.id === b.marketIngredientId)); assert.equal(b.pantryIngredient.recipeIngredientId, b.marketIngredientId); same(b.ingredientDecision, artifact.decisions.find((d) => d.id === `ingredient-${b.marketIngredientId}`)); same(b.sourceLinks, artifact.sourceLinks.filter((s) => s.ingredientId === b.marketIngredientId)); }
  same([...new Set(bindings.bindings.flatMap((b: { sourceLinks: { key: string }[] }) => b.sourceLinks.map((s) => s.key)))].sort(), evidence.records.map((r) => r.key).sort());
  for (const r of evidence.records) { assert.equal(r.disposition, 'candidate'); same(r, sources.records.find((s) => s.key === r.key)); }
  const fixtures = read('catalog/core-search-fixtures.json') as { query: string; expected: string[] }[];
  assert.equal(fixtures.length, 457); assert.equal(sha256(fixtures), envelope.existingSearchFixturesHash);
  for (const f of fixtures) same(searchCookingCatalog(artifact.ingredients, f.query).map((i) => i.id).sort(), [...f.expected].sort());
  const broad = { beans: 12, lentils: 2, rice: 3, flour: 11, tofu: 2, yogurt: 3 };
  for (const [query, count] of Object.entries(broad)) assert.equal(searchCookingCatalog(artifact.ingredients, query, 1000).length, count);
  const approval = read('catalog/market-coverage-approvals.json'), original = read('catalog/scoped-recipe-uses.json');
  const current = compileScopedRecipeUses(original, artifact.ingredients, CANONICAL_INGREDIENTS, MEAL_PREP_BLUEPRINTS, approval);
  same(current.uses, runtime.scopedRecipeUses); same(current.contexts, runtime.scopedRecipeContexts); same(current.protectedMarketIds, runtime.protectedRecipeMarketIds); same(compileMarketCounterparts(approval, artifact.ingredients, CANONICAL_INGREDIENTS), runtime.marketCounterparts);
  assert.equal(envelope.blueprintHash, sha256(MEAL_PREP_BLUEPRINTS)); assert.equal(envelope.marketHash, sha256(CANONICAL_INGREDIENTS)); assert.equal(envelope.previousCoverageApprovalHash, sha256(approval));
  const qualifications = read(`${folder}/offer-qualifications.json`), counterparts = read(`${folder}/market-counterparts.json`), proposal = read(`${folder}/recipe-use-proposal.json`), behavior = read(`${folder}/behavior-cases.json`), scope = read(`${folder}/scope-deferrals.json`);
  assert.equal(qualifications.preserveExactPantryLinks, true); assert.equal(qualifications.decisions.length, 4); same(qualifications.decisions.map((r: { marketIngredientId: string }) => r.marketIngredientId), ids);
  for (const r of qualifications.decisions) { checkHash(r); assert.equal(r.revision, 1); assert.equal(r.marketIngredientId, r.pantryIngredientId); }
  for (const data of [qualifications, counterparts]) { assert.equal(data.baseCatalogVersion, artifact.catalogVersion); assert.equal(data.baseCatalogHash, artifact.contentHash); assert.equal(data.marketHash, sha256(CANONICAL_INGREDIENTS)); }
  same(counterparts.protectedMarketIngredientIds, []); assert.equal(counterparts.decisions.length, 4);
  for (const r of counterparts.decisions) { checkHash(r); assert.equal(r.revision, 1); assert.equal(r.id, `counterpart:${r.marketIngredientId}:${r.pantryIngredientId}`); assert.equal(r.marketIngredientId, r.pantryIngredientId); assert(ids.includes(r.pantryIngredientId)); assert.equal(r.foodName, artifact.ingredients.find((i) => i.id === r.pantryIngredientId)!.name); assert(!runtime.marketCounterparts.some((v: { marketIngredientId: string; pantryIngredientId: string }) => v.marketIngredientId === r.marketIngredientId && v.pantryIngredientId === r.pantryIngredientId)); }
  assert.equal(proposal.blueprintHash, sha256(MEAL_PREP_BLUEPRINTS)); assert.equal(proposal.marketHash, sha256(CANONICAL_INGREDIENTS)); assert.equal(proposal.previousCoverageApprovalHash, sha256(approval)); assert.equal(proposal.previousScopedApprovalHash, sha256(original)); same(proposal.protectedMarketIngredientIds, []); same(proposal.decisions, []);
  const inventory = MEAL_PREP_BLUEPRINTS.flatMap((b) => b.slots.flatMap((s) => [...new Set([...s.candidateIngredientIds,...s.lowCarbCandidateIds ?? []])].filter((id) => ids.includes(id)).map((id) => ({ id: `${b.id}:${s.slotKey}:${id}`, optional: Boolean(s.optional), role: s.lowCarbCandidateIds?.includes(id) ? 'low-carb' : 'normal' }))));
  const rows = proposal.recipeCandidateDecisions as { id: string; revision: number; status: string; payloadSha256: string; action: string; recipeId: string; slotKey: string; slotLabel: string; marketIngredientId: string; pantryIngredientId: string; optional: boolean; role: string }[];
  assert.equal(rows.length, 18); assert.equal(new Set(rows.map((r) => r.id)).size, 18); same(rows.map((r) => r.id).sort(), inventory.map((r) => r.id).sort());
  for (const r of rows) { checkHash(r); assert.equal(r.revision, 1); assert.equal(r.marketIngredientId, r.pantryIngredientId); assert(['retain-exact','reject'].includes(r.action)); same({ optional: r.optional, role: r.role }, { optional: inventory.find((i) => i.id === r.id)!.optional, role: inventory.find((i) => i.id === r.id)!.role }); }
  const rejected = rows.filter((r) => r.action === 'reject'); assert.equal(rejected.length, 3); assert.equal(rows.filter((r) => r.action === 'retain-exact').length, 15);
  same(proposal.auxiliaryCandidateDecisions.map((r: { id: string }) => r.id).sort(), rejected.map((r) => r.id).sort()); same(proposal.candidateRemovals.map((r: { id: string }) => r.id).sort(), rejected.map((r) => r.id).sort());
  const transformed = structuredClone(MEAL_PREP_BLUEPRINTS);
  for (const r of proposal.auxiliaryCandidateDecisions) { checkHash(r); assert.equal(r.action, 'reject'); assert(!current.protectedMarketIds.includes(r.marketIngredientId)); }
  for (const removal of proposal.candidateRemovals) { const r = rejected.find((r) => r.id === removal.id)!; const s = transformed.find((b) => b.id === r.recipeId)!.slots.find((s) => s.slotKey === r.slotKey)!; same(removal.before, { candidateIngredientIds: s.candidateIngredientIds, lowCarbCandidateIds: s.lowCarbCandidateIds ?? [] }); s.candidateIngredientIds = s.candidateIngredientIds.filter((id) => id !== r.marketIngredientId); if (s.lowCarbCandidateIds) s.lowCarbCandidateIds = s.lowCarbCandidateIds.filter((id) => id !== r.marketIngredientId); same(removal.after, { candidateIngredientIds: s.candidateIngredientIds, lowCarbCandidateIds: s.lowCarbCandidateIds ?? [] }); }
  assert.equal(proposal.exactRecipeExclusions.length, 3);
  for (const r of proposal.exactRecipeExclusions) { checkHash(r); assert(rejected.some((v) => `exclude:${v.id}` === r.id && v.recipeId === r.recipeId && v.slotKey === r.slotKey && v.marketIngredientId === r.marketIngredientId)); assert(!transformed.find((b) => b.id === r.recipeId)!.slots.some((s) => [...s.candidateIngredientIds,...s.lowCarbCandidateIds ?? []].includes(r.pantryIngredientId)), 'A whole-recipe exclusion must have no legitimate surviving slot for that exact food'); }
  type Patch = { status: string; payloadSha256: string; recipeId: string; field: string; stepIndex?: number; slotKey?: string; before: string; after: string };
  const patches: Patch[] = proposal.instructionTitleAndLabelPatches; assert.equal(patches.length, 11);
  for (const p of patches) { checkHash(p); const b = transformed.find((b) => b.id === p.recipeId)!; if (p.field === 'steps') { assert(Number.isInteger(p.stepIndex)); assert.equal(b.steps[p.stepIndex!], p.before); b.steps[p.stepIndex!] = p.after; } else if (p.field === 'slotLabel') { const s = b.slots.find((s) => s.slotKey === p.slotKey)!; assert.equal(s.label, p.before); s.label = p.after; } else { assert.equal(p.field,'flavorProfile'); assert.equal(b.flavorProfile,p.before); b.flavorProfile=p.after; } }
  assert.equal(sha256(transformed), proposal.proposedImplementedBlueprintHash);
  for (const r of rows) { const s = transformed.find((b) => b.id === r.recipeId)!.slots.find((s) => s.slotKey === r.slotKey)!; assert.equal([...s.candidateIngredientIds,...s.lowCarbCandidateIds ?? []].includes(r.marketIngredientId), r.action === 'retain-exact'); }
  const reversed = structuredClone(transformed);
  for (const p of [...patches].reverse()) { const b = reversed.find((b) => b.id === p.recipeId)!; if (p.field === 'steps') b.steps[p.stepIndex!] = p.before; else if (p.field === 'slotLabel') b.slots.find((s) => s.slotKey === p.slotKey)!.label = p.before; else b.flavorProfile = p.before; }
  for (const removal of proposal.candidateRemovals) { const r = rejected.find((r) => r.id === removal.id)!, s = reversed.find((b) => b.id === r.recipeId)!.slots.find((s) => s.slotKey === r.slotKey)!; s.candidateIngredientIds = removal.before.candidateIngredientIds; if (s.lowCarbCandidateIds) s.lowCarbCandidateIds = removal.before.lowCarbCandidateIds; }
  same(reversed, MEAL_PREP_BLUEPRINTS);
  const projected = current.uses.map((u) => ({ ...u, slotLabel: transformed.find((b) => b.id === u.recipeId)!.slots.find((s) => s.slotKey === u.slotKey)!.label }));
  assert.equal(projected.length,63); assert.equal(sha256(projected),envelope.projectedScopedUsesHash); assert.equal(sha256(current.uses),envelope.priorScopedUsesHash);
  same(projected.filter((u,i) => u.slotLabel !== current.uses[i].slotLabel).map((u) => ({ id:u.id,before:current.uses.find((v) => v.id===u.id)!.slotLabel,after:u.slotLabel })),envelope.declaredScopeLabelChanges); assert.equal(envelope.declaredScopeLabelChanges.length,6);
  assert.equal(behavior.offerCases.length,71); assert.equal(new Set(behavior.offerCases.map((r: { id: string }) => r.id)).size,71);
  for (const r of behavior.offerCases) { assert(ids.includes(r.marketIngredientId)); same(r.expectedCounterpartIds, r.admit ? [r.marketIngredientId] : []); }
  assert.equal(behavior.availabilityCases.length,8);
  for (const r of behavior.availabilityCases) { const entries: PantryEntry[] = [...r.positiveIds.map((ingredientId: string) => ({ id:`yes:${ingredientId}`,ingredientId,displayName:ingredientId,available:true,revision:1,updatedAtIso:'' })),...r.negativeIds.map((ingredientId: string) => ({ id:`no:${ingredientId}`,ingredientId,displayName:ingredientId,available:false,revision:1,updatedAtIso:'' }))]; assert.equal(availableCookingIngredientIds(entries,artifact.ingredients,artifact.compatibility).includes(r.ingredientId),r.expectedAvailable); }
  same(behavior.recipeCases.map((r: { recipeId: string; slotKey: string; marketIngredientId: string; expectedCandidate: boolean; optional: boolean }) => ({ id:`${r.recipeId}:${r.slotKey}:${r.marketIngredientId}`,action:r.expectedCandidate?'retain-exact':'reject',optional:r.optional })),rows.map((r) => ({id:r.id,action:r.action,optional:r.optional})));
  const oldScope = read('catalog/proposals/2026-11-06-final-audit/scope-deferrals.json'); assert.equal(scope.originalProposalHash,sha256(oldScope)); assert.equal(scope.baseCatalogHash,artifact.contentHash); assert.equal(scope.retainedIngredientCount,222); assert.equal(scope.releaseIngredientCountFixed,false); assert.equal(scope.decisions.length,5);
  for (const r of scope.decisions) { checkHash(r); assert.equal(r.revision,2); assert.equal(r.previousProposalPayloadSha256,oldScope.decisions.find((v: {id:string}) => v.id===r.id).payloadSha256); assert.equal(r.owner,'Catalog maintainer'); assert(!r.review); }
  for (const id of ['mung','adzuki','lima','black-eyed']) assert(!artifact.ingredients.some((i) => i.id.includes(id)));
  assert(artifact.ingredients.some((i) => i.id==='bread-flour')); assert(artifact.ingredients.some((i) => i.id==='self-rising-wheat-flour'));
  const report = { status:'PROPOSAL_VALIDATED_NOT_APPROVED_NOT_ACTIVE',preparedOn:'2026-11-07',parentVersion:artifact.catalogVersion,parentContentHash:artifact.contentHash,packageHash:sha256(envelope),validatorFileSha256:fileHash('scripts/validate-final-qualification-proposal.ts'),counts:envelope.counts,
    checks:{active222Identities252DecisionsAndOwnershipLinksUnchanged:true,fullSourceReplayReproducesAcceptedArtifact:true,fourExistingSourceFingerprintsVerifiedNoHeldAssignment:true,all457ExistingSearchFixturesPass:true,unboundedCategoryQueryCounts:broad,current63Scopes81CounterpartsAnd20ProtectedGroupsUnchanged:true,fourExactQualificationAndCounterpartPayloadsBound:true,all18NormalAndLowCarbRecipeOccurrencesReviewed:true,threeCandidateRemovalsAndNarrowExclusionsBound:true,noExcludedFoodHasAnotherLegitimateSlotInSameRecipe:true,elevenTextPatchesAndInverseReplayExact:true,quantitiesMacrosDietaryTagsAndAllOtherFieldsPreserved:true,onlySixDeclaredPriorScopeLabelsProjectDifferently:true,eightExactYesNoCasesPass:true,fiveUpdatedScopeDeferralsBoundToHistoricalProposal:true,noNewIdsSourcesEdgesOrRegistryMigration:true},
    pendingGates:['Exact maintainer approval of the four offer policies, three recipe exclusions, all recipe/text choices and five v1.6.1 scope boundaries','Implement and execute all 71 original-offer expectations against market scoring, direct/cached recipe repricing, shopping and all store pools','Verify stale matched AND literal saved requirements stay blocked only in the three named recipes; preserve exact ownership elsewhere','Refresh final release audit and complete hosted/readiness/release checks'],offerCases:{count:71,implementation:'PENDING: review expectations only; the new global qualification and narrow exclusion runtime is not implemented or claimed executed'} };
  if (values.check) same(read(`${folder}/validation.json`),report); else writeFileSync(`${folder}/validation.json`,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({status:report.status,counts:report.counts,currentCatalogChanged:false,published:false}));
}
run();
