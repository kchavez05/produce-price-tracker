import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { PANTRY_INGREDIENTS } from '../src/data/pantry-ingredients';

// The stdlib CSV reader handles quoted commas/newlines without loading the dump
// into memory. No API key, network access, or application database is involved.
const result = spawnSync(process.env.FDC_IMPORT_PYTHON || 'python3', [
  fileURLToPath(new URL('./lib/fdc_catalog_import.py', import.meta.url)),
  ...process.argv.slice(2),
], { input: JSON.stringify(PANTRY_INGREDIENTS), encoding: 'utf8', maxBuffer: 1024 * 1024 });
if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
if (result.error) console.error(`Could not run the importer: ${result.error.message}. Install Python 3.10+ or set FDC_IMPORT_PYTHON.`);
process.exitCode = result.status ?? 1;
