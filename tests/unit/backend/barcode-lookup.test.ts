import { describe, expect, it, afterEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import fixtures from '../../../catalog/proposals/2026-11-09-barcode-qualification/fixtures.json';
import examples from '../../../catalog/proposals/2026-11-09-barcode-qualification/source-examples.json';
import { validateBarcode } from '@/lib/barcodes/validation';
import { openBarcodeIndex } from '@/lib/barcodes/index.server';
import { approvedBarcodeMappings, BARCODE_MAPPING_DIGEST, BARCODE_PACKET_DIGEST, BARCODE_SOURCE_MANIFEST, barcodeApprovalValid } from '@/lib/barcodes/approved';
import { prepareBarcodeAddition } from '@/lib/barcodes/confirmation';
import type { PantryEntry } from '@/types/pantry';

const folders: string[] = [];
afterEach(() => { for (const folder of folders.splice(0)) rmSync(folder, { recursive: true, force: true }); });
const metadata = { schemaVersion: 1, snapshotDate: '2026-10-29', packetSha256: BARCODE_PACKET_DIGEST, mappingSha256: BARCODE_MAPPING_DIGEST, sourceManifest: BARCODE_SOURCE_MANIFEST };
function artifact(extra: (db: DatabaseSync) => void = () => {}) {
  const directory = mkdtempSync(join(tmpdir(), 'barcode-index-')); folders.push(directory);
  const filename = join(directory, 'index.sqlite'); const db = new DatabaseSync(filename);
  db.exec(`CREATE TABLE barcode_metadata(value TEXT); CREATE TABLE mappings(fdc_id TEXT,key TEXT,rule_id TEXT,ingredient_id TEXT,fingerprint TEXT);
    CREATE TABLE products(key TEXT,fdc_id TEXT,raw_code TEXT,description TEXT,owner TEXT,brand TEXT,package TEXT,market TEXT,published TEXT,modified TEXT,available TEXT,discontinued TEXT);
    CREATE TABLE outcomes(key TEXT,latest TEXT,revisions INTEGER,dates_valid INTEGER,ties INTEGER,discontinued INTEGER);
    CREATE INDEX product_key ON products(key); CREATE UNIQUE INDEX outcome_key ON outcomes(key);`);
  db.prepare('INSERT INTO barcode_metadata VALUES(?)').run(JSON.stringify(metadata));
  for (const rule of approvedBarcodeMappings) {
    const row = examples.records.find((r) => r.fdc_id === rule.fdcId)!;
    db.prepare('INSERT INTO products VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').run(rule.key, rule.fdcId, row.gtin_upc, row.description, row.brand_owner, row.brand_name, row.package_weight, row.market_country, row.published, row.modified_date, row.available_date, row.discontinued_date);
    db.prepare('INSERT INTO mappings VALUES(?,?,?,?,?)').run(rule.fdcId, rule.key, rule.ruleId, rule.ingredientId, rule.fingerprint);
    db.prepare('INSERT INTO outcomes VALUES(?,?,?,?,?,?)').run(rule.key, row.published, 1, 1, 1, 0);
  }
  extra(db); db.close();
  const bytes = readFileSync(filename);
  writeFileSync(join(directory, 'manifest.json'), JSON.stringify({ ...metadata, artifactSha256: createHash('sha256').update(bytes).digest('hex'), artifactBytes: bytes.length, mappingCount: 16 }));
  return directory;
}
const validated = (code: string) => { const result = validateBarcode(code); if (!result.ok) throw new Error(result.message); return result.barcode; };

describe('approved barcode validation', () => {
  for (const fixture of fixtures.fixtures) {
    if (fixture.stage !== 'source_code' || fixture.id === 'source-whitespace') continue;
    it(fixture.id, () => {
      const result = validateBarcode(fixture.input.barcode);
      if ('status' in fixture.expected && fixture.expected.status === 'candidate') {
        expect(result).toMatchObject({ ok: true, barcode: { key: fixture.expected.key, original: fixture.input.barcode } });
      } else expect(result.ok).toBe(false);
    });
  }
  it('preserves manual formatting separately and rejects non-string or wrong decoded formats', () => {
    expect(validateBarcode(' 036000291452 ')).toMatchObject({ ok: true, barcode: { original: ' 036000291452 ', digits: '036000291452', key: '00036000291452' } });
    for (const value of [36000291452, null, {}, '03600-0291452', '036000291452\n']) expect(validateBarcode(value).ok).toBe(false);
    expect(validateBarcode('036000291452', 'EAN_13')).toMatchObject({ ok: false, status: 'UNSUPPORTED' });
    expect(validateBarcode('036000291452', { toString: 'MANUAL' }).ok).toBe(false);
    expect(barcodeApprovalValid()).toBe(true);
  });
});

describe('read-only versioned public-product index', () => {
  it('returns only exact approved suggestions without amounts, prices or inventory', async () => {
    const index = await openBarcodeIndex(artifact());
    try {
      for (const rule of approvedBarcodeMappings) {
        const result = index.lookup(validated(rule.originalBarcode));
        expect(result).toMatchObject({ status: 'FOUND', product: { fdcId: rule.fdcId, originalBarcode: rule.originalBarcode, snapshotDate: '2026-10-29' }, suggestion: { ingredientId: rule.ingredientId, ruleId: rule.ruleId } });
        expect(JSON.stringify(result)).not.toContain('ingredients');
        expect(JSON.stringify(result)).not.toContain('packagePrice');
      }
      expect(index.lookup(validated('036000291452')).status).toBe('NOT_FOUND');
    } finally { index.close(); }
  });
  it('holds tied, discontinued and uncertain-date heads instead of choosing old records', async () => {
    const rule = approvedBarcodeMappings[0];
    for (const change of ["ties=2", "discontinued=1", "dates_valid=0"]) {
      const index = await openBarcodeIndex(artifact((db) => db.exec(`UPDATE outcomes SET ${change}`)));
      try { expect(index.lookup(validated(rule.originalBarcode)).status).toBe(change === 'ties=2' ? 'AMBIGUOUS_PRODUCT' : change === 'discontinued=1' ? 'DISCONTINUED' : 'SOURCE_DATE_HOLD'); }
      finally { index.close(); }
    }
  });
  it('fails closed on digest, metadata and exact-mapping changes', async () => {
    const directory = artifact(); const filename = join(directory, 'index.sqlite');
    const bytes = readFileSync(filename); bytes[bytes.length - 1] ^= 1; writeFileSync(filename, bytes);
    await expect(openBarcodeIndex(directory)).rejects.toThrow('digest');
    await expect(openBarcodeIndex(artifact((db) => db.exec("UPDATE mappings SET ingredient_id='garlic-fresh'")))).rejects.toThrow('mappings');
    await expect(openBarcodeIndex(artifact((db) => db.exec("UPDATE barcode_metadata SET value='{}'")))).rejects.toThrow('metadata');
  });
});

describe('explicit barcode addition intent', () => {
  it('keeps Yes/No details, captured revision and operation identity stable without source package data', () => {
    const entry: PantryEntry = { id: 'oil', ingredientId: 'olive-oil', displayName: 'My oil', available: false, quantity: 0, unit: 'tbsp', location: 'FRIDGE', useByDate: '2000-01-01', revision: 7, updatedAtIso: '' };
    const before = JSON.stringify(entry);
    const intent = prepareBarcodeAddition([entry], { ingredientId: 'olive-oil', displayName: 'Olive oil', available: true }, () => 'stable-id');
    expect(intent).toEqual({ input: { ingredientId: 'olive-oil', displayName: 'My oil', available: true, quantity: 0, unit: 'tbsp', location: 'FRIDGE', useByDate: '2000-01-01' }, entryId: 'oil', intent: { mutationId: 'stable-id', expectedRevision: 7 }, priorAvailability: 'No' });
    expect(JSON.stringify(entry)).toBe(before);
  });
  it('keeps a custom selection private and distinct from a same-name catalog entry', () => {
    const entry: PantryEntry = { id: 'oil', ingredientId: 'olive-oil', displayName: 'Olive oil', available: true, revision: 1, updatedAtIso: '' };
    const intent = prepareBarcodeAddition([entry], { displayName: 'Olive oil', available: true }, () => 'new-id');
    expect(intent.priorAvailability).toBe('New'); expect(intent.input.ingredientId).toBeUndefined();
    expect(intent.intent.expectedRevision).toBe(0);
  });
});
