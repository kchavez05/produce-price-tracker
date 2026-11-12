import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { CANONICAL_INGREDIENTS } from '../src/data/canonical-ingredients';
import { MEAL_PREP_BLUEPRINTS } from '../src/data/meal-prep-blueprints';
import { availableCookingIngredientIds, cookingCatalogVariants, searchCookingCatalog } from '../src/lib/pantry/catalog-search';
import { CatalogDecision, CatalogSourceRecord } from '../src/types/catalog';
import { PantryEntry } from '../src/types/pantry';
import { curateCatalog, decisionHash, parseArtifact, parseLedger, parseSources, sha256 } from './lib/catalog-curation';
import { validateMarketLinkAudit } from './lib/market-link-audit';
import { compileScopedRecipeUses } from './lib/scoped-recipe-uses';

const packagePath = 'catalog/proposals/2026-11-06-final-audit';
const catalogPath = 'catalog/releases/2026-11-06.4/catalog.json';
const read = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
const fileHash = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex');
function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
const equal = (a: unknown, b: unknown) => sha256(a) === sha256(b);
const sorted = (values: string[]) => [...values].sort();
const normalizeDescription = (value: string) => value.normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase();

interface Assessment {
  ingredientId: string; name: string; currentIngredientSha256: string; status: string;
  decisionId: string; payloadSha256: string; rationale: string;
  candidateHints: (CatalogSourceRecord & { purpose: string })[];
}
interface ScopeDecision { id: string; revision: number; status: string; owner: string; scope: string[]; rationale: string; revisit: string; payloadSha256: string }

