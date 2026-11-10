import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { BarcodeLookupResult, BarcodeProduct, ValidatedBarcode } from '@/types/barcode';
import { BARCODE_MAPPING_DIGEST, BARCODE_PACKET_DIGEST, BARCODE_SCHEMA_VERSION, BARCODE_SNAPSHOT_DATE, BARCODE_SOURCE_MANIFEST, approvedBarcodeMappings, barcodeApprovalValid } from './approved';

const unavailable = (): BarcodeLookupResult => ({ status: 'SERVICE_UNAVAILABLE', message: 'Product lookup is unavailable. Choose an ingredient manually.' });
const object = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === 'object' && !Array.isArray(value));
function expectedMetadata(value: unknown): value is Record<string, unknown> {
  if (!object(value) || value.schemaVersion !== BARCODE_SCHEMA_VERSION || value.snapshotDate !== BARCODE_SNAPSHOT_DATE ||
    value.packetSha256 !== BARCODE_PACKET_DIGEST || value.mappingSha256 !== BARCODE_MAPPING_DIGEST || !object(value.sourceManifest)) return false;
  return Object.entries(BARCODE_SOURCE_MANIFEST).every(([name, expected]) => {
    const entry = (value.sourceManifest as Record<string, unknown>)[name];
    return object(entry) && entry.sha256 === expected.sha256 && entry.bytes === expected.bytes;
  });
}
function text(row: Record<string, unknown>, key: string, max = 1000): string {
  const value = row[key];
  if (typeof value !== 'string' || value.length > max) throw new Error('Invalid product projection');
  return value;
}
function project(row: Record<string, unknown>): BarcodeProduct {
  const fdcId = text(row, 'fdc_id', 24);
  if (!/^[1-9][0-9]*$/.test(fdcId)) throw new Error('Invalid FDC reference');
  const market = text(row, 'market', 80);
  if (!['us', 'united states'].includes(market.trim().toLowerCase())) throw new Error('Invalid product market');
  const publicationDate = text(row, 'published', 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(publicationDate) || publicationDate > BARCODE_SNAPSHOT_DATE) throw new Error('Invalid publication');
  return { source: 'USDA_FDC_BRANDED', fdcId, originalBarcode: text(row, 'raw_code', 14), description: text(row, 'description'),
    brandName: text(row, 'brand', 500) || null, brandOwner: text(row, 'owner', 500) || null, packageLabel: text(row, 'package', 500) || null,
    marketCountry: market, publicationDate, modifiedDate: text(row, 'modified', 10) || null,
    availableDate: text(row, 'available', 10) || null, snapshotDate: BARCODE_SNAPSHOT_DATE,
    sourceUrl: `https://fdc.nal.usda.gov/food-details/${fdcId}/branded` };
}

/** Only operator-controlled immutable public artifacts are opened, always read-only. */
export async function openBarcodeIndex(directory: string) {
  if (!barcodeApprovalValid()) throw new Error('Barcode approval is unavailable');
  const manifestPath = path.join(directory, 'manifest.json');
  if ((await stat(manifestPath)).size > 8192) throw new Error('Invalid barcode manifest');
  const manifest: unknown = JSON.parse(await readFile(manifestPath, 'utf8'));
  if (!expectedMetadata(manifest) || typeof manifest.artifactSha256 !== 'string' || !/^[a-f0-9]{64}$/.test(manifest.artifactSha256) ||
    !Number.isSafeInteger(manifest.artifactBytes) || Number(manifest.artifactBytes) <= 0 || Number(manifest.artifactBytes) > 150 * 1024 * 1024 || manifest.mappingCount !== 16) throw new Error('Unverified barcode artifact');
  const filename = path.join(directory, 'index.sqlite');
  if ((await stat(filename)).size !== manifest.artifactBytes) throw new Error('Barcode artifact size changed');
  const digest = createHash('sha256');
  for await (const chunk of createReadStream(filename)) digest.update(chunk);
  if (digest.digest('hex') !== manifest.artifactSha256) throw new Error('Barcode artifact digest changed');
  const db = new DatabaseSync(filename, { readOnly: true, enableForeignKeyConstraints: true, allowExtension: false });
  try {
    db.exec('PRAGMA query_only=ON; PRAGMA trusted_schema=OFF;');
    const meta = db.prepare('SELECT value FROM barcode_metadata LIMIT 2').all();
    if (meta.length !== 1 || typeof meta[0].value !== 'string' || !expectedMetadata(JSON.parse(meta[0].value))) throw new Error('Barcode metadata mismatch');
    const mappings = db.prepare('SELECT * FROM mappings').all();
    if (mappings.length !== approvedBarcodeMappings.length || !approvedBarcodeMappings.every((rule) => mappings.some((row) =>
      row.fdc_id === rule.fdcId && row.key === rule.key && row.rule_id === rule.ruleId && row.ingredient_id === rule.ingredientId && row.fingerprint === rule.fingerprint))) throw new Error('Barcode mappings changed');
    const head = db.prepare('SELECT * FROM outcomes WHERE key=?');
    const products = db.prepare('SELECT * FROM products WHERE key=? ORDER BY fdc_id LIMIT 6');
    return {
      close: () => db.close(),
      lookup(barcode: ValidatedBarcode): BarcodeLookupResult {
        try {
          const outcome = head.get(barcode.key);
          if (!outcome) return { status: 'NOT_FOUND', message: 'No applicable US product was found in this dated USDA snapshot. Choose an ingredient manually.' };
          if (outcome.dates_valid !== 1) return { status: 'SOURCE_DATE_HOLD', message: 'This source revision has uncertain dates. Choose an ingredient manually.' };
          const count = outcome.ties;
          if (typeof count !== 'number' || !Number.isSafeInteger(count) || count < 1) return unavailable();
          if (count > 1) return { status: 'AMBIGUOUS_PRODUCT', barcode, matchCount: count,
            products: count > 5 ? [] : products.all(barcode.key).map(project) };
          if (outcome.discontinued !== 0) return { status: 'DISCONTINUED', message: 'The latest USDA record is marked discontinued. You can still choose the ingredient manually.' };
          const rows = products.all(barcode.key);
          if (rows.length !== 1 || rows[0].published !== outcome.latest) return unavailable();
          const product = project(rows[0]);
          const rule = approvedBarcodeMappings.find((item) => item.fdcId === product.fdcId && item.key === barcode.key &&
            item.originalBarcode === product.originalBarcode && item.publicationDate === product.publicationDate);
          return { status: 'FOUND', barcode, product, suggestion: rule ? { ingredientId: rule.ingredientId, ruleId: rule.ruleId } : null };
        } catch { return unavailable(); }
      },
    };
  } catch (error) { db.close(); throw error; }
}

let cached: { directory: string; promise: ReturnType<typeof openBarcodeIndex> } | undefined;
export async function lookupConfiguredBarcode(barcode: ValidatedBarcode): Promise<BarcodeLookupResult> {
  const directory = path.resolve(process.env.PANTRYBOT_BARCODE_INDEX_DIR || path.join(process.cwd(), 'data/fdc-barcode-index'));
  if (!cached || cached.directory !== directory) {
    const previous = cached;
    cached = { directory, promise: openBarcodeIndex(directory) };
    if (previous) void previous.promise.then((index) => index.close(), () => {});
  }
  const pending = cached;
  try { return (await pending.promise).lookup(barcode); }
  catch { if (cached === pending) cached = undefined; return unavailable(); }
}
