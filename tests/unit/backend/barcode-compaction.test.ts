import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import examples from '../../../catalog/proposals/2026-11-09-barcode-qualification/source-examples.json';
import { approvedBarcodeMappings, BARCODE_MAPPING_DIGEST, BARCODE_PACKET_DIGEST, BARCODE_SOURCE_MANIFEST } from '@/lib/barcodes/approved';
import { openBarcodeIndex } from '@/lib/barcodes/index.server';
import { validateBarcode } from '@/lib/barcodes/validation';

const hash = (bytes: Uint8Array | string) => createHash('sha256').update(bytes).digest('hex');
let directory: string, source: string;
let pin: { artifactBytes: number; artifactSha256: string; manifestSha256: string };
function repinFixture() {
  const bytes = readFileSync(join(source, 'index.sqlite'));
  const manifest = JSON.parse(readFileSync(join(source, 'manifest.json'), 'utf8'));
  manifest.artifactBytes = bytes.length; manifest.artifactSha256 = hash(bytes);
  const text = JSON.stringify(manifest); writeFileSync(join(source, 'manifest.json'), text);
  pin = { artifactBytes: bytes.length, artifactSha256: hash(bytes), manifestSha256: hash(text) };
}
function run(output = join(directory, 'compact')) {
  // Only the imported test function accepts a fixture pin; the production CLI pins v1 itself.
  return spawnSync(process.env.FDC_IMPORT_PYTHON || 'python3', ['-B', '-c',
    "import importlib.util,json,sys; s=importlib.util.spec_from_file_location('compact',sys.argv[1]); m=importlib.util.module_from_spec(s); s.loader.exec_module(m); print(json.dumps(m.compact(m.Path(sys.argv[2]),m.Path(sys.argv[3]),json.load(sys.stdin))))",
    resolve('scripts/compact-fdc-barcode-index.py'), source, output], { input: JSON.stringify(pin), encoding: 'utf8' });
}
beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), 'barcode-compact-')); source = join(directory, 'source'); mkdirSync(source);
  const db = new DatabaseSync(join(source, 'index.sqlite'));
  db.exec(`CREATE TABLE barcode_metadata(value TEXT); CREATE TABLE mappings(fdc_id TEXT PRIMARY KEY,key TEXT,rule_id TEXT,ingredient_id TEXT,fingerprint TEXT);
    CREATE TABLE products(key TEXT,fdc_id TEXT,raw_code TEXT,description TEXT,owner TEXT,brand TEXT,package TEXT,market TEXT,published TEXT,modified TEXT,available TEXT,discontinued TEXT);
    CREATE TABLE outcomes(key TEXT,latest TEXT,revisions INTEGER,dates_valid INTEGER,ties INTEGER,discontinued INTEGER);
    CREATE INDEX lookup_key ON products(key); CREATE UNIQUE INDEX outcome_key ON outcomes(key);`);
  const metadata = { schemaVersion: 1, snapshotDate: '2026-10-29', packetSha256: BARCODE_PACKET_DIGEST, mappingSha256: BARCODE_MAPPING_DIGEST, sourceManifest: BARCODE_SOURCE_MANIFEST };
  db.prepare('INSERT INTO barcode_metadata VALUES(?)').run(JSON.stringify(metadata));
  const product = db.prepare('INSERT INTO products VALUES(?,?,?,?,?,?,?,?,?,?,?,?)');
  const outcome = db.prepare('INSERT INTO outcomes VALUES(?,?,?,?,?,?)');
  for (const rule of approvedBarcodeMappings) {
    const row = examples.records.find((item) => item.fdc_id === rule.fdcId)!;
    product.run(rule.key, rule.fdcId, row.gtin_upc, row.description, row.brand_owner, row.brand_name, row.package_weight, row.market_country, row.published, row.modified_date, row.available_date, row.discontinued_date);
    outcome.run(rule.key, row.published, 1, 1, 1, 0);
    db.prepare('INSERT INTO mappings VALUES(?,?,?,?,?)').run(rule.fdcId, rule.key, rule.ruleId, rule.ingredientId, rule.fingerprint);
  }
  for (let i = 1; i <= 1000; i++) {
    const key = String(i).padStart(14, '0');
    product.run(key, String(10000000 + i), key, 'Crème, "quoted"\n' + 'Public label '.repeat(20), '', 'Same brand', '12 oz', 'US', '2026-01-01', '', '2026-01-01', '');
    outcome.run(key, '2026-01-01', i % 3 + 1, i % 2, 1, i % 2);
  }
  db.close();
  const bytes = readFileSync(join(source, 'index.sqlite'));
  const manifest = JSON.stringify({ ...metadata, artifactBytes: bytes.length, artifactSha256: hash(bytes), mappingCount: 16, productRows: 1016, lookupKeys: 1016 });
  writeFileSync(join(source, 'manifest.json'), manifest);
  pin = { artifactBytes: bytes.length, artifactSha256: hash(bytes), manifestSha256: hash(manifest) };
});
afterEach(() => rmSync(directory, { recursive: true, force: true }));

