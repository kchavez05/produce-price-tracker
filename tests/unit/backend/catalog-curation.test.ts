import { describe, expect, it } from 'vitest';
import { CatalogDecision, CatalogSourceRecord, CookingIngredient } from '@/types/catalog';
import { PantryEntry } from '@/types/pantry';
import { PANTRY_INGREDIENTS } from '@/data/pantry-ingredients';
import { artifactContent, curateCatalog, decisionHash, makeBaseline, parseArtifact, parseLedger, parseSources, sha256, sourceFingerprint } from '../../../scripts/lib/catalog-curation';
import { availableCookingIngredientIds, cookingCatalogVariants, searchCookingCatalog } from '@/lib/pantry/catalog-search';
import baselineData from '../../../catalog/baseline-1.5.2.json';
import ledgerData from '../../../catalog/curation-ledger.json';
import fixtures from '../../../catalog/core-search-fixtures.json';
import initialFixtures from '../../../catalog/releases/2026-10-30.1/search-fixtures.json';
import firstExpansionFixtures from '../../../catalog/releases/2026-10-31.1/search-fixtures.json';
import vegetableData from '../../../catalog/releases/2026-11-06.1/catalog.json';
import vegetableManifest from '../../../catalog/releases/2026-11-06.1/manifest.json';
import vegetableAudit from '../../../catalog/releases/2026-11-06.1/audit.json';
import vegetableHashes from '../../../catalog/proposals/2026-11-06-vegetables-aromatics/decision-hashes.json';
import vegetableEvidence from '../../../catalog/proposals/2026-11-06-vegetables-aromatics/source-evidence.json';
import expansionData from '../../../catalog/releases/2026-10-31.1/catalog.json';
import expansionManifest from '../../../catalog/releases/2026-10-31.1/manifest.json';
import expansionAudit from '../../../catalog/releases/2026-10-31.1/audit.json';
import expansionHashes from '../../../catalog/proposals/2026-10-31-legumes-grains-flours/decision-hashes.json';
import expansionEvidence from '../../../catalog/proposals/2026-10-31-legumes-grains-flours/source-evidence.json';
import approvedData from '../../../catalog/releases/2026-10-30.1/catalog.json';
import releaseManifest from '../../../catalog/releases/2026-10-30.1/manifest.json';
import releaseAudit from '../../../catalog/releases/2026-10-30.1/audit.json';

const general: CookingIngredient = { id: 'lentils-dried', name: 'Dried lentils', aliases: [], familyId: 'lentils', form: 'dried', searchVisibility: 'primary' };
const red: CookingIngredient = { id: 'red-lentils-dried', name: 'Dried red lentils', aliases: [], familyId: 'lentils', form: 'dried', variety: 'red', searchVisibility: 'variant', parentIngredientId: general.id };
const canned: CookingIngredient = { id: 'lentils-canned', name: 'Canned lentils', aliases: [], familyId: 'lentils', form: 'canned', searchVisibility: 'primary' };
const base = makeBaseline([general], 'initial');
function record(patch: Partial<CatalogSourceRecord> = {}): CatalogSourceRecord {
  const row: CatalogSourceRecord = { key: 'foundation_food:1', dataType: 'foundation_food', fdcId: '1', ndbNumber: '0100', description: 'Lentils, dry', publicationDate: '2026-10-29', categoryId: '16', categoryName: 'Legumes', footnote: null, disposition: 'candidate', fingerprint: '', ...patch };
  row.fingerprint = sourceFingerprint(row); return row;
}
function decision(patch: Partial<CatalogDecision> = {}): CatalogDecision {
  return { id: 'general-lentils', revision: 1, rulesVersion: 1, status: 'proposed', action: 'upsert', sourceKind: 'USDA',
    sourceRefs: [{ key: record().key, fingerprint: record().fingerprint }], rationale: 'Reviewed cooking identity rationale', ingredient: general, ...patch };
}
function approve(proposal: CatalogDecision): CatalogDecision { return { ...proposal, status: 'approved', review: { by: 'fixture-reviewer', date: '2026-10-30', payloadSha256: decisionHash(proposal) } }; }
function compile(decisions: CatalogDecision[], patch: Partial<Parameters<typeof curateCatalog>[0]> = {}) {
  return curateCatalog({ ledger: { formatVersion: 1, decisions }, sources: { rulesVersion: 1, records: [record()] }, previous: base, version: 'next', ...patch });
}
const entry = (ingredientId: string, available = true, patch: Partial<PantryEntry> = {}): PantryEntry => ({ id: ingredientId, ingredientId, displayName: ingredientId, available, revision: 1, updatedAtIso: '', ...patch });

