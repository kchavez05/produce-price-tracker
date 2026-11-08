import { strict as assert } from 'node:assert';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { CANONICAL_INGREDIENTS } from '../src/data/canonical-ingredients';
import { MEAL_PREP_BLUEPRINTS } from '../src/data/meal-prep-blueprints';
import { availableCookingIngredientIds, cookingCatalogVariants, searchCookingCatalog } from '../src/lib/pantry/catalog-search';
import { PantryEntry } from '../src/types/pantry';
import { curateCatalog, decisionHash, parseArtifact, parseLedger, parseSources, sha256 } from './lib/catalog-curation';
import { compileExactQualifications, compileMarketCounterparts } from './lib/market-coverage-approvals';
import { compileScopedRecipeUses } from './lib/scoped-recipe-uses';
import { validateMarketLinkAudit } from './lib/market-link-audit';

// This audits the integrated release. The earlier proposal audit remains reproducible
// at its research commit and must not be rewritten as if it had approved new choices.
const version = '2026-11-07.4';
const read = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
const fileHash = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex');
const same = (a: unknown, b: unknown, message: string) => assert.equal(sha256(a), sha256(b), message);
const sorted = (ids: string[]) => [...ids].sort();

function run() {
  const { values } = parseArgs({ options: { review: { type: 'string' }, output: { type: 'string' }, 'as-of': { type: 'string' }, hosted: { type: 'string' }, check: { type: 'boolean', default: false } } });
  assert(values.review && values.output && values['as-of'] && values.hosted, '--review, --output, --as-of and --hosted are required');
  const asOf = values['as-of'];
  assert(/^\d{4}-\d{2}-\d{2}$/.test(asOf) && new Date(asOf).toISOString().slice(0, 10) === asOf, 'Invalid audit date');
  const catalog = parseArtifact(read(`catalog/releases/${version}/catalog.json`));
  const ledger = parseLedger(read('catalog/curation-ledger.json'));
  const runtime = read('src/data/cooking-catalog.json');
  const sourcePath = `${values.review}/source-records.json`;
  const sources = parseSources(read(sourcePath)), sourceReport = read(`${values.review}/report.json`);
  assert.equal(sourceReport.source.releaseDate, sources.releaseDate);
  assert.equal(sourceReport.rulesVersion, sources.rulesVersion);
  for (const kind of ['foundation_food', 'sr_legacy_food']) assert.equal(sourceReport.counts.foodRowsByType[kind], sources.records.filter((r) => r.dataType === kind).length);
  assert.equal(runtime.catalogVersion, version);
  same(runtime.ingredients, catalog.ingredients, 'Runtime ingredient drift');
  same(runtime.compatibility, catalog.compatibility, 'Runtime coverage drift');
  assert.equal(runtime.contentHash, catalog.contentHash);
  const history = new Map(catalog.decisions.map((d) => [`${d.id}:${d.revision}`, d.payloadSha256]));
  assert.equal(history.size, ledger.decisions.length);
  for (const d of ledger.decisions) assert(d.status === 'approved' && history.get(`${d.id}:${d.revision}`) === decisionHash(d), 'Unapproved or stale curation decision');
  const options = { ledger, sources, previous: catalog, version, asOfDate: asOf };
  const replay = curateCatalog(options);
  same(replay.artifact, catalog, 'Full-source replay changed the release');
  same(replay, curateCatalog(options), 'Replay is not deterministic');
  assert(replay.report.publishable && !replay.report.retainedApprovalsNeedReview.length && !replay.report.stalePublishedLinks.length && !replay.report.unapprovedQuarantines.length, 'Source approval needs review');

  const coverage = read('catalog/market-coverage-approvals.json');
  const packets = ['2026-11-07-market-produce', '2026-11-07-market-proteins', '2026-11-07-market-dairy', '2026-11-07-final-qualification'];
  assert.equal(coverage.approvals.length, packets.length);
  for (const [index, packet] of packets.entries()) {
    const envelope = read(`catalog/proposals/${packet}/review-envelope.json`), batch = coverage.approvals[index];
    same(batch.envelope, envelope, 'Approval envelope drift');
    assert.equal(batch.review.payloadSha256, sha256(envelope));
    assert(batch.review.by && batch.review.date <= asOf, 'Missing real approval');
    assert.equal(envelope.sourceSnapshotFileSha256, fileHash(sourcePath), 'Snapshot changed since approval');
    for (const [file, hash] of Object.entries(envelope.fileHashes)) assert.equal(sha256(read(`catalog/proposals/${packet}/${file}`)), hash, `Frozen payload changed: ${packet}/${file}`);
  }
  const counterparts = compileMarketCounterparts(coverage, catalog.ingredients, CANONICAL_INGREDIENTS);
  const scoped = compileScopedRecipeUses(read('catalog/scoped-recipe-uses.json'), catalog.ingredients, CANONICAL_INGREDIENTS, MEAL_PREP_BLUEPRINTS, coverage);
  const exact = compileExactQualifications(coverage, catalog.ingredients, CANONICAL_INGREDIENTS, MEAL_PREP_BLUEPRINTS);
  same(counterparts, runtime.marketCounterparts, 'Counterpart drift');
  same(scoped.uses, runtime.scopedRecipeUses, 'Scoped recipe drift');
  same(scoped.contexts, runtime.scopedRecipeContexts, 'Recipe method context drift');
  same(exact.qualifications, runtime.exactOfferQualifications, 'Exact gate drift');
  same(exact.exclusions, runtime.exactRecipeExclusions, 'Exclusion drift');
  const marketCounts = validateMarketLinkAudit(read('catalog/market-link-audit.json'), catalog, runtime.recipeLinks, CANONICAL_INGREDIENTS, scoped.uses, counterparts);
  const ingredientMarkets = catalog.ingredients.map((i) => ({ ingredientId: i.id,
    directMarketIds: [...new Set([...(i.recipeIngredientId ? [i.recipeIngredientId] : []), ...runtime.recipeLinks.filter((r: { pantryIngredientId: string }) => r.pantryIngredientId === i.id).map((r: { marketIngredientId: string }) => r.marketIngredientId)])],
    counterpartMarketIds: counterparts.filter((r) => r.pantryIngredientId === i.id).map((r) => r.marketIngredientId), scopedUseIds: scoped.uses.filter((r) => r.pantryIngredientIds.includes(i.id)).map((r) => r.id) }));
  const marketIds = new Set([...ingredientMarkets.flatMap((i) => [...i.directMarketIds, ...i.counterpartMarketIds]), ...scoped.uses.map((r) => r.marketIngredientId)]);
  const unmatched = CANONICAL_INGREDIENTS.filter((i) => !marketIds.has(i.id));
  assert.equal(unmatched.length, 0, 'Market association gap reopened');

  const fixtures = read('catalog/core-search-fixtures.json') as { query: string; expected: string[] }[];
  const fixtureResults = fixtures.map((f) => ({ ...f, actual: sorted(searchCookingCatalog(catalog.ingredients, f.query).map((r) => r.id)) }));
  for (const f of fixtureResults) same(sorted(f.expected), f.actual, `Discovery fixture: ${f.query}`);
  const discoveryRows = catalog.ingredients.map((i) => ({ ingredientId: i.id, queries: [i.name, ...i.aliases].map((query) => ({ query, findsSelf: searchCookingCatalog(catalog.ingredients, query).some((r) => r.id === i.id) })), optionalNavigable: !i.parentIngredientId || cookingCatalogVariants(catalog.ingredients, i.parentIngredientId).some((r) => r.id === i.id) }));
  assert(discoveryRows.every((r) => r.optionalNavigable && r.queries.every((q) => q.findsSelf)), 'Unreachable identity/alias/optional variety');
  const broadQueries = ['beans', 'flour', 'rice', 'lentils', 'oats', 'barley', 'oil', 'broth', 'mustard', 'yogurt', 'milk', 'coriander', 'cardamom', 'cheese', 'mozzarella', 'Greek yogurt', 'tofu'].map((query) => ({ query, ids: searchCookingCatalog(catalog.ingredients, query, 1000).map((r) => r.id) }));
  assert(broadQueries.every((r) => r.ids.length <= 12), 'Broad discovery relies on truncation');
  for (const i of catalog.ingredients) {
    const entry: PantryEntry = { id: i.id, ingredientId: i.id, displayName: i.name, available: true, quantity: 0, useByDate: '2000-01-01', revision: 1, updatedAtIso: '' };
    same(availableCookingIngredientIds([entry], catalog.ingredients, catalog.compatibility), sorted([...new Set([i.id, ...catalog.compatibility.filter((r) => r.from === i.id).map((r) => r.to)])]), `Coverage drift: ${i.id}`);
    assert(!availableCookingIngredientIds([entry, { ...entry, id: `no-${i.id}`, available: false }], catalog.ingredients, catalog.compatibility).includes(i.id));
    assert.equal(availableCookingIngredientIds([{ ...entry, ingredientId: undefined }], catalog.ingredients, catalog.compatibility).length, 0, 'Custom text established ownership');
  }

  const triage = read('catalog/proposals/2026-10-31-follow-up-triage.json');
  assert.equal(triage.sourceSnapshotFileSha256, fileHash(sourcePath));
  const shortlist = triage.choices.map((choice: { proposedCookingChoice: string; sourceEvidence: { key: string; fingerprint: string } }) => {
    const source = sources.records.find((r) => r.key === choice.sourceEvidence.key);
    same(source, choice.sourceEvidence, 'Original shortlist evidence drift');
    const links = catalog.sourceLinks.filter((r) => r.key === source!.key && r.fingerprint === source!.fingerprint);
    assert(links.length, `Unresolved research choice: ${choice.proposedCookingChoice}`);
    return { choice: choice.proposedCookingChoice, ingredientIds: links.map((r) => r.ingredientId), status: 'APPROVED_AND_INTEGRATED' };
  });
  const hold = ledger.decisions.find((d) => d.id === 'hold-foundation-orphans-2026-10-29');
  assert(hold?.status === 'approved' && hold.exception && hold.exception.reviewBy >= asOf && hold.exception.sourceReleaseDate === sources.releaseDate);
  const held = sources.records.filter((r) => r.disposition === 'quarantined');
  same(sorted(held.map((r) => r.key)), sorted(hold.sourceRefs.map((r) => r.key)), 'Quarantine scope drift');
  for (const r of held) assert(hold.sourceRefs.some((ref) => ref.key === r.key && ref.fingerprint === r.fingerprint) && !catalog.sourceLinks.some((link) => link.key === r.key), 'Held source assigned or changed');
  const scope = coverage.approvals[3].scopeDeferrals;
  assert.equal(scope.retainedIngredientCount, catalog.ingredients.length);
  assert.equal(scope.decisions.length, 5);

  const retainedViews = runtime.retainedCatalogs.map((v: { version: string; ingredients: unknown; compatibility: unknown }) => {
    const a = parseArtifact(read(v.version === 'baseline-1.5.2' ? 'catalog/baseline-1.5.2.json' : `catalog/releases/${v.version}/catalog.json`));
    same(v.ingredients, a.ingredients, 'Historical presentation changed');
    same(v.compatibility, a.compatibility, 'Historical coverage changed');
    assert(a.ingredients.every((i) => catalog.ingredients.some((r) => r.id === i.id)), 'Historical ID removed');
    return { version: v.version, ingredientCount: a.ingredients.length, exact: true };
  });
  const baseline = parseArtifact(read('catalog/releases/2026-10-30.1/catalog.json'));
  const migrations = readdirSync('supabase/migrations').filter((f) => /pantry_(?:legumes|vegetables|staples|spice|remaining|market)_/.test(f)).sort().map((file) => {
    const sql = readFileSync(`supabase/migrations/${file}`, 'utf8');
    const ids = [...sql.matchAll(/\('([a-z0-9-]+)'\)/g)].map((r) => r[1]);
    assert(ids.length && /on conflict do nothing/i.test(sql) && !/\b(delete|truncate|update)\s+(?:from\s+)?public\./i.test(sql), 'Non-additive accepted-ID migration');
    return { file, name: file.replace(/^\d+_/, '').replace(/\.sql$/, ''), ids, fileSha256: fileHash(`supabase/migrations/${file}`) };
  });
  same(sorted(migrations.flatMap((r) => r.ids)), sorted(catalog.ingredients.filter((r) => !baseline.ingredients.some((i) => i.id === r.id)).map((r) => r.id)), 'Migration IDs differ from additions');
  const hosted = read(values.hosted);
  assert(hosted.observedOn <= asOf && hosted.observedOn >= '2026-11-08' && hosted.hostedMutationsPerformed === false);
  assert(Array.isArray(hosted.acceptedIds) && hosted.acceptedIds.every((id: unknown) => typeof id === 'string') && new Set(hosted.acceptedIds).size === hosted.acceptedIds.length);
  const missingIds = catalog.ingredients.filter((i) => !hosted.acceptedIds.includes(i.id)).map((i) => i.id);
  const pendingMigrations = migrations.filter((m) => !hosted.installedMigrations.some((r: { name: string }) => r.name === m.name));
  const hostedReady = missingIds.length === 0 && pendingMigrations.length === 0 && hosted.authenticatedClientVerification === 'PASSED' && hosted.secondClientVerification === 'PASSED';
  const ingredientRows = catalog.ingredients.map((i) => {
    const links = catalog.sourceLinks.filter((r) => r.ingredientId === i.id);
    const decision = [...ledger.decisions].reverse().find((d) => d.ingredient?.id === i.id);
    assert(decision, 'Ingredient has no approval disposition');
    return { ingredientId: i.id, name: i.name, ingredientHash: sha256(i), provenance: links.some((r) => r.purpose === 'identity') ? 'APPROVED_IDENTITY_EVIDENCE' : links.length ? 'APPROVED_GENERAL_REFERENCE_ONLY' : 'APPROVED_CURATED_WITHOUT_SOURCE_LINK', decisionId: decision.id, decisionHash: decisionHash(decision), rationale: decision.rationale, sourceLinks: links, market: ingredientMarkets.find((r) => r.ingredientId === i.id) };
  });
  const counts = { ingredients: catalog.ingredients.length, approvedDecisions: ledger.decisions.length, sourceLinkedIdentities: ingredientRows.filter((r) => r.sourceLinks.length).length, identityLinks: catalog.sourceLinks.filter((r) => r.purpose === 'identity').length, generalReferenceLinks: catalog.sourceLinks.filter((r) => r.purpose === 'general-reference').length, curatedWithoutLinks: ingredientRows.filter((r) => !r.sourceLinks.length).length, marketLinkedIdentities: marketCounts.linked, noMarketItem: marketCounts.noMarketItem, marketGroups: marketIds.size, unmatchedMarketGroups: unmatched.length, counterparts: counterparts.length, scopedUses: scoped.uses.length, protectedMixedGroups: runtime.protectedRecipeMarketIds.length, exactOfferGates: exact.qualifications.length, narrowRecipeExclusions: exact.exclusions.length, approvedScopeBoundaries: scope.decisions.length, originalResearchChoicesResolved: shortlist.length, searchFixtures: fixtures.length, aliases: catalog.ingredients.reduce((n, i) => n + i.aliases.length, 0), heldSources: held.length, historicalViews: retainedViews.length, hostedAcceptedIds: hosted.acceptedIds.length, missingHostedIds: missingIds.length, pendingHostedMigrations: pendingMigrations.length };
  const report = { formatVersion: 1, status: hostedReady ? 'LOCAL_AUDIT_PASSED_RELEASE_WORK_REQUIRED' : 'LOCAL_AUDIT_PASSED_HOSTED_ROLLOUT_REQUIRED', asOfDate: asOf, catalogVersion: version, catalogContentHash: catalog.contentHash, counts,
    hashes: { runtime: sha256(runtime), runtimeFileSha256: fileHash('src/data/cooking-catalog.json'), sourceSnapshotFileSha256: fileHash(sourcePath), ledger: sha256(ledger), coverageApprovals: sha256(coverage), blueprints: sha256(MEAL_PREP_BLUEPRINTS), hostedEvidence: sha256(hosted), auditCodeFileSha256: fileHash('scripts/audit-release-catalog.ts') },
    checks: { deterministicFullSourceReplay: true, everyDecisionApprovedAndBound: true, everyFrozenMarketPacketHashVerified: true, fullMarketApplicability: true, allReviewedMarketGroupsHaveCounterpartPaths: true, allOriginalChoicesResolved: true, allDiscoveryAndOptionalChoicesReachable: true, broadQueriesUntruncated: true, exactNoAndCustomIsolation: true, heldSourcesUnchangedAndUnassigned: true, allHistoricalViewsExact: true, additiveMigrationIdsExactlyMatch150Additions: true, qualificationsAndNarrowExclusionsCompiled: true, fiveScopeBoundariesExplicitlyApproved: true },
    hostedReady, productionReleased: false, remainingGates: ['Apply and verify the eight additive accepted-ID migrations on the intended hosted database', 'Fresh authenticated-client persistence and second-client checks on the staged release', 'Version/release documentation, release PR CI/Preview/Codex review, production verification, tag/release and milestone closure'] };
  const outputs = { 'audit.json': report, 'ingredient-audit.json': { catalogContentHash: catalog.contentHash, rows: ingredientRows }, 'discovery-review.json': { fixtureResults, directDiscovery: discoveryRows, broadQueries }, 'market-review.json': { counts: marketCounts, ingredientRelationships: ingredientMarkets, unmatchedMarketGroups: unmatched, exactQualifications: exact.qualifications, narrowExclusions: exact.exclusions, note: 'Reviewed counterpart paths do not assert universal live-offer or recipe compatibility.' }, 'shortlist-closure.json': { choices: shortlist }, 'quarantine-review.json': { sourceRelease: sources.releaseDate, holdDecisionId: hold.id, holdHash: decisionHash(hold), approval: hold.review, owner: hold.exception.owner, reviewBy: hold.exception.reviewBy, records: held.map(({ key, fingerprint }) => ({ key, fingerprint })) }, 'scope-closure.json': { approval: coverage.approvals[3].review, scopeHash: sha256(scope), decisions: scope.decisions }, 'rollout-readiness.json': { observedOn: hosted.observedOn, projectRef: hosted.projectRef, environment: hosted.environment, migrations, pendingMigrations: pendingMigrations.map((r) => r.file), missingHostedIds: missingIds, retainedViews, hostedReady, authenticatedClientVerification: hosted.authenticatedClientVerification, secondClientVerification: hosted.secondClientVerification, hostedMutationsPerformed: false, note: 'Migration history names are compared because existing hosted base migrations have different timestamps. Accepted-ID readiness is checked independently.' } };
  const output = resolve(values.output);
  for (const input of ['catalog/releases', 'catalog/proposals', values.review, values.hosted, 'src', 'scripts'].map((p) => resolve(p))) assert(output !== input && !output.startsWith(`${input}/`) && !input.startsWith(`${output}/`), 'Output overlaps an input');
  if (values.check) for (const [name, data] of Object.entries(outputs)) same(read(`${output}/${name}`), data, `Stale audit: ${name}`);
  else {
    assert(!existsSync(output), 'Use a new audit output directory');
    const staging = `${output}.tmp-${process.pid}`;
    mkdirSync(staging, { recursive: true });
    try { for (const [name, data] of Object.entries(outputs)) writeFileSync(`${staging}/${name}`, JSON.stringify(data, null, 2) + '\n'); renameSync(staging, output); }
    finally { rmSync(staging, { recursive: true, force: true }); }
  }
  console.log(JSON.stringify({ status: report.status, counts, hostedReady, productionReleased: false }));
}
run();
