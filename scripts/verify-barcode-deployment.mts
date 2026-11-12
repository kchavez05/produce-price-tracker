import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { openBarcodeIndex } from '../src/lib/barcodes/index.server';
import { validateBarcode } from '../src/lib/barcodes/validation';
import { verifyPinnedArtifact } from './lib/barcode-deployment';
const directory = path.join(process.cwd(), 'data/fdc-barcode-index');
const receipt = await verifyPinnedArtifact(directory);
const began = performance.now();
const index = await openBarcodeIndex(directory);
try {
  const code = validateBarcode('011110118134');
  if (!code.ok) throw new Error('Invalid probe');
  const result = index.lookup(code.barcode);
  if (result.status !== 'FOUND' || result.suggestion?.ingredientId !== 'olive-oil') throw new Error('Approved lookup probe failed');
} finally { index.close(); }
const db = new DatabaseSync(path.join(directory, 'index.sqlite'), { readOnly: true, allowExtension: false });
try {
  let rejected = false;
  try { db.exec('CREATE TABLE __barcode_readonly_probe(value TEXT)'); } catch { rejected = true; }
  if (!rejected) throw new Error('Artifact was writable');
} finally { db.close(); }
const source = await readFile(path.join(process.cwd(), 'deployment/source-commit.json'), 'utf8').then((text) => JSON.parse(text) as { commit: string }).catch(() => null);
console.log(JSON.stringify({ commit: source?.commit ?? null, ...receipt, readOnly: true, approvedLookup: true, initializationMs: Math.round(performance.now() - began), scope: 'build verification; hosted runtime and shared limiter remain separate gates' }));
