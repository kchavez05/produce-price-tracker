import { compileMarketCounterparts } from './lib/market-coverage-approvals';
import { validateMarketLinkAudit } from './lib/market-link-audit';
import { readFileSync, writeFileSync, renameSync, rmSync } from 'node:fs';
import { CANONICAL_INGREDIENTS } from '../src/data/canonical-ingredients';
import { parseArtifact, parseLedger, decisionHash, sha256 } from './lib/catalog-curation';
import { compileScopedRecipeUses } from './lib/scoped-recipe-uses';
import { MEAL_PREP_BLUEPRINTS } from '../src/data/meal-prep-blueprints';

// Only the reviewed release can generate browser data; raw sources stay server-side.
const artifact = parseArtifact(JSON.parse(readFileSync('catalog/releases/2026-11-07.1/catalog.json', 'utf8')));
const ledger = parseLedger(JSON.parse(readFileSync('catalog/curation-ledger.json', 'utf8')));
for (const history of artifact.decisions) {
  const decision = ledger.decisions.find((d) => d.id === history.id && d.revision === history.revision);
  if (!decision || decision.status !== 'approved' || decisionHash(decision) !== history.payloadSha256) throw new Error('Catalog approval history does not match ledger');
}
const baseline = parseArtifact(JSON.parse(readFileSync('catalog/baseline-1.5.2.json', 'utf8')));
const retainedArtifacts = [baseline, ...['2026-10-30.1', '2026-10-31.1', '2026-11-06.1', '2026-11-06.2', '2026-11-06.3', '2026-11-06.4', '2026-11-06.5'].map((version) => {
  const retained = parseArtifact(JSON.parse(readFileSync(`catalog/releases/${version}/catalog.json`, 'utf8')));
  return retained;
})];
const retainedCatalogs = retainedArtifacts.map((retained) => ({ version: retained.catalogVersion, ingredients: retained.ingredients, compatibility: retained.compatibility }));
const recipeLedger: unknown = JSON.parse(readFileSync('catalog/recipe-use-links.json', 'utf8'));
if (!recipeLedger || typeof recipeLedger !== 'object' || !('formatVersion' in recipeLedger) || recipeLedger.formatVersion !== 1 || !('decisions' in recipeLedger) || !Array.isArray(recipeLedger.decisions)) throw new Error('Invalid recipe-use ledger');
const recipeLinks: { marketIngredientId: string; pantryIngredientId: string }[] = [];
const targets = new Set<string>();
const rows: unknown[] = recipeLedger.decisions;
for (const value of rows) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid recipe-use decision');
  const decision = value as Record<string, unknown>;
  if (!decision || typeof decision !== 'object' || !('review' in decision) || !decision.review || typeof decision.review !== 'object' || Array.isArray(decision.review)) throw new Error('Recipe-use link needs approval');
  const { status, review: rawReview, ...payload } = decision;
  const review = rawReview as Record<string, unknown>;
  if (status !== 'approved' || typeof review.by !== 'string' || !review.by.trim() || typeof review.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(review.date) || review.payloadSha256 !== sha256(payload) || typeof payload.rationale !== 'string' || !payload.rationale.trim() || typeof payload.id !== 'string' || !payload.id || payload.revision !== 1 || typeof payload.marketIngredientId !== 'string' || typeof payload.pantryIngredientId !== 'string' ||
      !artifact.ingredients.some((r) => r.id === payload.pantryIngredientId) || !CANONICAL_INGREDIENTS.some((r) => r.id === payload.marketIngredientId) || targets.has(payload.marketIngredientId) ||
      artifact.ingredients.some((r) => r.recipeIngredientId === payload.marketIngredientId && r.id !== payload.pantryIngredientId)) throw new Error('Invalid or conflicting approved recipe-use link');
  targets.add(payload.marketIngredientId);
  recipeLinks.push({ marketIngredientId: payload.marketIngredientId, pantryIngredientId: payload.pantryIngredientId });
}
const coverageApprovals: unknown = JSON.parse(readFileSync('catalog/market-coverage-approvals.json', 'utf8'));
const marketCounterparts = compileMarketCounterparts(coverageApprovals, artifact.ingredients, CANONICAL_INGREDIENTS);
const { uses: scopedRecipeUses, contexts: scopedRecipeContexts } = compileScopedRecipeUses(JSON.parse(readFileSync('catalog/scoped-recipe-uses.json', 'utf8')), artifact.ingredients, CANONICAL_INGREDIENTS, MEAL_PREP_BLUEPRINTS, coverageApprovals);
// The approved whole/baby carrot relationship is exact; mixed groups have no global alias.
const carrots = scopedRecipeUses.filter((use) => use.marketIngredientId === 'carrots-whole-baby');
if (carrots.length && carrots.every((use) => use.pantryIngredientIds.length === 1 && use.pantryIngredientIds[0] === 'carrots-fresh')) recipeLinks.push({ marketIngredientId: 'carrots-whole-baby', pantryIngredientId: 'carrots-fresh' });
validateMarketLinkAudit(JSON.parse(readFileSync('catalog/market-link-audit.json', 'utf8')), artifact, recipeLinks, CANONICAL_INGREDIENTS, scopedRecipeUses, marketCounterparts);
const data = { marketCounterpartsHash: sha256(marketCounterparts), marketCounterparts, retainedCatalogs, recipeLinksFormatVersion: recipeLedger.formatVersion, recipeLinksHash: sha256(recipeLinks), recipeLinks, scopedRecipeUsesHash: sha256(scopedRecipeUses), scopedRecipeUses, scopedRecipeContexts, rollbackVersion: baseline.catalogVersion, rollbackIngredientIds: baseline.ingredients.map((r) => r.id), catalogVersion: artifact.catalogVersion, contentHash: artifact.contentHash, ingredients: artifact.ingredients, compatibility: artifact.compatibility };
const content = JSON.stringify(data, null, 2) + '\n';
const output = 'src/data/cooking-catalog.json';
if (process.argv.includes('--check')) {
  if (readFileSync(output, 'utf8') !== content) throw new Error('Cooking catalog is stale; run npm run catalog:build');
} else {
  const staging = `${output}.tmp-${process.pid}`;
  try { writeFileSync(staging, content); renameSync(staging, output); }
  finally { rmSync(staging, { force: true }); }
}
