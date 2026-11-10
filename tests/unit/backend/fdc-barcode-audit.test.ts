import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const script = resolve('scripts/audit-fdc-barcodes.py');
const packet = resolve('catalog/proposals/2026-11-09-barcode-qualification');
const python = process.env.FDC_IMPORT_PYTHON || 'python3';
let directory: string;
let input: string;
const code = (data: string) => data + String((10 - [...data].reverse().reduce((sum, digit, i) => sum + Number(digit) * (i % 2 === 0 ? 3 : 1), 0) % 10) % 10);
const a = '036000291452';
const b = code('01111012345');
const c = code('01111054321');
const d = code('01111066666');
function csv(name: string, rows: string[][]) {
  writeFileSync(join(input, name), '\ufeff' + rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\r\n') + '\r\n');
}
function seed() {
  csv('food.csv', [['fdc_id', 'data_type', 'description', 'publication_date'],
    ['1', 'branded_food', 'Earlier active', '2024-01-01'], ['2', 'branded_food', 'Later discontinued', '2025-01-01'],
    ['3', 'branded_food', 'Tie A', '2025-01-01'], ['4', 'branded_food', 'Tie B', '2025-01-01'],
    ['5', 'branded_food', 'Earlier representation', '2024-01-01'], ['6', 'branded_food', 'Latest, "quoted"\nrecord', '2025-01-01'],
    ['7', 'branded_food', 'Unknown date', 'not-a-date'], ['8', 'branded_food', 'Other market', '2025-01-01'],
    ['9', 'branded_food', 'No subtype', '2025-01-01'], ['10', 'foundation_food', 'Not branded', '2025-01-01']]);
  csv('branded_food.csv', [['fdc_id', 'gtin_upc', 'brand_owner', 'brand_name', 'market_country', 'package_weight', 'modified_date', 'available_date', 'discontinued_date'],
    ['1', a, 'Owner', '', 'United States', '15 oz', '', '', ''],
    ['2', a, 'Owner', '', 'US', '15 oz', '', '', '2025-01-01'],
    ['3', b, 'Owner', '', 'US', '', '', '', ''], ['4', b, 'Other owner', '', 'US', '', '', '', ''],
    ['5', c, 'Owner', '', 'US', '', '', '', ''], ['6', `00${c}`, 'Owner', '', 'US', '', '', '', ''],
    ['7', d, 'Owner', '', 'US', '', '', '', ''], ['8', code('931234567890'), 'Owner', '', 'Australia', '', '', '', ''],
    ['11', code('01111077777'), 'No parent', '', 'US', '', '', '', '']]);
}
function run(output = join(directory, 'review')) {
  return spawnSync(python, [script, '--input', input, '--output', output, '--snapshot', '2026-10-29'], { encoding: 'utf8' });
}
function report(output = join(directory, 'review')) { return JSON.parse(readFileSync(join(output, 'report.json'), 'utf8')); }
beforeEach(() => { directory = mkdtempSync(join(tmpdir(), 'fdc-barcode-audit-')); input = join(directory, 'source'); mkdirSync(input); seed(); });
afterEach(() => rmSync(directory, { recursive: true, force: true }));

describe('offline barcode feasibility audit', () => {
  it('preserves leading zeros and only groups validated UPC/EAN zero-fill equivalents', () => {
    const values = [a, `0${a}`, `00${a}`, a.slice(0, -1) + '3', ' ' + a, 'https://example.test/' + a,
      '０３６０００２９１４５２', code('1234567'), code('1036000291452'), code('21111012345'), code('41111012345'), '000000000000', '000000' + code('1234567')];
    const result = spawnSync(python, ['-B', '-c', `import importlib.util,json,sys; s=importlib.util.spec_from_file_location('audit',sys.argv[1]); m=importlib.util.module_from_spec(s); s.loader.exec_module(m); print(json.dumps([m.code_status(v) for v in json.loads(sys.stdin.read())]))`, script], { input: JSON.stringify(values), encoding: 'utf8' });
    expect(result.status, result.stderr).toBe(0);
    const statuses = JSON.parse(result.stdout);
    expect(statuses.slice(0, 3)).toEqual(Array(3).fill(['candidate', `00${a}`]));
    expect(statuses.slice(3).map((row: string[]) => row[0])).toEqual(['bad_check_digit', 'non_digits', 'non_digits', 'non_digits', 'deferred_8_digit', 'packaging_or_variable_measure', 'restricted_reserved_or_nonfood', 'restricted_reserved_or_nonfood', 'restricted_reserved_or_nonfood', 'restricted_reserved_or_nonfood']);
  });
  it('executes every source-code vector from the proposed qualification packet', () => {
    const fixtures = JSON.parse(readFileSync(join(packet, 'fixtures.json'), 'utf8')).fixtures.filter((fixture: { stage: string }) => fixture.stage === 'source_code');
    const result = spawnSync(python, ['-B', '-c', `import importlib.util,json,sys; s=importlib.util.spec_from_file_location('audit',sys.argv[1]); m=importlib.util.module_from_spec(s); s.loader.exec_module(m); print(json.dumps([m.code_status(v['input']['barcode']) for v in json.loads(sys.stdin.read())]))`, script], { input: JSON.stringify(fixtures), encoding: 'utf8' });
    expect(result.status, result.stderr).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual(fixtures.map((fixture: { expected: { status: string; key: string | null } }) => [fixture.expected.status, fixture.expected.key]));
  });
  it('hashes source files without the newer hashlib.file_digest helper', () => {
    const file = join(input, 'food.csv');
    const result = spawnSync(python, ['-B', '-c', `import importlib.util,hashlib,sys; hasattr(hashlib,'file_digest') and delattr(hashlib,'file_digest'); s=importlib.util.spec_from_file_location('audit',sys.argv[1]); m=importlib.util.module_from_spec(s); s.loader.exec_module(m); print(m.digest(m.Path(sys.argv[2])))`, script, file], { encoding: 'utf8' });
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout.trim()).toBe(createHash('sha256').update(readFileSync(file)).digest('hex'));
  });
  it('holds revision ties, invalid dates and newest discontinued records without resurrecting old rows', () => {
    const result = run(); expect(result.status, result.stderr).toBe(0);
    expect(report()).toMatchObject({ status: 'proposal_only_not_runtime_or_approved_mapping', branded_rows: 9,
      missing_branded_parents: 1, parent_only_branded: 1, us_codes_with_multiple_revisions: 3,
      us_keys_with_multiple_raw_representations: 1,
      us_lookup_outcomes: { discontinued_latest: 1, ambiguous_latest: 1, date_hold: 1, single_snapshot_record: 1 },
      storage_probe: { rows: 5, keys: 4, warm_local_lookup_count: 5 } });
    const resultRows = spawnSync(python, ['-c', 'import sqlite3,sys,json; d=sqlite3.connect(sys.argv[1]); print(json.dumps(d.execute("SELECT p.fdc_id,p.raw_code,p.description FROM products p JOIN outcomes h ON h.key=p.key WHERE h.dates_valid=1 AND h.ties=1 AND h.discontinued=0").fetchall()))', join(directory, 'review/lookup-size-probe.sqlite')], { encoding: 'utf8' });
    expect(JSON.parse(resultRows.stdout)).toEqual([['6', `00${c}`, 'Latest, "quoted"\nrecord']]);
  });
  it('is content reproducible, keeps inputs unchanged and refuses to overwrite reviews', () => {
    const before = readFileSync(join(input, 'branded_food.csv'));
    expect(run().status).toBe(0);
    const second = join(directory, 'second'); expect(run(second).status).toBe(0);
    const firstReport = report(), secondReport = report(second);
    for (const item of [firstReport, secondReport]) { delete item.elapsed_seconds; delete item.storage_probe.warm_local_p50_ms; delete item.storage_probe.warm_local_p95_ms; }
    expect(firstReport).toEqual(secondReport);
    expect(readFileSync(join(input, 'branded_food.csv'))).toEqual(before);
    const repeated = run(); expect(repeated.status).not.toBe(0); expect(repeated.stderr).toContain('Output exists');
  });
  it('binds the review packet and exact candidate mappings to retained source evidence without catalog expansion', () => {
    const envelope = JSON.parse(readFileSync(join(packet, 'review-envelope.json'), 'utf8'));
    for (const [file, hash] of Object.entries(envelope.files)) {
      expect(createHash('sha256').update(readFileSync(resolve(file))).digest('hex'), file).toBe(hash);
    }
    expect(createHash('sha256').update(JSON.stringify(envelope.files)).digest('hex')).toBe(envelope.packetSha256);
    const mappings = JSON.parse(readFileSync(join(packet, 'mapping-proposals.json'), 'utf8'));
    const source = JSON.parse(readFileSync(join(packet, 'source-examples.json'), 'utf8')).records;
    const catalog = JSON.parse(readFileSync(resolve('src/data/cooking-catalog.json'), 'utf8')).ingredients;
    const ids = new Set(catalog.map((item: { id: string }) => item.id));
    const positives = mappings.rules.filter((rule: { status: string }) => rule.status === 'proposed_not_active');
    expect(positives).toHaveLength(16);
    expect(new Set(positives.map((rule: { ingredient_id: string }) => rule.ingredient_id)).size).toBe(11);
    expect(mappings.rules.filter((rule: { status: string }) => rule.status === 'hold_no_automatic_mapping')).toHaveLength(29);
    for (const rule of positives) {
      expect(ids.has(rule.ingredient_id)).toBe(true);
      const record = source.find((item: { fdc_id: string }) => item.fdc_id === rule.fdc_id);
      expect(record).toBeDefined();
      expect(rule.source_row_fingerprint).toBe(record.source_row_fingerprint);
      expect(record.us_revision_group).toMatchObject({ latest: record.published, ties: 1, discontinued: 0, dates_valid: 1 });
      const fields = Object.fromEntries(Object.entries(record).filter(([key]) => !['source_row_fingerprint', 'code_status', 'lookup_key', 'us_revision_group'].includes(key)).sort(([a], [b]) => a.localeCompare(b, 'en')));
      // Source field names are ASCII; lexical ordering matches the Python canonical evidence JSON.
      const sorted = Object.fromEntries(Object.keys(fields).sort().map((key) => [key, fields[key]]));
      expect(createHash('sha256').update(JSON.stringify(sorted)).digest('hex')).toBe(rule.source_row_fingerprint);
      expect(rule.lookup_key).toBe(record.lookup_key);
      expect(rule.confirmation_required).toBe(true);
    }
    const decision = JSON.parse(readFileSync(join(packet, 'decisions.json'), 'utf8'));
    expect(decision.approval).toBeNull();
    expect(decision.status).toBe('awaiting_maintainer_decision');
  });
  it('rejects malformed input, nested output, duplicate source IDs and manifest mismatches', () => {
    const invalidDate = spawnSync(python, [script, '--input', input, '--output', join(directory, 'bad-date'), '--snapshot', '20261029'], { encoding: 'utf8' });
    expect(invalidDate.stderr).toContain('YYYY-MM-DD');
    expect(run(join(input, 'nested')).stderr).toContain('non-nested');
    writeFileSync(join(input, 'food.csv'), 'fdc_id,data_type,description\n');
    expect(run().stderr).toContain('headers');
    seed();
    const output = join(directory, 'duplicates');
    csv('food.csv', [['fdc_id', 'data_type', 'description', 'publication_date'], ['1', 'branded_food', 'One', '2025-01-01'], ['1', 'branded_food', 'Two', '2025-01-01']]);
    expect(run(output).stderr).toContain('UNIQUE constraint');
    seed();
    const manifest = join(directory, 'manifest.json'); writeFileSync(manifest, JSON.stringify({ source_manifest: {} }));
    const mismatch = spawnSync(python, [script, '--input', input, '--output', join(directory, 'mismatch'), '--snapshot', '2026-10-29', '--expected-manifest', manifest], { encoding: 'utf8' });
    expect(mismatch.stderr).toContain('manifest differs');
  });
});
