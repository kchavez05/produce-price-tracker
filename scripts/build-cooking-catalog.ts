import { readFileSync, writeFileSync, renameSync, rmSync } from 'node:fs';
import { parseArtifact, parseLedger, decisionHash } from './lib/catalog-curation';

// Only the reviewed release can generate browser data; raw sources stay server-side.
const artifact = parseArtifact(JSON.parse(readFileSync('catalog/releases/2026-10-30.1/catalog.json', 'utf8')));
const ledger = parseLedger(JSON.parse(readFileSync('catalog/curation-ledger.json', 'utf8')));
for (const history of artifact.decisions) {
  const decision = ledger.decisions.find((d) => d.id === history.id && d.revision === history.revision);
  if (!decision || decision.status !== 'approved' || decisionHash(decision) !== history.payloadSha256) throw new Error('Catalog approval history does not match ledger');
}
const baseline = parseArtifact(JSON.parse(readFileSync('catalog/baseline-1.5.2.json', 'utf8')));
const data = { rollbackVersion: baseline.catalogVersion, rollbackIngredientIds: baseline.ingredients.map((r) => r.id), catalogVersion: artifact.catalogVersion, contentHash: artifact.contentHash, ingredients: artifact.ingredients, compatibility: artifact.compatibility };
const content = JSON.stringify(data, null, 2) + '\n';
const output = 'src/data/cooking-catalog.json';
if (process.argv.includes('--check')) {
  if (readFileSync(output, 'utf8') !== content) throw new Error('Cooking catalog is stale; run npm run catalog:build');
} else {
  const staging = `${output}.tmp-${process.pid}`;
  try { writeFileSync(staging, content); renameSync(staging, output); }
  finally { rmSync(staging, { force: true }); }
}