describe('curation and recurring approval gates', () => {
  it('preserves the exact existing 69-ID baseline, including fixed prices and recipe mappings', () => {
    const artifact = parseArtifact(baselineData);
    expect(artifact.ingredients).toEqual([...PANTRY_INGREDIENTS].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    expect(parseLedger(ledgerData).decisions.every((d) => d.status === 'approved' && d.review?.payloadSha256 === decisionHash(d))).toBe(true);
  });
  it('retains the exact reviewed release with matching approvals, provenance, and search gates', () => {
    const approved = parseArtifact(approvedData); const fullLedger = parseLedger(ledgerData);
    const ledger = { ...fullLedger, decisions: fullLedger.decisions.filter((d) => approved.decisions.some((history) => history.id === d.id && history.revision === d.revision)) };
    expect(approved.ingredients).toHaveLength(72);
    expect(approved.decisions).toEqual(ledger.decisions.map((d) => ({ id: d.id, revision: d.revision, payloadSha256: decisionHash(d) })).sort((a, b) => a.id.localeCompare(b.id)));
    expect(releaseManifest).toMatchObject({ catalogVersion: approved.catalogVersion, contentHash: approved.contentHash, published: false, status: 'APPROVED_FOR_INTEGRATION' });
    expect(releaseAudit).toMatchObject({ ledgerHash: sha256(ledger), parentVersion: 'baseline-1.5.2', outcome: 'staged', published: false });
    for (const fixture of initialFixtures) expect(searchCookingCatalog(approved.ingredients, fixture.query).map((r) => r.id).sort()).toEqual([...fixture.expected].sort());
    for (const old of parseArtifact(baselineData).ingredients) {
      const current = approved.ingredients.find((r) => r.id === old.id);
      expect(current).toMatchObject(old);
    }
    expect(approved.compatibility).toEqual([{ from: red.id, to: general.id }]);
    expect(approved.sourceLinks).toHaveLength(3);
  });
  it('retains the approved expansion, all earlier identities, and unchanged recipe compatibility', () => {
    const expanded = parseArtifact(expansionData); const fullLedger = parseLedger(ledgerData);
    const ledger = { ...fullLedger, decisions: fullLedger.decisions.filter((d) => expanded.decisions.some((h) => h.id === d.id && h.revision === d.revision)) };
    const previous = parseArtifact(approvedData);
    expect(expanded.ingredients).toHaveLength(101);
    expect(expanded.decisions).toEqual(ledger.decisions.map((d) => ({ id: d.id, revision: d.revision, payloadSha256: decisionHash(d) })).sort((a, b) => a.id.localeCompare(b.id)));
    expect(expansionManifest).toMatchObject({ catalogVersion: expanded.catalogVersion, contentHash: expanded.contentHash, published: false, status: 'APPROVED_FOR_INTEGRATION' });
    expect(expansionAudit).toMatchObject({ ledgerHash: sha256(ledger), parentVersion: previous.catalogVersion, outcome: 'staged', published: false });
    const evidence = parseSources(expansionEvidence);
    for (const reviewed of expansionHashes) {
      const decision = ledger.decisions.find((d) => d.id === reviewed.id && d.revision === reviewed.revision)!;
      expect(decision.status).toBe('approved');
      expect(decisionHash(decision)).toBe(reviewed.payloadSha256);
      for (const ref of decision.sourceRefs) expect(evidence.records.find((r) => r.key === ref.key)?.fingerprint).toBe(ref.fingerprint);
    }
    expect(expanded.compatibility).toEqual(previous.compatibility);
    for (const before of previous.ingredients) expect(expanded.ingredients.find((r) => r.id === before.id)).toMatchObject(before);
    const additions = expanded.ingredients.filter((r) => !previous.ingredients.some((before) => before.id === r.id));
    expect(additions).toHaveLength(29);
    expect(additions.every((r) => !r.staticPrice && !r.recipeIngredientId)).toBe(true);
    for (const fixture of firstExpansionFixtures) expect(searchCookingCatalog(expanded.ingredients, fixture.query).map((r) => r.id).sort(), fixture.query).toEqual([...fixture.expected].sort());
    for (const query of ['beans', 'flour', 'rice', 'lentils']) expect(searchCookingCatalog(expanded.ingredients, query, 1000).length).toBeLessThanOrEqual(12);
  });
  it('retains the exact approved vegetable payloads, evidence, prior fields and existing coverage rules', () => {
    const catalog = parseArtifact(vegetableData), previous = parseArtifact(expansionData), ledger = parseLedger(ledgerData);
    expect(catalog.ingredients).toHaveLength(111);
    expect(catalog.decisions).toEqual(ledger.decisions.map((d) => ({ id: d.id, revision: d.revision, payloadSha256: decisionHash(d) })).sort((a, b) => a.id.localeCompare(b.id)));
    expect(vegetableManifest).toMatchObject({ catalogVersion: catalog.catalogVersion, contentHash: catalog.contentHash, status: 'APPROVED_FOR_INTEGRATION', published: false });
    expect(vegetableAudit).toMatchObject({ ledgerHash: sha256(ledger), parentVersion: previous.catalogVersion, outcome: 'staged' });
    const evidence = parseSources(vegetableEvidence);
    for (const reviewed of vegetableHashes) {
      const decision = ledger.decisions.find((d) => d.id === reviewed.id && d.revision === reviewed.revision)!;
      expect(decision.status).toBe('approved');
      expect(decisionHash(decision)).toBe(reviewed.payloadSha256);
      for (const ref of decision.sourceRefs) expect(evidence.records.find((r) => r.key === ref.key)?.fingerprint).toBe(ref.fingerprint);
    }
    for (const before of previous.ingredients) expect(catalog.ingredients.find((r) => r.id === before.id)).toMatchObject(before);
    const additions = catalog.ingredients.filter((r) => !previous.ingredients.some((old) => old.id === r.id));
    expect(additions).toHaveLength(10);
    expect(additions.every((r) => !r.staticPrice && !r.recipeIngredientId && r.form === 'fresh')).toBe(true);
    expect(catalog.compatibility).toEqual(previous.compatibility);
    for (const fixture of fixtures) expect(searchCookingCatalog(catalog.ingredients, fixture.query).map((r) => r.id).sort(), fixture.query).toEqual([...fixture.expected].sort());
  });
  it('keeps proposals in the unapproved preview and replays only approvals with unchanged fingerprints', () => {
    const proposal = decision({ ingredient: { ...general, name: 'Dry lentils' } });
    const staged = compile([proposal]);
    expect(staged.artifact.ingredients[0].name).toBe('Dried lentils');
    expect(staged.preview.ingredients[0].name).toBe('Dry lentils');
    expect(staged.report.decisions[0].state).toBe('proposed');
    const approved = approve(proposal); const first = compile([approved]);
    expect(first.artifact.ingredients[0].name).toBe('Dry lentils');
    expect(first.report.diff.modified).toEqual([general.id]);
    const repeat = compile([approved], { previous: first.artifact, version: 'next' });
    expect(repeat.artifact).toEqual(first.artifact);
    expect(repeat.report.publishable).toBe(true);
    expect(repeat.report.diff.modified).toEqual([]);
  });
  it('holds changed, missing, quarantined, or rule-changed evidence without deleting prior inventory identities', () => {
    const approved = approve(decision()); const first = compile([approved]);
    for (const sources of [
      { rulesVersion: 1, records: [record({ description: 'Changed food meaning' })] },
      { rulesVersion: 1, records: [] },
      { rulesVersion: 1, records: [record({ disposition: 'quarantined' })] },
      { rulesVersion: 2, records: [record()] },
    ]) {
      const next = compile([approved], { previous: first.artifact, version: 'later', sources });
      expect(next.report.publishable).toBe(false);
      expect(next.report.blockedDecisions).toEqual([approved.id]);
      expect(next.artifact.ingredients).toEqual(first.artifact.ingredients);
      expect(next.report.diff.removed).toEqual([]);
    }
  });
  it('keeps retained approval freshness gates when a newer revision is only proposed', () => {
    for (const sourceKind of ['USDA', 'CURATED'] as const) {
      const approved = approve(decision({ sourceKind, ...(sourceKind === 'CURATED' ? { sourceRefs: [] } : {}) }));
      const first = compile([approved]);
      const proposal = decision({ ...approved, revision: 2, rulesVersion: 2, status: 'proposed', review: undefined });
      const sources = { rulesVersion: 2, records: [record()] };
      const pending = compile([approved, proposal], { previous: first.artifact, version: 'pending', sources });
      expect(pending.report.publishable).toBe(false);
      expect(pending.report.retainedApprovalsNeedReview).toEqual([approved.id]);
      expect(pending.artifact.ingredients).toEqual(first.artifact.ingredients);
      expect(compile([approved, approve(proposal)], { previous: first.artifact, version: 'reviewed', sources }).report.publishable).toBe(true);
    }
  });
  it('preserves an established unspecified variety while permitting legacy metadata enrichment', () => {
    expect(() => compile([approve(decision({ ingredient: { ...general, variety: 'red' } }))])).toThrow('unspecified variety');
    const legacy = makeBaseline([{ id: general.id, name: general.name, aliases: [] }], 'legacy');
    expect(compile([approve(decision())], { previous: legacy }).artifact.ingredients[0]).toEqual(general);
  });
  it('requires a new reviewed revision for edits and preserves published approval history', () => {
    const approved = approve(decision());
    expect(() => compile([{ ...approved, ingredient: { ...general, name: 'Different' } }])).toThrow('changed after review');
    const first = compile([approved]);
    expect(() => compile([], { previous: first.artifact })).toThrow('history cannot be edited or removed');
    const revision = approve(decision({ revision: 2, ingredient: { ...general, aliases: ['dry pulses'] } }));
    const updated = compile([approved, revision], { previous: first.artifact, version: 'updated' });
    expect(updated.artifact.decisions).toHaveLength(2);
    expect(updated.artifact.ingredients[0].aliases).toEqual(['dry pulses']);
    expect(() => compile([revision])).toThrow('no gaps');
    expect(() => compile([approved, approved])).toThrow('Duplicate decision revision');
    expect(() => compile([approved], { version: 'initial' })).toThrow('cannot be reused'); // Approval history differs.
  });
  it('supports explicit exclusion/deferral review and never approves quarantined upserts', () => {
    const exclusion = approve(decision({ action: 'exclude', ingredient: undefined }));
    const deferral = approve(decision({ id: 'defer-row', action: 'defer', ingredient: undefined }));
    expect(compile([exclusion]).report.decisions[0].state).toBe('replayed');
    expect(compile([deferral]).artifact.ingredients).toEqual(base.ingredients);
    const quarantined = compile([approve(decision())], { sources: { rulesVersion: 1, records: [record({ disposition: 'quarantined' })] } });
    expect(quarantined.report.publishable).toBe(false);
  });
  it('requires source-release-bound, owned and unexpired approval for every quarantine exception', () => {
    const quarantined = record({ disposition: 'quarantined' });
    const sources = { rulesVersion: 1, releaseDate: '2026-10-29', records: [quarantined] };
    expect(compile([], { sources }).report.unapprovedQuarantines).toEqual([quarantined.key]);
    const proposal = decision({ action: 'defer', ingredient: undefined,
      exception: { sourceReleaseDate: '2026-10-29', owner: 'fixture-owner', reviewBy: '2027-04-30' } });
    expect(compile([proposal], { sources }).report.publishable).toBe(false);
    const reviewed = approve(proposal);
    expect(compile([reviewed], { sources, asOfDate: '2026-10-30' }).report.publishable).toBe(true);
    expect(compile([reviewed], { sources, asOfDate: '2027-05-01' }).report.publishable).toBe(false);
    expect(compile([reviewed], { sources: { ...sources, releaseDate: '2027-04-01' } }).report.publishable).toBe(false);
  });
  it('does not infer source links for curated ingredients or let multiple identities claim the same source', () => {
    const other = approve(decision({ id: 'second-row', ingredient: { id: 'other', name: 'Other', aliases: [] } }));
    expect(() => compile([approve(decision()), other])).toThrow('already assigned');
    expect(() => compile([decision({ sourceKind: 'CURATED' })])).toThrow('cannot claim USDA');
    const curated = approve(decision({ sourceKind: 'CURATED', sourceRefs: [], ingredient: { ...canned } }));
    expect(compile([curated]).artifact.sourceLinks).toEqual([]);
    expect(() => compile([decision({ sourceRefs: [] })])).toThrow('require source evidence');
  });
  it('blocks rejected evidence still linked by another approval and supports explicit reviewed source withdrawal', () => {
    const approved = approve(decision()); const first = compile([approved]);
    const rejected = approve(decision({ id: 'reject-source', action: 'exclude', ingredient: undefined }));
    expect(compile([approved, rejected], { previous: first.artifact, version: 'rejected' }).report.publishable).toBe(false);
    const withdrawal = approve(decision({ revision: 2, sourceKind: 'CURATED', sourceRefs: [] }));
    const result = compile([approved, withdrawal, rejected], { previous: first.artifact, version: 'withdrawn' });
    expect(result.report.publishable).toBe(true);
    expect(result.artifact.sourceLinks).toEqual([]);
    expect(result.artifact.ingredients[0].id).toBe(general.id);
  });
  it('validates source snapshots and artifact hashes before using them', () => {
    const valid = record(); expect(parseSources({ formatVersion: 1, rulesVersion: 1, records: [valid] }).records).toHaveLength(1);
    expect(() => parseSources({ formatVersion: 1, rulesVersion: 1, records: [{ ...valid, description: 'tampered' }] })).toThrow('fingerprint');
    expect(() => parseSources({ formatVersion: 1, rulesVersion: 1, records: [valid, valid] })).toThrow('duplicate source key');
    expect(() => parseArtifact({ ...base, contentHash: '0'.repeat(64) })).toThrow('content does not match');
    expect(() => parseArtifact({ ...base, unexpected: true })).toThrow('unexpected field');
  });
  it('reports additions, changes and missing source records independently of catalog deletions', () => {
    const old = record({ description: 'Old description' });
    const missing = record({ key: 'sr_legacy_food:2', dataType: 'sr_legacy_food', fdcId: '2' });
    const result = compile([], { previousSources: { rulesVersion: 1, records: [old, missing] } });
    expect(result.report.sourceDiff).toMatchObject({ added: [], modified: [record().key], missing: [missing.key] });
    expect(result.report.diff.removed).toEqual([]);
  });
  it('refuses incompatible forms, reverse compatibility, broken parents, and in-place meaning changes', () => {
    const variants = makeBaseline([general, red, canned], 'variants');
    const pair = (from: string, to: string) => approve(decision({ action: 'compatibility', ingredient: undefined, sourceKind: 'CURATED', sourceRefs: [], compatibility: { from, to } }));
    expect(compile([pair(red.id, general.id)], { previous: variants }).artifact.compatibility).toEqual([{ from: red.id, to: general.id }]);
    const added = pair(red.id, general.id);
    expect(() => compile([added, approve({ ...added, id: 'conflicting-edge', status: 'proposed', review: undefined })], { previous: variants })).toThrow('same compatibility edge');
    const first = compile([added], { previous: variants });
    const removal = approve({ ...added, revision: 2, action: 'remove-compatibility', status: 'proposed', review: undefined });
    expect(compile([added, removal], { previous: first.artifact, version: 'edge-removed' }).artifact.compatibility).toEqual([]);
    expect(() => compile([pair(general.id, red.id)], { previous: variants })).toThrow('specific-to-general');
    expect(() => compile([pair(red.id, canned.id)], { previous: variants })).toThrow('same family/form');
    expect(() => makeBaseline([red], 'broken')).toThrow('primary parent');
    expect(() => compile([approve(decision({ ingredient: { ...general, form: 'canned' } }))])).toThrow('meaning cannot change');
  });
});

describe('grouped cooking search and availability contract (not yet active in the app)', () => {
  const items = [general, red, canned]; const pair = [{ from: red.id, to: general.id }];
  it('shows two primary lentil choices and keeps varieties optional and specifically searchable', () => {
    expect(searchCookingCatalog(items, 'lentils').map((r) => r.id).sort()).toEqual([canned.id, general.id]);
    expect(searchCookingCatalog(items, 'RED  LENTILS').map((r) => r.id)).toEqual([red.id]);
    expect(cookingCatalogVariants(items, general.id)).toEqual([red]);
    expect(searchCookingCatalog(items, '').length).toBe(0);
    expect(searchCookingCatalog(items, 'lentils', 1)).toHaveLength(1);
    expect(searchCookingCatalog(items, 'lentils', -1)).toEqual([]);
  });
  it('keeps retired identities valid while omitting them from new-add search', () => {
    const retired = items.map((r) => r.id === general.id ? { ...r, lifecycle: 'retired' as const } : r);
    expect(searchCookingCatalog(retired, 'lentils').map((r) => r.id)).not.toContain(general.id);
    expect(availableCookingIngredientIds([entry(general.id)], retired, [])).toEqual([general.id]);
  });
  it('keeps optional flour varieties out of grain searches while retaining precise and optional discovery', () => {
    const flour: CookingIngredient = { id: 'rice-flour', name: 'Rice flour', aliases: [], familyId: 'rice-flour', form: 'flour', searchVisibility: 'specific' };
    const brownFlour: CookingIngredient = { ...flour, id: 'brown-rice-flour', name: 'Brown rice flour', variety: 'brown', searchVisibility: 'variant', parentIngredientId: flour.id };
    const grain: CookingIngredient = { id: 'brown-rice-dry', name: 'Dry brown rice', aliases: [] };
    const catalog = [flour, brownFlour, grain];
    expect(searchCookingCatalog(catalog, 'rice').map((r) => r.id)).toEqual([grain.id]);
    expect(searchCookingCatalog(catalog, 'brown rice').map((r) => r.id)).toEqual([grain.id]);
    expect(searchCookingCatalog(catalog, 'flour').map((r) => r.id)).toEqual([flour.id]);
    expect(searchCookingCatalog(catalog, 'BROWN  RICE FLOUR').map((r) => r.id)).toEqual([brownFlour.id]);
    expect(cookingCatalogVariants(catalog, flour.id)).toEqual([brownFlour]);
    expect(availableCookingIngredientIds([entry(brownFlour.id)], catalog, [])).toEqual([brownFlour.id]);
    const retiredParent = catalog.map((r) => r.id === flour.id ? { ...r, lifecycle: 'retired' as const } : r);
    expect(searchCookingCatalog(retiredParent, 'brown rice').map((r) => r.id)).toEqual([grain.id]);
    expect(searchCookingCatalog(retiredParent, 'brown rice flour').map((r) => r.id)).toEqual([brownFlour.id]);
  });
  it('honors specific-to-general coverage, explicit No precedence, quantities, and dates without transitive inference', () => {
    const exact = [entry(red.id, true, { quantity: 0, useByDate: '2000-01-01' })];
    expect(availableCookingIngredientIds(exact, items, pair)).toEqual([general.id, red.id]);
    expect(availableCookingIngredientIds([entry(general.id)], items, pair)).toEqual([general.id]);
    expect(availableCookingIngredientIds([entry(canned.id)], items, pair)).toEqual([canned.id]);
    expect(availableCookingIngredientIds([...exact, entry(general.id, false)], items, pair)).toEqual([red.id]);
    expect(availableCookingIngredientIds([entry(general.id), entry(red.id, false)], items, pair)).toEqual([general.id]);
    expect(availableCookingIngredientIds([entry(red.id, true, { deletedAtIso: '2026-10-30' })], items, pair)).toEqual([]);
    expect(availableCookingIngredientIds(exact, items, [...pair, { from: general.id, to: canned.id }])).not.toContain(canned.id);
    expect(availableCookingIngredientIds([entry('unknown-custom')], items, pair)).toEqual([]);
  });
  it('verifies the approved batch against the core fixture searches without activating it', () => {
    const ledger = parseLedger(ledgerData); const ingredients = new Map(parseArtifact(baselineData).ingredients.map((r) => [r.id, r]));
    for (const decision of ledger.decisions) if (decision.ingredient) ingredients.set(decision.ingredient.id, decision.ingredient);
    for (const fixture of fixtures) expect(searchCookingCatalog([...ingredients.values()], fixture.query).map((r) => r.id).sort(), fixture.query).toEqual([...fixture.expected].sort());
    expect(sha256(artifactContent(base))).toBe(base.contentHash);
  });
});
