import { mkdirSync, readFileSync, renameSync, existsSync, writeFileSync, rmSync, realpathSync } from 'node:fs';
import { basename, dirname, resolve, relative, isAbsolute, join, sep } from 'node:path';
import { parseArgs } from 'node:util';
import { randomUUID } from 'node:crypto';
import { curateCatalog, decisionHash, parseArtifact, parseLedger, parseSources, sha256, stableJson } from './lib/catalog-curation';
import { searchCookingCatalog } from '../src/lib/pantry/catalog-search';

const auditEnvelope = { runId: randomUUID(), startedAtIso: new Date().toISOString(), importer: 'catalog-curation-v1', published: false };

function load(path: string) { return JSON.parse(readFileSync(path, 'utf8')) as unknown; }
function loadReview(path: string) {
  const rawSources = load(join(path, 'source-records.json')); const sources = parseSources(rawSources);
  const report = load(join(path, 'report.json'));
  if (!report || typeof report !== 'object' || !('source' in report) || !report.source || typeof report.source !== 'object' || !('releaseDate' in report.source) || report.source.releaseDate !== sources.releaseDate || !('rulesVersion' in report) || report.rulesVersion !== sources.rulesVersion || !('counts' in report) || !report.counts || typeof report.counts !== 'object' || !('foodRowsByType' in report.counts) || !report.counts.foodRowsByType || typeof report.counts.foodRowsByType !== 'object') throw new Error('Discovery source manifest/rules do not match the source-record snapshot');
  const counts = report.counts.foodRowsByType as Record<string, unknown>;
  for (const kind of ['foundation_food', 'sr_legacy_food']) {
    const expected = counts[kind] ?? 0;
    if (!Number.isSafeInteger(expected) || expected !== sources.records.filter((record) => record.dataType === kind).length) throw new Error(`Source row count does not reconcile for ${kind}`);
  }
  return { rawSources, sources, manifest: report.source };
}
function canonicalPath(path: string): string {
  let ancestor = resolve(path); const suffix: string[] = [];
  while (!existsSync(ancestor)) { suffix.unshift(basename(ancestor)); ancestor = dirname(ancestor); }
  return join(realpathSync(ancestor), ...suffix);
}
function nested(path: string, parent: string) {
  const difference = relative(parent, path);
  return difference === '' || difference !== '..' && !difference.startsWith(`..${sep}`) && !isAbsolute(difference);
}
function run() {
  const { values } = parseArgs({ options: {
    review: { type: 'string' }, ledger: { type: 'string' }, previous: { type: 'string' },
    'previous-review': { type: 'string' }, output: { type: 'string' }, version: { type: 'string' },
    fixtures: { type: 'string' }, 'decision-hashes': { type: 'boolean', default: false },
  } });
  if (!values.ledger) throw new Error('--ledger is required');
  const ledger = parseLedger(load(resolve(values.ledger)));
  if (values['decision-hashes']) {
    process.stdout.write(JSON.stringify(ledger.decisions.map((decision) => ({ id: decision.id, revision: decision.revision, payloadSha256: decisionHash(decision) })), null, 2) + '\n');
    return;
  }
  if (!values.review || !values.previous || !values.output || !values.version || !values.fixtures) throw new Error('--review, --previous, --output, --version, and --fixtures are required');
  const review = canonicalPath(values.review); const output = canonicalPath(values.output);
  const protectedPaths = [review, resolve(values.ledger), resolve(values.previous), ...(values.fixtures ? [resolve(values.fixtures)] : []), ...(values['previous-review'] ? [resolve(values['previous-review'])] : [])];
  if (existsSync(output) || protectedPaths.some((path) => nested(output, canonicalPath(path)) || nested(canonicalPath(path), output))) throw new Error('Use a new output directory separate from all input files/directories. Existing review work is never overwritten.');
  const { rawSources, sources, manifest } = loadReview(review); const previous = parseArtifact(load(resolve(values.previous)));
  const result = curateCatalog({ ledger, sources, previous, version: values.version, asOfDate: new Date().toISOString().slice(0, 10),
    ...(values['previous-review'] ? { previousSources: loadReview(resolve(values['previous-review'])).sources } : {}) });
  const fixtureResults: { query: string; expected: string[]; actual: string[]; passed: boolean; approvedActual: string[]; approvedPassed: boolean }[] = [];
  if (values.fixtures) {
    const fixtures = load(resolve(values.fixtures));
    if (!Array.isArray(fixtures) || fixtures.length === 0) throw new Error('Search fixtures must be a nonempty array');
    for (const fixture of fixtures) {
      if (!fixture || typeof fixture !== 'object' || !('query' in fixture) || typeof fixture.query !== 'string' || !('expected' in fixture) || !Array.isArray(fixture.expected) || !fixture.expected.every((value: unknown) => typeof value === 'string')) throw new Error('Invalid search fixture');
      const actual = searchCookingCatalog(result.preview.ingredients, fixture.query).map((r) => r.id).sort();
      const expected = [...fixture.expected].sort();
      const approvedActual = searchCookingCatalog(result.artifact.ingredients, fixture.query).map((r) => r.id).sort();
      fixtureResults.push({ query: fixture.query, expected, actual, passed: stableJson(expected) === stableJson(actual), approvedActual, approvedPassed: stableJson(expected) === stableJson(approvedActual) });
    }
  }
  const ready = result.report.publishable && fixtureResults.every((r) => r.passed && r.approvedPassed);
  const report = { ...result.report, publishable: ready, fixtureScope: 'PREVIEW_AND_APPROVED', fixtureResults,
    activation: 'Separate product approval, catalog migration, client compatibility, staging, and release gates are required.' };
  const proposalDecisions = ledger.decisions.filter((d) => d.status === 'proposed' && d.ingredient);
  const lines = ['# Cooking catalog curation review', '', `Staging version: ${values.version}. Parent: ${previous.catalogVersion}.`, '',
    `Approved artifact: ${result.artifact.ingredients.length} ingredients. Unapproved preview: ${result.preview.ingredients.length} ingredients.`,
    `Source validation/publication status: ${result.report.publishable ? 'passed (staging only)' : 'BLOCKED — review changed/missing evidence or quarantine exceptions'}.`,
    `Proposed decisions: ${report.decisions.filter((r) => r.state === 'proposed').length}. Stale decisions: ${report.decisions.filter((r) => r.state === 'needs_review').length}.`, '',
    '## Proposed ingredient changes (not approved)', '', '| Decision | Ingredient ID | Display name | Form | Variety |', '| --- | --- | --- | --- | --- |',
    ...proposalDecisions.map((d) => `| ${d.id} | ${d.ingredient!.id} | ${d.ingredient!.name} | ${d.ingredient!.form ?? ''} | ${d.ingredient!.variety ?? 'unspecified'} |`), '',
    '## Preview search results (proposed choices; not active)', '', ...fixtureResults.map((r) => `- ${r.passed ? 'PASS' : 'FAIL'} ${r.query}: ${r.actual.join(', ') || '(none)'}`), '',
    'Approved-artifact search must also pass before publication. Preview fixtures alone do not authorize proposed choices.', '',
    'Nothing is activated by this command. Proposed choices need a maintainer review recorded against their payload hashes. The approved artifact never includes a proposed or stale change.', ''];
  mkdirSync(dirname(output), { recursive: true });
  const staging = `${output}.staging-${randomUUID()}`;
  try {
    mkdirSync(staging);
    const audit = { ...auditEnvelope, rulesVersion: sources.rulesVersion, decisionLedgerVersion: ledger.formatVersion, sourceDispositions: report.sourceDispositions, reportHash: sha256(report),
      sourceManifest: manifest, ledgerHash: sha256(ledger), sourceSnapshotHash: sha256(rawSources), parentVersion: previous.catalogVersion,
      proposedVersion: values.version, outcome: ready ? 'staged' : 'blocked', published: false };
    for (const [name, value] of Object.entries({ 'catalog.json': result.artifact, 'preview-catalog.json': result.preview, 'report.json': report, 'audit.json': audit })) writeFileSync(join(staging, name), JSON.stringify(value, null, 2) + '\n');
    writeFileSync(join(staging, 'report.md'), lines.join('\n'));
    if (existsSync(output)) throw new Error('Output appeared during curation; refusing to overwrite');
    renameSync(staging, output);
  } catch (error) { rmSync(staging, { recursive: true, force: true }); throw error; }
  console.log(JSON.stringify({ output, publishable: ready, published: false, approvedIngredients: result.artifact.ingredients.length, previewIngredients: result.preview.ingredients.length,
    pending: report.decisions.filter((r) => r.state !== 'replayed').length, fixtureFailures: fixtureResults.filter((r) => !r.passed).length }));
  if (!ready) process.exitCode = 2;
}
try { run(); } catch (error) { console.error(JSON.stringify({ ...auditEnvelope, outcome: 'validation_failed', error: error instanceof Error ? error.message : String(error) })); process.exitCode = 1; }
