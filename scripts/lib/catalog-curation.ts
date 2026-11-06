import { createHash } from 'node:crypto';
import { CatalogArtifact, CatalogDecision, CatalogLedger, CatalogSourceLink, CatalogSourceRecord, CookingIngredient } from '../../src/types/catalog';

const object = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const digest = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const id = (value: unknown): value is string => typeof value === 'string' && /^[a-z0-9][a-z0-9._:-]{0,119}$/.test(value);
function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
function keys(value: Record<string, unknown>, allowed: string[], label: string) {
  assert(Object.keys(value).every((key) => allowed.includes(key)), `${label}: unexpected field`);
}
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (object(value)) return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
}
export const stableJson = (value: unknown) => JSON.stringify(canonical(value));
export const sha256 = (value: unknown) => createHash('sha256').update(stableJson(value)).digest('hex');
const sorted = <T>(items: T[], key: (item: T) => string) => [...items].sort((a, b) => key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0);
function date(value: unknown): boolean {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
function ingredient(value: unknown): asserts value is CookingIngredient {
  assert(object(value), 'Ingredient must be an object');
  keys(value, ['id', 'name', 'aliases', 'recipeIngredientId', 'staticPrice', 'familyId', 'form', 'variety', 'searchVisibility', 'parentIngredientId', 'lifecycle'], 'Ingredient');
  assert(id(value.id) && text(value.name) && value.name.length <= 120, 'Invalid ingredient identity/name');
  assert(Array.isArray(value.aliases) && value.aliases.every((alias) => text(alias) && alias.length <= 120), 'Invalid aliases');
  assert(new Set(value.aliases).size === value.aliases.length, 'Duplicate aliases');
  for (const field of ['recipeIngredientId', 'familyId', 'form', 'variety', 'parentIngredientId']) assert(value[field] === undefined || id(value[field]), `Invalid ${field}`);
  assert(value.searchVisibility === undefined || ['primary', 'variant', 'specific'].includes(String(value.searchVisibility)), 'Invalid search visibility');
  assert(value.lifecycle === undefined || ['active', 'retired'].includes(String(value.lifecycle)), 'Invalid lifecycle');
  if (value.staticPrice !== undefined) {
    const price = value.staticPrice;
    assert(object(price) && text(price.unit) && price.unit.length <= 40 && typeof price.usdPerUnit === 'number' && Number.isFinite(price.usdPerUnit) && price.usdPerUnit >= 0, 'Invalid fixed estimate');
    keys(price, ['unit', 'usdPerUnit'], 'Fixed estimate');
  }
}
function edge(value: unknown): asserts value is { from: string; to: string } {
  assert(object(value) && id(value.from) && id(value.to) && value.from !== value.to, 'Invalid compatibility edge');
  keys(value, ['from', 'to'], 'Compatibility');
}
export function decisionHash(decision: CatalogDecision): string {
  const { status: _status, review: _review, ...payload } = decision;
  return sha256(payload);
}
export function parseLedger(value: unknown): CatalogLedger {
  assert(object(value) && value.formatVersion === 1 && Array.isArray(value.decisions), 'Invalid ledger format');
  keys(value, ['formatVersion', 'decisions'], 'Ledger');
  const revisions = new Map<string, number[]>();
  for (const decision of value.decisions) {
    assert(object(decision) && id(decision.id) && Number.isSafeInteger(decision.revision) && Number(decision.revision) > 0, 'Invalid decision identity/revision');
    keys(decision, ['id', 'revision', 'rulesVersion', 'status', 'action', 'sourceKind', 'sourceRefs', 'sourcePurpose', 'rationale', 'ingredient', 'compatibility', 'exception', 'review'], 'Decision');
    assert(Number.isSafeInteger(decision.rulesVersion) && Number(decision.rulesVersion) > 0, 'Invalid decision rules version');
    assert(['proposed', 'approved'].includes(String(decision.status)) && ['upsert', 'exclude', 'defer', 'compatibility', 'remove-compatibility'].includes(String(decision.action)), 'Invalid decision status/action');
    assert(['USDA', 'CURATED'].includes(String(decision.sourceKind)) && text(decision.rationale), 'Decision requires source kind and rationale');
    assert(Array.isArray(decision.sourceRefs), 'Decision requires source references');
    for (const ref of decision.sourceRefs) {
      assert(object(ref) && typeof ref.key === 'string' && /^(foundation_food|sr_legacy_food):\d+$/.test(ref.key) && digest(ref.fingerprint), 'Invalid source reference');
      keys(ref, ['key', 'fingerprint'], 'Source reference');
    }
    assert(new Set(decision.sourceRefs.map((ref) => ref.key)).size === decision.sourceRefs.length, 'Duplicate source references');
    assert(decision.sourceKind !== 'USDA' || decision.sourceRefs.length > 0, 'USDA decisions require source evidence');
    assert(decision.sourceKind !== 'CURATED' || decision.sourceRefs.length === 0, 'Curated decisions cannot claim USDA source links');
    assert(!['exclude', 'defer'].includes(String(decision.action)) || decision.sourceKind === 'USDA', 'Exclusion/deferral requires source records');
    if (decision.action === 'upsert') { ingredient(decision.ingredient); assert(decision.compatibility === undefined, 'Upsert cannot contain an edge'); }
    else if (['compatibility', 'remove-compatibility'].includes(String(decision.action))) { edge(decision.compatibility); assert(decision.ingredient === undefined, 'Compatibility cannot redefine an ingredient'); }
    else assert(decision.ingredient === undefined && decision.compatibility === undefined, 'Source disposition cannot redefine ingredients');
    if (decision.sourcePurpose !== undefined) {
      assert(decision.sourcePurpose === 'general-reference' && decision.sourceKind === 'USDA' && decision.action === 'upsert' && object(decision.ingredient) && id(decision.ingredient.familyId), 'General references require a USDA upsert with an explicit ingredient family');
    }
    if (decision.exception !== undefined) {
      const exception = decision.exception;
      assert(decision.action === 'defer' && object(exception) && date(exception.sourceReleaseDate) && text(exception.owner) && date(exception.reviewBy) && String(exception.reviewBy) >= String(exception.sourceReleaseDate), 'Quarantine exceptions require deferral, source release, owner, and review date');
      keys(exception, ['sourceReleaseDate', 'owner', 'reviewBy'], 'Exception');
    }
    if (decision.status === 'approved') {
      assert(object(decision.review) && text(decision.review.by) && date(decision.review.date) && digest(decision.review.payloadSha256), 'Approval requires reviewer, calendar date, and reviewed payload hash');
      keys(decision.review, ['by', 'date', 'payloadSha256'], 'Review');
      assert(decision.review.payloadSha256 === decisionHash(decision as unknown as CatalogDecision), 'Approved decision changed after review; append a new reviewed revision');
    } else assert(decision.review === undefined, 'Proposals cannot claim approval metadata');
    const versions = revisions.get(decision.id) ?? [];
    assert(!versions.includes(Number(decision.revision)), 'Duplicate decision revision');
    versions.push(Number(decision.revision)); revisions.set(decision.id, versions);
  }
  for (const versions of revisions.values()) assert(versions.sort((a, b) => a - b).every((version, index) => version === index + 1), 'Decision revisions must start at one and have no gaps');
  return value as unknown as CatalogLedger;
}
export function sourceFingerprint(record: CatalogSourceRecord): string {
  const { key: _key, fingerprint: _fingerprint, disposition: _disposition, ...source } = record;
  return sha256(source);
}
export function parseSources(value: unknown): { rulesVersion: number; releaseDate?: string; records: CatalogSourceRecord[] } {
  assert(object(value) && value.formatVersion === 1 && Number.isSafeInteger(value.rulesVersion) && Number(value.rulesVersion) > 0 && Array.isArray(value.records), 'Invalid source-record snapshot');
  keys(value, ['formatVersion', 'rulesVersion', 'releaseDate', 'records'], 'Source snapshot');
  assert(value.releaseDate === undefined || date(value.releaseDate), 'Invalid snapshot release date');
  const ids = new Set();
  for (const record of value.records) {
    assert(object(record), 'Invalid source record');
    keys(record, ['key', 'fingerprint', 'disposition', 'dataType', 'fdcId', 'ndbNumber', 'description', 'publicationDate', 'categoryId', 'categoryName', 'footnote'], 'Source record');
    assert(['foundation_food', 'sr_legacy_food'].includes(String(record.dataType)) && typeof record.fdcId === 'string' && /^\d+$/.test(record.fdcId), 'Invalid USDA source type/ID');
    assert(record.key === `${record.dataType}:${record.fdcId}` && !ids.has(record.key), 'Invalid/duplicate source key'); ids.add(record.key);
    assert(digest(record.fingerprint) && ['candidate', 'excluded', 'quarantined'].includes(String(record.disposition)), 'Invalid source fingerprint/disposition');
    assert(record.ndbNumber === null || typeof record.ndbNumber === 'string' && /^\d+$/.test(record.ndbNumber), 'Invalid NDB number');
    assert(text(record.description) && date(record.publicationDate) && text(record.categoryId), 'Invalid source description/date/category');
    assert(record.categoryName === null || text(record.categoryName), 'Invalid category name');
    assert(record.footnote === null || typeof record.footnote === 'string', 'Invalid source footnote');
    assert(sourceFingerprint(record as unknown as CatalogSourceRecord) === record.fingerprint, 'Source row does not match its fingerprint');
  }
  return { rulesVersion: Number(value.rulesVersion), ...(typeof value.releaseDate === 'string' ? { releaseDate: value.releaseDate } : {}), records: value.records as CatalogSourceRecord[] };
}
function validateCookingCatalog(ingredients: CookingIngredient[], compatibility: { from: string; to: string }[]) {
  const ids = new Map(ingredients.map((item) => [item.id, item]));
  assert(ids.size === ingredients.length, 'Duplicate cooking identity');
  for (const item of ingredients) {
    ingredient(item);
    if (item.parentIngredientId || item.searchVisibility === 'variant') {
      const parent = item.parentIngredientId && ids.get(item.parentIngredientId);
      assert(parent && parent.id !== item.id && parent.searchVisibility !== 'variant' && !parent.parentIngredientId && item.variety && !parent.variety && item.familyId && item.form && parent.familyId === item.familyId && parent.form === item.form, 'Variant requires a primary parent with the same family/form and unspecified variety');
    }
  }
  const pairs = new Set();
  for (const pair of compatibility) {
    edge(pair);
    const from = ids.get(pair.from); const to = ids.get(pair.to);
    assert(from && to && from.variety && !to.variety && from.familyId && from.form && from.familyId === to.familyId && from.form === to.form, 'Compatibility must be specific-to-general within the same family/form');
    assert(!pairs.has(`${pair.from}:${pair.to}`), 'Duplicate compatibility edge'); pairs.add(`${pair.from}:${pair.to}`);
  }
}
export function artifactContent(artifact: Pick<CatalogArtifact, 'ingredients' | 'compatibility' | 'sourceLinks'>) {
  return { ingredients: sorted(artifact.ingredients, (r) => r.id), compatibility: sorted(artifact.compatibility, (r) => `${r.from}:${r.to}`), sourceLinks: sorted(artifact.sourceLinks, (r) => `${r.ingredientId}:${r.key}`) };
}
const sourceLinkKey = (link: Pick<CatalogSourceLink, 'ingredientId' | 'key'>) => JSON.stringify([link.ingredientId, link.key]);
function validateSourceLinks(ingredients: readonly CookingIngredient[], links: readonly unknown[]) {
  const identities = new Map(ingredients.map((item) => [item.id, item]));
  const pairs = new Set<string>();
  const assigned = new Map<string, { purpose: string; familyId?: string; fingerprint: string }>();
  for (const link of links) {
    assert(object(link) && typeof link.ingredientId === 'string' && identities.has(link.ingredientId) && typeof link.key === 'string' && /^(foundation_food|sr_legacy_food):\d+$/.test(link.key) && digest(link.fingerprint) && (link.purpose === 'identity' || link.purpose === 'general-reference'), 'Invalid artifact source link');
    const previous = assigned.get(link.key);
    if (link.purpose === 'general-reference') {
      keys(link, ['ingredientId', 'key', 'fingerprint', 'purpose', 'familyId'], 'General source reference');
      assert(id(link.familyId) && identities.get(link.ingredientId)?.familyId === link.familyId, 'General source reference must match its ingredient family');
      assert(!previous || previous.purpose === 'general-reference' && previous.familyId === link.familyId && previous.fingerprint === link.fingerprint, 'Source record already assigned with a different purpose, family, or fingerprint');
      assigned.set(link.key, { purpose: link.purpose, familyId: link.familyId, fingerprint: link.fingerprint });
    } else {
      keys(link, ['ingredientId', 'key', 'fingerprint', 'purpose'], 'Source link');
      assert(!previous, 'Source record already assigned to a different identity');
      assigned.set(link.key, { purpose: 'identity', fingerprint: link.fingerprint });
    }
    const pair = sourceLinkKey({ ingredientId: link.ingredientId, key: link.key });
    assert(!pairs.has(pair), 'Duplicate ingredient/source reference'); pairs.add(pair);
  }
}
export function parseArtifact(value: unknown): CatalogArtifact {
  assert(object(value) && value.formatVersion === 1 && typeof value.catalogVersion === 'string' && /^[a-zA-Z0-9._-]{1,80}$/.test(value.catalogVersion) && digest(value.contentHash), 'Invalid published catalog manifest');
  keys(value, ['formatVersion', 'catalogVersion', 'contentHash', 'ingredients', 'compatibility', 'sourceLinks', 'decisions'], 'Artifact');
  assert(Array.isArray(value.ingredients) && Array.isArray(value.compatibility) && Array.isArray(value.sourceLinks) && Array.isArray(value.decisions), 'Invalid catalog arrays');
  value.ingredients.forEach(ingredient); value.compatibility.forEach(edge);
  validateCookingCatalog(value.ingredients, value.compatibility);
  validateSourceLinks(value.ingredients, value.sourceLinks);
  const revisions = new Set();
  for (const decision of value.decisions) {
    assert(object(decision) && id(decision.id) && Number.isSafeInteger(decision.revision) && Number(decision.revision) > 0 && digest(decision.payloadSha256), 'Invalid artifact decision');
    keys(decision, ['id', 'revision', 'payloadSha256'], 'Artifact decision');
    const key = `${decision.id}:${decision.revision}`; assert(!revisions.has(key), 'Duplicate artifact decision'); revisions.add(key);
  }
  const artifact = value as unknown as CatalogArtifact;
  assert(sha256(artifactContent(artifact)) === artifact.contentHash, 'Catalog content does not match its hash');
  return artifact;
}
export function makeBaseline(ingredients: CookingIngredient[], version: string): CatalogArtifact {
  const content = artifactContent({ ingredients, compatibility: [], sourceLinks: [] });
  return parseArtifact({ formatVersion: 1, catalogVersion: version, contentHash: sha256(content), ...content, decisions: [] });
}

export function curateCatalog(options: { ledger: CatalogLedger; sources: ReturnType<typeof parseSources>; previous: CatalogArtifact; version: string; previousSources?: ReturnType<typeof parseSources>; asOfDate?: string }) {
  const ledger = parseLedger(options.ledger); const previous = parseArtifact(options.previous); const sources = parseSources({ formatVersion: 1, ...options.sources });
  assert(/^[a-zA-Z0-9._-]{1,80}$/.test(options.version), 'Invalid requested catalog version');
  const asOfDate = options.asOfDate ?? sources.releaseDate;
  assert(asOfDate === undefined || date(asOfDate), 'Invalid audit date');
  const sourceByKey = new Map(sources.records.map((r) => [r.key, r]));
  const all = new Map(ledger.decisions.map((d) => [`${d.id}:${d.revision}`, d]));
  for (const history of previous.decisions) {
    const current = all.get(`${history.id}:${history.revision}`);
    assert(current?.status === 'approved' && decisionHash(current) === history.payloadSha256, 'Published approval history cannot be edited or removed');
  }
  const latest = new Map<string, CatalogDecision>();
  for (const decision of ledger.decisions) if ((latest.get(decision.id)?.revision ?? 0) < decision.revision) latest.set(decision.id, decision);
  const ingredients = new Map(previous.ingredients.map((r) => [r.id, r]));
  const preview = new Map(previous.ingredients.map((r) => [r.id, r]));
  const sourceLinks = new Map(previous.sourceLinks.map((r) => [sourceLinkKey(r), r]));
  const compatibility = new Map(previous.compatibility.map((r) => [`${r.from}:${r.to}`, r]));
  const history = new Map(previous.decisions.map((d) => [`${d.id}:${d.revision}`, d]));
  const retainedApprovalsNeedReview = new Set<string>();
  const publishedRevisions = new Map<string, number>();
  for (const approval of previous.decisions) publishedRevisions.set(approval.id, Math.max(publishedRevisions.get(approval.id) ?? 0, approval.revision));
  const decisions: { id: string; revision: number; state: 'needs_review' | 'proposed' | 'replayed'; changedSources: string[]; quarantinedSources: string[] }[] = [];
  const targets = new Set(); const edgeTargets = new Set();
  for (const decision of sorted([...latest.values()], (d) => d.id)) {
    const changed = decision.sourceRefs.filter((ref) => sourceByKey.get(ref.key)?.fingerprint !== ref.fingerprint).map((ref) => ref.key);
    const quarantined = decision.action === 'upsert' ? decision.sourceRefs.filter((ref) => sourceByKey.get(ref.key)?.disposition === 'quarantined').map((ref) => ref.key) : [];
    const exceptionStale = decision.exception && (decision.exception.sourceReleaseDate !== sources.releaseDate || !asOfDate || decision.exception.reviewBy < asOfDate);
    const stale = decision.rulesVersion !== sources.rulesVersion || changed.length > 0 || quarantined.length > 0 || Boolean(exceptionStale);
    const state = stale ? 'needs_review' : decision.status === 'proposed' ? 'proposed' : 'replayed';
    decisions.push({ id: decision.id, revision: decision.revision, state, changedSources: changed, quarantinedSources: quarantined });
    if (decision.ingredient) {
      assert(!targets.has(decision.ingredient.id), 'Multiple latest decisions target the same cooking identity'); targets.add(decision.ingredient.id);
      if (!stale) preview.set(decision.ingredient.id, decision.ingredient);
    }
    if (state !== 'replayed') {
      const publishedRevision = publishedRevisions.get(decision.id);
      const retained = publishedRevision && all.get(`${decision.id}:${publishedRevision}`);
      if (retained && (retained.rulesVersion !== sources.rulesVersion ||
          retained.sourceRefs.some((ref) => sourceByKey.get(ref.key)?.fingerprint !== ref.fingerprint || sourceByKey.get(ref.key)?.disposition === 'quarantined') ||
          retained.exception && (retained.exception.sourceReleaseDate !== sources.releaseDate || !asOfDate || retained.exception.reviewBy < asOfDate))) retainedApprovalsNeedReview.add(decision.id);
      continue;
    }
    history.set(`${decision.id}:${decision.revision}`, { id: decision.id, revision: decision.revision, payloadSha256: decisionHash(decision) });
    if (decision.action === 'upsert' && decision.ingredient) {
      const before = ingredients.get(decision.ingredient.id);
      if (before) for (const field of ['familyId', 'form', 'variety'] as const) assert(before[field] === undefined || before[field] === decision.ingredient[field], 'Existing cooking meaning cannot change in place; use a new identity and transition plan');
      assert(!before?.familyId || !before.form || before.variety === decision.ingredient.variety, 'Existing cooking meaning cannot change in place; unspecified variety must remain unspecified');
      ingredients.set(decision.ingredient.id, decision.ingredient);
      for (const [key, link] of sourceLinks) if (link.ingredientId === decision.ingredient.id) sourceLinks.delete(key);
      if (decision.sourceKind === 'USDA') {
        for (const ref of decision.sourceRefs) {
          const link: CatalogSourceLink = decision.sourcePurpose === 'general-reference'
            ? { ingredientId: decision.ingredient.id, ...ref, purpose: 'general-reference', familyId: decision.ingredient.familyId! }
            : { ingredientId: decision.ingredient.id, ...ref, purpose: 'identity' };
          sourceLinks.set(sourceLinkKey(link), link);
        }
      }
    }
    if (decision.compatibility) {
      const key = `${decision.compatibility.from}:${decision.compatibility.to}`;
      assert(!edgeTargets.has(key), 'Multiple latest approvals target the same compatibility edge'); edgeTargets.add(key);
      if (decision.action === 'remove-compatibility') compatibility.delete(key);
      else compatibility.set(key, decision.compatibility);
    }
  }
  const content = artifactContent({ ingredients: [...ingredients.values()], compatibility: [...compatibility.values()], sourceLinks: [...sourceLinks.values()] });
  const artifact: CatalogArtifact = { formatVersion: 1, catalogVersion: options.version, contentHash: sha256(content), ...content, decisions: sorted([...history.values()], (d) => `${d.id}:${d.revision}`) };
  parseArtifact(artifact);
  validateCookingCatalog([...preview.values()], artifact.compatibility);
  assert(previous.catalogVersion !== artifact.catalogVersion || stableJson(previous) === stableJson(artifact), 'A catalog version cannot be reused for different content or approval history');
  const blockedDecisions = [...new Set([...decisions.filter((d) => d.state === 'needs_review' && latest.get(d.id)?.status === 'approved').map((d) => d.id), ...retainedApprovalsNeedReview])].sort();
  const rejected = new Set([...latest.values()].filter((d) => ['exclude', 'defer'].includes(d.action) && decisions.find((r) => r.id === d.id)?.state === 'replayed').flatMap((d) => d.sourceRefs.map((ref) => ref.key)));
  const stalePublishedLinks = artifact.sourceLinks.filter((ref) => sourceByKey.get(ref.key)?.fingerprint !== ref.fingerprint || sourceByKey.get(ref.key)?.disposition === 'quarantined' || rejected.has(ref.key)).map((ref) => ref.key);
  const previousSources = options.previousSources ? parseSources({ formatVersion: 1, ...options.previousSources }) : undefined;
  const oldSources = new Map(previousSources?.records.map((r) => [r.key, r]) ?? []);
  const sourceDiff = {
    comparison: previousSources ? 'previous-source-snapshot' : 'first-source-snapshot',
    added: sources.records.filter((r) => !oldSources.has(r.key)).map((r) => r.key).sort(),
    modified: sources.records.filter((r) => oldSources.has(r.key) && (oldSources.get(r.key)?.fingerprint !== r.fingerprint || oldSources.get(r.key)?.disposition !== r.disposition)).map((r) => r.key).sort(),
    missing: [...oldSources.keys()].filter((key) => !sourceByKey.has(key)).sort(),
  };
  const approvedExceptions = new Set<string>();
  for (const decision of latest.values()) {
    if (decision.action === 'defer' && decision.exception && decision.status === 'approved' &&
        decision.rulesVersion === sources.rulesVersion && decision.exception.sourceReleaseDate === sources.releaseDate &&
        decision.exception.reviewBy >= sources.releaseDate && decisions.find((d) => d.id === decision.id)?.state === 'replayed') {
      for (const ref of decision.sourceRefs) approvedExceptions.add(ref.key);
    }
  }
  const unapprovedQuarantines = sources.records.filter((r) => r.disposition === 'quarantined' && !approvedExceptions.has(r.key)).map((r) => r.key).sort();
  const beforeIds = new Map(previous.ingredients.map((r) => [r.id, r]));
  const added = artifact.ingredients.filter((r) => !beforeIds.has(r.id)).map((r) => r.id);
  const modified = artifact.ingredients.filter((r) => beforeIds.has(r.id) && stableJson(beforeIds.get(r.id)) !== stableJson(r)).map((r) => r.id);
  return { artifact, preview: { status: 'UNAPPROVED_PREVIEW' as const, ingredients: sorted([...preview.values()], (r) => r.id) },
    report: { formatVersion: 1, rulesVersion: sources.rulesVersion, parentVersion: previous.catalogVersion, catalogVersion: artifact.catalogVersion,
      contentHash: artifact.contentHash, publishable: blockedDecisions.length === 0 && stalePublishedLinks.length === 0 && unapprovedQuarantines.length === 0,
      blockedDecisions, retainedApprovalsNeedReview: [...retainedApprovalsNeedReview].sort(), stalePublishedLinks, unapprovedQuarantines, decisions, sourceDiff, diff: { added, modified, removed: [] as string[],
        sourceLinksChanged: stableJson(previous.sourceLinks) !== stableJson(artifact.sourceLinks), compatibilityChanged: stableJson(previous.compatibility) !== stableJson(artifact.compatibility) },
      sourceDispositions: { candidate: sources.records.filter((r) => r.disposition === 'candidate').length, excluded: sources.records.filter((r) => r.disposition === 'excluded').length, quarantined: sources.records.filter((r) => r.disposition === 'quarantined').length } } };
}