describe('lossless offline barcode compaction', () => {
  it('preserves every logical row/type/field and indexed read-only runtime suggestions', async () => {
    const result = run(); expect(result.status, result.stderr).toBe(0);
    const manifest = JSON.parse(result.stdout); expect(manifest.artifactBytes).toBeLessThan(pin.artifactBytes);
    const db = new DatabaseSync(join(directory, 'compact/index.sqlite'), { readOnly: true });
    db.prepare('ATTACH DATABASE ? AS original').run(`file:${join(source, 'index.sqlite')}?mode=ro`);
    for (const table of ['products', 'outcomes', 'mappings', 'barcode_metadata']) {
      expect(db.prepare(`SELECT * FROM ${table} EXCEPT SELECT * FROM original.${table}`).all()).toEqual([]);
      expect(db.prepare(`SELECT * FROM original.${table} EXCEPT SELECT * FROM ${table}`).all()).toEqual([]);
      expect(db.prepare(`SELECT COUNT(*) n FROM ${table}`).get()).toEqual(db.prepare(`SELECT COUNT(*) n FROM original.${table}`).get());
    }
    const rule = approvedBarcodeMappings[0];
    const plan = db.prepare('EXPLAIN QUERY PLAN SELECT * FROM products WHERE key=? ORDER BY fdc_id LIMIT 6').all(rule.key);
    expect(plan.some((row) => String(row.detail).includes('SEARCH p USING PRIMARY KEY'))).toBe(true);
    expect(() => db.exec('CREATE TABLE forbidden(value TEXT)')).toThrow(); db.close();
    const index = await openBarcodeIndex(join(directory, 'compact'));
    try {
      for (const mapping of approvedBarcodeMappings) {
        const code = validateBarcode(mapping.originalBarcode); if (!code.ok) throw new Error('Invalid fixture');
        expect(index.lookup(code.barcode)).toMatchObject({ status: 'FOUND', product: { fdcId: mapping.fdcId, originalBarcode: mapping.originalBarcode }, suggestion: { ingredientId: mapping.ingredientId } });
      }
    } finally { index.close(); }
    expect(hash(readFileSync(join(source, 'index.sqlite')))).toBe(pin.artifactSha256);
  });
  it('is byte reproducible and refuses output overwrite or source-nested output', () => {
    expect(run().status).toBe(0); expect(run(join(directory, 'second')).status).toBe(0);
    for (const file of ['index.sqlite', 'manifest.json']) expect(readFileSync(join(directory, 'compact', file))).toEqual(readFileSync(join(directory, 'second', file)));
    expect(run().stderr).toContain('Output exists');
    expect(run(join(source, 'nested')).stderr).toContain('non-nested');
  });
  it('rejects a changed source even when its manifest is rewritten, and rejects symlinks', () => {
    const bytes = readFileSync(join(source, 'index.sqlite')); bytes[bytes.length - 1] ^= 1; writeFileSync(join(source, 'index.sqlite'), bytes);
    writeFileSync(join(source, 'manifest.json'), JSON.stringify({ artifactSha256: hash(bytes) }));
    expect(run().stderr).toContain('digest differs');
    rmSync(join(source, 'index.sqlite')); symlinkSync(join(source, 'manifest.json'), join(source, 'index.sqlite'));
    expect(run().stderr).toContain('non-symlink');
  });
  it('rejects SQLite sidecars and cannot override the production CLI source pin', () => {
    writeFileSync(join(source, 'index.sqlite-wal'), 'uncommitted state');
    expect(run().stderr).toContain('sidecars'); rmSync(join(source, 'index.sqlite-wal'));
    const result = spawnSync(process.env.FDC_IMPORT_PYTHON || 'python3', ['-B', resolve('scripts/compact-fdc-barcode-index.py'), '--input', source, '--output', join(directory, 'cli')], { encoding: 'utf8' });
    expect(result.status).not.toBe(0); expect(result.stderr).toMatch(/reviewed (?:repack )?pin/);
    const wrongVersion = spawnSync(process.env.FDC_IMPORT_PYTHON || 'python3', ['-B', '-c',
      "import importlib.util,sys; s=importlib.util.spec_from_file_location('compact',sys.argv[1]); m=importlib.util.module_from_spec(s); s.loader.exec_module(m); m.sqlite3.sqlite_version='0.0.0'; m.compact(m.Path(sys.argv[2]),m.Path(sys.argv[3]))",
      resolve('scripts/compact-fdc-barcode-index.py'), source, join(directory, 'wrong-version')], { encoding: 'utf8' });
    expect(wrongVersion.stderr).toContain('SQLite version differs');
  });
  it.each(['duplicate', 'null', 'blob', 'integer', 'column'])('refuses unsupported %s input without publishing a manifest', (change) => {
    const db = new DatabaseSync(join(source, 'index.sqlite'));
    if (change === 'duplicate') db.exec('INSERT INTO products SELECT * FROM products LIMIT 1');
    if (change === 'null') db.exec('UPDATE products SET description=NULL WHERE rowid=1');
    if (change === 'blob') db.prepare('UPDATE products SET description=? WHERE rowid=1').run(Buffer.from('unsupported blob'));
    if (change === 'integer') db.exec(`ALTER TABLE products RENAME TO old_products;
      CREATE TABLE products AS SELECT key,fdc_id,raw_code,+description AS description,owner,brand,package,market,published,modified,available,discontinued FROM old_products;
      DROP TABLE old_products; UPDATE products SET description=1 WHERE rowid=1;`);
    if (change === 'column') db.exec('ALTER TABLE products ADD COLUMN extra TEXT');
    db.close(); repinFixture();
    const result = run(); expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/UNIQUE|NOT NULL|Unsupported SQLite value type|changed logical rows/);
    expect(() => readFileSync(join(directory, 'compact/manifest.json'))).toThrow();
  });
});