function run() {
  const { values } = parseArgs({ options: { review: { type: 'string' }, output: { type: 'string' }, 'as-of': { type: 'string' }, check: { type: 'boolean', default: false } } });
  assert(values.review && values.output && values['as-of'], '--review, --output and --as-of are required');
  const asOf = values['as-of'];
  assert(/^\d{4}-\d{2}-\d{2}$/.test(asOf) && Number.isFinite(Date.parse(asOf)) && new Date(asOf).toISOString().slice(0, 10) === asOf, 'Invalid audit date');
  const sourcePath = resolve(values.review);
  const sources = parseSources(read(`${sourcePath}/source-records.json`));
  const discovery = read(`${sourcePath}/report.json`);
  assert(discovery.source.releaseDate === sources.releaseDate && discovery.rulesVersion === sources.rulesVersion, 'Source manifest does not match snapshot');
  for (const kind of ['foundation_food', 'sr_legacy_food']) assert(discovery.counts.foodRowsByType[kind] === sources.records.filter((r) => r.dataType === kind).length, `Source counts do not reconcile: ${kind}`);
  const sourceByKey = new Map(sources.records.map((row) => [row.key, row]));
  const catalog = parseArtifact(read(catalogPath));
  const active = parseLedger(read('catalog/curation-ledger.json'));
  const proposal = parseLedger(read(`${packagePath}/ledger.json`));
  const runtime = read('src/data/cooking-catalog.json');
  const assessmentsFile = read(`${packagePath}/provenance-assessments.json`);
  const assessments: Assessment[] = assessmentsFile.rows;
  assert(Array.isArray(assessments) && assessmentsFile.parentVersion === catalog.catalogVersion && assessmentsFile.parentContentHash === catalog.contentHash, 'Provenance review is stale');
  assert(runtime.catalogVersion === catalog.catalogVersion && runtime.contentHash === catalog.contentHash && equal(runtime.ingredients, catalog.ingredients) && equal(runtime.compatibility, catalog.compatibility), 'Runtime is not the audited catalog');
  const history = new Map(catalog.decisions.map((d) => [`${d.id}:${d.revision}`, d.payloadSha256]));
  assert(active.decisions.length === history.size && active.decisions.every((d) => d.status === 'approved' && history.get(`${d.id}:${d.revision}`) === decisionHash(d)), 'Active approval history differs from catalog');
  const pending = proposal.decisions.filter((d) => d.status === 'proposed');
  assert(equal(proposal.decisions.filter((d) => d.status === 'approved'), active.decisions), 'Proposal changed prior approvals');
  const pendingByIngredient = new Map(pending.map((d) => [d.ingredient?.id, d]));
  assert(pendingByIngredient.size === pending.length && pending.every((d) => d.action === 'upsert' && d.ingredient && !d.review), 'Final review must contain unique unapproved existing-ingredient upserts');
  const hashes = read(`${packagePath}/decision-hashes.json`);
  assert(equal(hashes, pending.map((d) => ({ id: d.id, revision: d.revision, payloadSha256: decisionHash(d) }))), 'Proposed payload hash list is stale');
  const hasSource = new Set(catalog.sourceLinks.map((link) => link.ingredientId));
  const gaps = catalog.ingredients.filter((ingredient) => !hasSource.has(ingredient.id));
  assert(assessments.length === gaps.length && new Set(assessments.map((r) => r.ingredientId)).size === gaps.length, 'Every provenance gap requires exactly one assessment');
  for (const row of assessments) {
    const ingredient = gaps.find((r) => r.id === row.ingredientId);
    assert(ingredient && sha256(ingredient) === row.currentIngredientSha256 && ingredient.name === row.name, `Stale/unrecognized assessment: ${row.ingredientId}`);
    const decision = row.status === 'APPROVED_CURATED_RETAINED' ? active.decisions.find((d) => d.id === row.decisionId) : pendingByIngredient.get(row.ingredientId);
    assert(decision && decisionHash(decision) === row.payloadSha256 && decision.rationale === row.rationale, `Unbound disposition: ${row.ingredientId}`);
    assert(row.status === 'APPROVED_CURATED_RETAINED' ? decision.status === 'approved' && decision.sourceKind === 'CURATED' : decision.status === 'proposed' && row.status === (decision.sourceKind === 'USDA' ? 'PROPOSED_SOURCE_EVIDENCE' : 'PROPOSED_CURATED_RETENTION'), `Wrong disposition status: ${row.ingredientId}`);
    for (const hint of row.candidateHints) {
      const { purpose, ...record } = hint;
      assert(purpose === 'INVESTIGATION_ONLY_NOT_A_PROPOSED_SOURCE_LINK' && equal(sourceByKey.get(record.key), record), `Stale/unlabelled candidate hint: ${record.key}`);
    }
  }
  for (const decision of pending) {
    const before = gaps.find((r) => r.id === decision.ingredient!.id);
    assert(before, 'Proposal adds an identity or changes a source-linked identity');
    const expected = structuredClone(before);
    if (before.id === 'ground-cumin') { expected.familyId = 'cumin'; expected.form = 'ground'; }
    if (before.id === 'masa-harina') expected.aliases = [...expected.aliases, 'corn masa flour'];
    assert(equal(decision.ingredient, expected), `Unexpected identity/price/recipe change: ${before.id}`);
  }
  const evidence = parseSources(read(`${packagePath}/source-evidence.json`));
  const selectedKeys = sorted([...new Set(pending.flatMap((d) => d.sourceRefs.map((ref) => ref.key)))]);
  assert(equal(sorted(evidence.records.map((r) => r.key)), selectedKeys), 'Evidence subset differs from proposed source assignments');
  for (const row of evidence.records) assert(row.disposition === 'candidate' && equal(row, sourceByKey.get(row.key)) && !catalog.sourceLinks.some((link) => link.key === row.key), `Ineligible or reused source: ${row.key}`);

  const currentReplay = curateCatalog({ ledger: active, sources, previous: catalog, version: catalog.catalogVersion, asOfDate: asOf });
  assert(equal(currentReplay.artifact, catalog) && currentReplay.report.publishable && !currentReplay.report.retainedApprovalsNeedReview.length && !currentReplay.report.stalePublishedLinks.length && !currentReplay.report.unapprovedQuarantines.length, 'Current source/approval replay failed');
  const preview = curateCatalog({ ledger: proposal, sources, previous: catalog, version: '2026-11-06.audit-preview', asOfDate: asOf });
  assert(equal(preview.artifact.ingredients, catalog.ingredients) && equal(preview.artifact.sourceLinks, catalog.sourceLinks) && equal(preview.artifact.compatibility, catalog.compatibility) && equal(preview.artifact.decisions, catalog.decisions), 'An unapproved proposal affected approved contents');
  assert(equal(sorted(preview.preview.ingredients.map((r) => r.id)), sorted(catalog.ingredients.map((r) => r.id))), 'Preview changes accepted IDs');
  // Ephemeral schema/source-assignment validation only. Neither this ledger nor
  // its artifact is written or installed; this is not a maintainer approval.
  const simulatedDecisions: CatalogDecision[] = proposal.decisions.map((d) => d.status === 'approved' ? d : { ...d, status: 'approved', review: { by: 'VALIDATION SIMULATION ONLY — NOT PRODUCT APPROVAL', date: asOf, payloadSha256: decisionHash(d) } });
  const simulation = curateCatalog({ ledger: { formatVersion: 1, decisions: simulatedDecisions }, sources, previous: catalog, version: '2026-11-06.audit-simulation', asOfDate: asOf });
  assert(simulation.report.publishable && equal(simulation.artifact.compatibility, catalog.compatibility), 'Proposed source assignment simulation failed');
  const replaySimulation = curateCatalog({ ledger: { formatVersion: 1, decisions: simulatedDecisions }, sources, previous: catalog, version: '2026-11-06.audit-simulation', asOfDate: asOf });
  assert(equal(simulation, replaySimulation), 'Proposed validation is not deterministic');

  const scoped = compileScopedRecipeUses(read('catalog/scoped-recipe-uses.json'), catalog.ingredients, CANONICAL_INGREDIENTS, MEAL_PREP_BLUEPRINTS);
  assert(equal(scoped.uses, runtime.scopedRecipeUses) && equal(scoped.contexts, runtime.scopedRecipeContexts), 'Compiled scoped uses differ from runtime');
  const marketAudit = read('catalog/market-link-audit.json');
  const marketCounts = validateMarketLinkAudit(marketAudit, catalog, runtime.recipeLinks, CANONICAL_INGREDIENTS, scoped.uses);
  validateMarketLinkAudit({ ...marketAudit, catalogHash: simulation.artifact.contentHash }, simulation.artifact, runtime.recipeLinks, CANONICAL_INGREDIENTS, scoped.uses);
  const ingredientMarkets = catalog.ingredients.map((ingredient) => ({ ingredientId: ingredient.id,
    directMarketIds: [...new Set([...(ingredient.recipeIngredientId ? [ingredient.recipeIngredientId] : []), ...runtime.recipeLinks.filter((r: { pantryIngredientId: string }) => r.pantryIngredientId === ingredient.id).map((r: { marketIngredientId: string }) => r.marketIngredientId)])],
    scopedUseIds: scoped.uses.filter((use) => use.pantryIngredientIds.includes(ingredient.id)).map((use) => use.id) }));
  const touchedMarketIds = new Set([...ingredientMarkets.flatMap((row) => row.directMarketIds), ...scoped.uses.filter((row) => row.pantryIngredientIds.length).map((row) => row.marketIngredientId)]);
  const unmatchedMarket = CANONICAL_INGREDIENTS.filter((item) => !touchedMarketIds.has(item.id)).map(({ id, name }) => ({ id, name, status: 'NO_APPROVED_PANTRY_COUNTERPART' }));

  const fixtureResults = (read('catalog/core-search-fixtures.json') as { query: string; expected: string[] }[]).map((fixture) => ({ ...fixture, actual: searchCookingCatalog(catalog.ingredients, fixture.query).map((r) => r.id).sort() }));
  assert(fixtureResults.every((r) => equal(sorted(r.expected), r.actual)), 'Active search fixture failed');
  const proposedFixtures = (read(`${packagePath}/search-fixtures.json`) as { query: string; expected: string[] }[]).map((fixture) => ({ ...fixture, previewActual: searchCookingCatalog(preview.preview.ingredients, fixture.query).map((r) => r.id).sort(), currentActual: searchCookingCatalog(catalog.ingredients, fixture.query).map((r) => r.id).sort() }));
  assert(proposedFixtures.every((r) => equal(sorted(r.expected), r.previewActual)), 'Proposed discovery fixture failed');
  const discoveryRows = catalog.ingredients.map((ingredient) => ({ ingredientId: ingredient.id, nameQueryFindsSelf: searchCookingCatalog(catalog.ingredients, ingredient.name).some((r) => r.id === ingredient.id), aliases: ingredient.aliases.map((query) => ({ query, findsSelf: searchCookingCatalog(catalog.ingredients, query).some((r) => r.id === ingredient.id) })) }));
  assert(discoveryRows.every((r) => r.nameQueryFindsSelf && r.aliases.every((a) => a.findsSelf)), 'A current identity or alias is undiscoverable');
  const familyQueries = ['beans', 'flour', 'rice', 'lentils', 'oats', 'barley', 'oil', 'broth', 'mustard', 'yogurt', 'milk', 'coriander', 'cardamom'];
  const broadQueries = familyQueries.map((query) => ({ query, currentIds: searchCookingCatalog(catalog.ingredients, query, 1000).map((r) => r.id), proposedIds: searchCookingCatalog(preview.preview.ingredients, query, 1000).map((r) => r.id) }));
  assert(broadQueries.every((r) => r.currentIds.length <= 12 && r.proposedIds.length <= 12), 'A required broad query relies on truncation');
  const variants = catalog.ingredients.filter((r) => r.parentIngredientId).map((r) => ({ ingredientId: r.id, parentId: r.parentIngredientId!, navigable: cookingCatalogVariants(catalog.ingredients, r.parentIngredientId!).some((child) => child.id === r.id) }));
  assert(variants.every((r) => r.navigable), 'Optional variant is unreachable');
  for (const ingredient of catalog.ingredients) {
    const entry: PantryEntry = { id: ingredient.id, ingredientId: ingredient.id, displayName: ingredient.name, available: true, quantity: 0, useByDate: '2000-01-01', revision: 1, updatedAtIso: '' };
    const actual = availableCookingIngredientIds([entry], catalog.ingredients, catalog.compatibility);
    const expected = sorted([...new Set([ingredient.id, ...catalog.compatibility.filter((edge) => edge.from === ingredient.id).map((edge) => edge.to)])]);
    assert(equal(actual, expected), `Unexpected availability: ${ingredient.id}`);
    assert(!availableCookingIngredientIds([entry, { ...entry, id: `no-${entry.id}`, available: false }], catalog.ingredients, catalog.compatibility).includes(ingredient.id), 'Exact No did not win');
    assert(availableCookingIngredientIds([{ ...entry, ingredientId: undefined }], catalog.ingredients, catalog.compatibility).length === 0, 'Custom text created ownership');
  }

  const triage = read('catalog/proposals/2026-10-31-follow-up-triage.json');
  assert(triage.sourceRelease === sources.releaseDate && triage.sourceSnapshotFileSha256 === fileHash(`${sourcePath}/source-records.json`), 'Original triage snapshot differs from audit source');
  const shortlist = triage.choices.map((choice: { proposedCookingChoice: string; sourceEvidence: CatalogSourceRecord }) => {
    assert(equal(sourceByKey.get(choice.sourceEvidence.key), choice.sourceEvidence), 'Shortlist evidence drifted');
    const links = catalog.sourceLinks.filter((link) => link.key === choice.sourceEvidence.key && link.fingerprint === choice.sourceEvidence.fingerprint);
    assert(links.length, `Unresolved original choice: ${choice.proposedCookingChoice}`);
    return { choice: choice.proposedCookingChoice, sourceKey: choice.sourceEvidence.key, ingredientIds: links.map((link) => link.ingredientId), purposes: [...new Set(links.map((link) => link.purpose))], status: 'APPROVED_AND_INTEGRATED' };
  });
  const hold = active.decisions.find((d) => d.id === 'hold-foundation-orphans-2026-10-29');
  assert(hold?.status === 'approved' && hold.exception, 'Quarantine hold requires approval and an owned exception');
  const holdException = hold.exception;
  assert(holdException.sourceReleaseDate === sources.releaseDate && holdException.reviewBy >= asOf, 'Quarantine hold needs renewed review');
  const quarantined = sources.records.filter((r) => r.disposition === 'quarantined');
  assert(equal(sorted(hold.sourceRefs.map((r) => r.key)), sorted(quarantined.map((r) => r.key))), 'Hold does not cover the exact quarantine set');
  const quarantineRows = quarantined.map((row) => {
    assert(hold.sourceRefs.some((ref) => ref.key === row.key && ref.fingerprint === row.fingerprint), 'Held source fingerprint drifted');
    assert(!catalog.sourceLinks.some((link) => link.key === row.key) && !pending.some((d) => d.sourceRefs.some((ref) => ref.key === row.key)), 'Quarantined source is assigned');
    const hints = sources.records.filter((candidate) => candidate.disposition === 'candidate' && normalizeDescription(candidate.description) === normalizeDescription(row.description));
    return { key: row.key, fingerprint: row.fingerprint, description: row.description, status: 'RETAIN_EXISTING_APPROVED_HOLD', hints: hints.map(({ key, fingerprint, dataType }) => ({ key, fingerprint, dataType, purpose: 'DESCRIPTION_HINT_NOT_IDENTITY_EQUIVALENCE' })) };
  });
  const scope = read(`${packagePath}/scope-deferrals.json`);
  assert(scope.retainedIngredientCount === catalog.ingredients.length && Array.isArray(scope.decisions), 'Scope review is stale');
  for (const row of scope.decisions as ScopeDecision[]) {
    const { status, payloadSha256, ...payload } = row;
    assert(status === 'proposed' && payloadSha256 === sha256(payload) && row.scope.length && row.owner && row.revisit, 'Unbound scope deferral');
  }
  assert(new Set(scope.decisions.map((row: ScopeDecision) => row.id)).size === scope.decisions.length, 'Duplicate scope deferral');
  const expansion = read(`${packagePath}/market-coverage-plan.json`);
  assert(expansion.baseCatalogHash === catalog.contentHash && expansion.marketCatalogHash === marketAudit.marketCatalogHash && expansion.sourceRelease === sources.releaseDate &&
    expansion.sourceSnapshotFileSha256 === fileHash(`${sourcePath}/source-records.json`) && expansion.direction.evidence === 'Close the coverage gaps before release (Recommended)', 'Market coverage direction or input evidence is stale');
  assert(scope.releaseIngredientCountFixed === false && scope.marketCoverageDirectionHash === sha256(expansion.direction), 'Scope deferrals contradict or omit the required market expansion');
  assert(equal(sorted(scope.decisions.map((row: ScopeDecision) => row.id)), sorted(['additional-bean-forms', 'additional-lentil-varieties', 'additional-rice-forms', 'additional-flour-choices', 'additional-preservation-and-variety-choices'])), 'Non-market scope review contains an unexpected deferral');
  const requiredMarketIds = sorted([...unmatchedMarket.map((r) => r.id), 'mushrooms-cremini-white', 'tomatoes-roma-vine', 'spinach-kale-greens']);
  assert(equal(sorted(expansion.groups.map((r: { marketIngredientId: string }) => r.marketIngredientId)), requiredMarketIds), 'Market expansion does not cover every unmatched/known-partial group');
  for (const group of expansion.groups as { marketIngredientId: string; matchKeywords: string[]; evidenceCandidates: (CatalogSourceRecord & { purpose: string })[]; blueprintUses: unknown }[]) {
    const market = CANONICAL_INGREDIENTS.find((item) => item.id === group.marketIngredientId);
    assert(market && equal(group.matchKeywords, market.matchKeywords), 'Market research omitted or changed triage keywords');
    for (const evidence of group.evidenceCandidates) {
      const { purpose, ...record } = evidence;
      assert(purpose === 'INVESTIGATION_ONLY_NOT_AN_APPROVED_SOURCE_ASSIGNMENT' && record.disposition === 'candidate' && equal(record, sourceByKey.get(record.key)), 'Market research evidence is stale or mislabelled');
    }
    const uses = MEAL_PREP_BLUEPRINTS.flatMap((b) => b.slots.filter((s) => [...s.candidateIngredientIds, ...s.lowCarbCandidateIds ?? []].includes(group.marketIngredientId)).map((s) => ({ recipeId: b.id, slotKey: s.slotKey, slotLabel: s.label })));
    assert(equal(uses, group.blueprintUses), 'Market expansion blueprint inventory is incomplete');
  }

  const retainedViews = runtime.retainedCatalogs.map((view: { version: string; ingredients: unknown; compatibility: unknown }) => {
    const previous = parseArtifact(read(`catalog/releases/${view.version}/catalog.json`));
    assert(equal(view.ingredients, previous.ingredients) && equal(view.compatibility, previous.compatibility), 'Retained presentation view drifted');
    assert(previous.ingredients.every((r) => catalog.ingredients.some((current) => current.id === r.id)), 'Accepted historical identity was removed');
    return { version: view.version, ingredientCount: previous.ingredients.length, exact: true };
  });
  const migrationFiles = ['20261108153507_pantry_legumes_grains_flours.sql', '20261108153510_pantry_vegetables_aromatics.sql', '20261108153514_pantry_staples_proteins.sql', '20261108153517_pantry_spice_forms.sql', '20261108153525_pantry_remaining_vegetables.sql'];
  const migrations = migrationFiles.map((file) => {
    const sql = readFileSync(`supabase/migrations/${file}`, 'utf8');
    const ids = [...sql.matchAll(/\('([a-z0-9-]+)'\)/g)].map((match) => match[1]);
    assert(ids.length && /on conflict do nothing/i.test(sql) && !/\b(delete|truncate|update)\s+(?:from\s+)?public\./i.test(sql), 'Migration is not additive');
    return { file, ids, fileSha256: fileHash(`supabase/migrations/${file}`), hostedApplication: 'NOT_VERIFIED_BY_THIS_AUDIT' };
  });
  const previousIds = new Set(parseArtifact(read('catalog/releases/2026-10-30.1/catalog.json')).ingredients.map((r) => r.id));
  const addedIds = catalog.ingredients.filter((r) => !previousIds.has(r.id)).map((r) => r.id);
  assert(equal(sorted(migrations.flatMap((r) => r.ids)), sorted(addedIds)), 'Expansion migrations do not exactly match new accepted IDs');

  const rows = catalog.ingredients.map((ingredient) => {
    const links = catalog.sourceLinks.filter((link) => link.ingredientId === ingredient.id);
    const assessment = assessments.find((r) => r.ingredientId === ingredient.id);
    return { ingredientId: ingredient.id, name: ingredient.name, currentIngredientSha256: sha256(ingredient),
      provenanceStatus: links.length ? links.some((link) => link.purpose === 'identity') ? 'APPROVED_IDENTITY_EVIDENCE' : 'APPROVED_GENERAL_REFERENCE_ONLY' : assessment!.status,
      sourceLinks: links, proposedDecisionId: pendingByIngredient.get(ingredient.id)?.id ?? null,
      ...(assessment ? { dispositionPayloadSha256: assessment.payloadSha256 } : {}), market: ingredientMarkets.find((row) => row.ingredientId === ingredient.id) };
  });
  const counts = { ingredients: catalog.ingredients.length, approvedIngredientDecisions: catalog.decisions.length, sourceLinkedIdentities: hasSource.size,
    identityLinks: catalog.sourceLinks.filter((r) => r.purpose === 'identity').length, generalReferenceLinks: catalog.sourceLinks.filter((r) => r.purpose === 'general-reference').length,
    withoutSourceLinks: gaps.length, approvedCuratedRetentions: assessments.filter((r) => r.status === 'APPROVED_CURATED_RETAINED').length,
    proposedSourceUpdates: pending.filter((r) => r.sourceKind === 'USDA').length, proposedCuratedRetentions: pending.filter((r) => r.sourceKind === 'CURATED').length,
    proposedDecisions: pending.length, sourceEvidenceRows: evidence.records.length, originalResearchChoicesResolved: shortlist.length,
    marketLinkedPantryIdentities: marketCounts.linked, noMarketCounterpart: marketCounts.noMarketItem, marketGroupsWithPantryCounterparts: touchedMarketIds.size,
    marketGroupsWithoutPantryCounterparts: unmatchedMarket.length, scopedRecipeUses: scoped.uses.length, quarantined: quarantined.length,
    activeSearchFixtures: fixtureResults.length, proposedSearchFixtures: proposedFixtures.length, aliasesChecked: discoveryRows.reduce((n, r) => n + r.aliases.length, 0), proposedScopeDeferrals: scope.decisions.length,
    marketGroupsRequiringExpansion: expansion.groups.length, partiallyCoveredMarketGroups: expansion.groups.filter((r: { coverage: string }) => r.coverage === 'PARTIAL_NAMED_MEMBER_COVERAGE').length, keywordQualificationFindings: expansion.keywordQualificationFindings.length };
  const report = { formatVersion: 1, status: 'AUDIT_COMPLETE_RELEASE_WORK_REQUIRED', asOfDate: asOf, catalogVersion: catalog.catalogVersion, catalogHash: catalog.contentHash,
    counts, inputHashes: { sourceSnapshotFileSha256: fileHash(`${sourcePath}/source-records.json`), sourceManifestHash: sha256(discovery.source), activeLedgerHash: sha256(active), proposalLedgerHash: sha256(proposal), assessmentsHash: sha256(assessmentsFile), selectedEvidenceHash: sha256(evidence), scopeDeferralsHash: sha256(scope), marketCoveragePlanHash: sha256(expansion), runtimeHash: sha256(runtime), marketAuditHash: sha256(marketAudit), auditCodeFileSha256: fileHash('scripts/audit-cooking-catalog.ts') },
    checks: { activeApprovalSourceReplay: 'passed', priorApprovalsPreserved: true, currentRuntimeUnchanged: true, allProvenanceGapsAssessed: true, noNewIdentityOrPriceOrRecipeChanges: true,
      proposedExceptions: ['Masa harina gains corn masa flour alias; broad flour results increase from 10 to 11', 'Ground cumin gains explicit cumin family/ground form metadata and family-only USDA reference'],
      fullMarketApplicabilityAudit: 'passed', allOriginalResearchChoicesIntegrated: true, quarantineHoldStillValid: true, noQuarantinedSourceAssigned: true,
      allNameAndAliasQueriesReachable: true, requiredBroadQueriesDoNotTruncate: true, optionalVariantsReachable: true, exactAvailabilityNoAndCustomBoundaries: true,
      proposedSourceAssignmentSimulation: 'passed — validation only, not approval', deterministicSimulationReplay: true, acceptedIdsUnchanged: true },
    projectedAfterApproval: { scope: 'Existing 145 identities only; excludes the required market-coverage expansion', validationOnly: true, notPublished: true, contentHash: simulation.artifact.contentHash, ingredients: simulation.artifact.ingredients.length,
      sourceLinkedIdentities: new Set(simulation.artifact.sourceLinks.map((r) => r.ingredientId)).size, identityLinks: simulation.artifact.sourceLinks.filter((r) => r.purpose === 'identity').length,
      generalReferenceLinks: simulation.artifact.sourceLinks.filter((r) => r.purpose === 'general-reference').length, curatedWithoutLinks: simulation.artifact.ingredients.length - new Set(simulation.artifact.sourceLinks.map((r) => r.ingredientId)).size },
    marketCoverageDirection: expansion.direction,
    remainingGates: ['Maintainer review of 53 exact existing-ingredient provenance/curation decisions and five non-market category deferrals', 'Required counterpart expansion for 15 unmatched and three partial market groups, including exact identity/granularity/source/recipe review', 'Resolve broad keyword qualification before claiming precise food/variety/form coverage', 'Integrate unchanged approved payloads and refresh final artifact/audit hashes', 'Hosted migration/environment verification and release documentation/versioning', 'Release PR, production checks, release publication and milestone closure'] };
  const outputs: Record<string, unknown> = {
    'audit.json': report, 'ingredient-audit.json': { catalogHash: catalog.contentHash, rows },
    'shortlist-closure.json': { originalTriageHash: sha256(triage), choices: shortlist },
    'quarantine-review.json': { sourceRelease: sources.releaseDate, holdDecisionId: hold.id, holdPayloadSha256: decisionHash(hold), approval: hold.review, owner: holdException.owner, reviewBy: holdException.reviewBy,
      newApprovalRequiredForUnchangedHold: false, counts: { held: quarantineRows.length, withFoundationHints: quarantineRows.filter((r) => r.hints.some((h) => h.dataType === 'foundation_food')).length, withOnlySrHints: quarantineRows.filter((r) => r.hints.length && !r.hints.some((h) => h.dataType === 'foundation_food')).length, withoutCandidateDescriptionHint: quarantineRows.filter((r) => !r.hints.length).length }, records: quarantineRows },
    'discovery-review.json': { fixtureResults, proposedFixtures, directDiscovery: discoveryRows, broadQueries, variants, note: 'Flour/Masa discovery changes remain proposed. A search result never establishes ownership.' },
    'market-review.json': { marketCatalogHash: marketAudit.marketCatalogHash, counts: marketCounts, marketGroupsWithPantryCounterparts: touchedMarketIds.size, ingredientRelationships: ingredientMarkets, marketGroupsWithoutPantryCounterparts: unmatchedMarket,
      note: 'Counterpart availability does not claim all live offers or hosted environments were validated. Existing compound groups remain distinct from pantry identity; scoped use and title admission are separately reviewed.' },
    'market-expansion-review.json': expansion,
    'rollout-readiness.json': { migrations, retainedViews, baselineVersion: runtime.rollbackVersion, baselineIdentityCount: runtime.rollbackIngredientIds.length, acceptedCurrentIds: catalog.ingredients.map((r) => r.id), additionalMigrationRequiredByProposal: false, hostedVerified: false, productionReleased: false },
  };
  const output = resolve(values.output);
  const inputs = [resolve(packagePath), sourcePath, resolve('catalog/releases'), resolve('src'), resolve('scripts')];
  assert(!inputs.some((path) => output === path || path.startsWith(`${output}/`) || output.startsWith(`${path}/`)), 'Output must be separate from review/source/runtime inputs');
  if (values.check) {
    for (const [name, value] of Object.entries(outputs)) assert(equal(read(`${output}/${name}`), value), `Stale audit output: ${name}`);
  } else {
    assert(!existsSync(output), 'Use a new output directory; audit/review work is never overwritten');
    const staging = `${output}.tmp-${process.pid}`;
    mkdirSync(staging, { recursive: true });
    try {
      for (const [name, value] of Object.entries(outputs)) writeFileSync(`${staging}/${name}`, JSON.stringify(value, null, 2) + '\n');
      writeFileSync(`${staging}/run-envelope.json`, JSON.stringify({ generatedAtIso: new Date().toISOString(), auditHash: sha256(report), published: false, authority: 'Research/validation only; no maintainer approval or hosted activation' }, null, 2) + '\n');
      renameSync(staging, output);
    } finally { rmSync(staging, { recursive: true, force: true }); }
  }
  console.log(JSON.stringify({ output, status: report.status, checksPassed: true, counts, currentCatalogChanged: false, published: false }));
}
run();
