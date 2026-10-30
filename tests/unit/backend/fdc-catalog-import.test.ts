import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

let directory: string;
let input: string;
const script = resolve('scripts/lib/fdc_catalog_import.py');
const seed = [{ id: 'red-lentils-dried', name: 'Dried red lentils', aliases: [] }, { id: 'private-unknown', name: 'No such ingredient', aliases: [] }];
function csv(name: string, rows: string[][]) {
  writeFileSync(join(input, name), '\ufeff' + rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\r\n') + '\r\n');
}
function run(output = join(directory, 'review'), existing: unknown = seed) {
  return spawnSync(process.env.FDC_IMPORT_PYTHON || 'python3', [script, '--input', input, '--output', output, '--release', '2026-10-29'],
    { input: JSON.stringify(existing), encoding: 'utf8' });
}
function document(name: string, output = join(directory, 'review')) { return JSON.parse(readFileSync(join(output, name), 'utf8')); }
beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), 'pantry-fdc-test-'));
  input = join(directory, 'source');
  // Keeping source and output separate is part of the importer contract.
  mkdirSync(input);
  csv('food.csv', [
    ['fdc_id', 'data_type', 'description', 'food_category_id', 'publication_date'],
    ['1', 'foundation_food', 'Lentils, dry', '16', '2026-10-29'],
    ['2', 'sr_legacy_food', 'Lentils, raw', '16', '2019-04-01'],
    ['3', 'sr_legacy_food', 'Lentils, pink or red, raw', '16', '2019-04-01'],
    ['4', 'foundation_food', 'Lentils, dry', '16', '2019-04-01'],
    ['5', 'sr_legacy_food', 'Soup, lentil with ham', '6', '2019-04-01'],
    ['6', 'sr_legacy_food', 'Food, "quoted", with\nnewlines é', '16', '2019-04-01'],
    ['7', 'branded_food', 'Ignore brand product', 'Branded string category', '2026-10-29'],
    ['8', 'sr_legacy_food', 'Restaurant, rice meal', '25', '2019-04-01'],
    ['9', 'sr_legacy_food', 'Soup, chicken broth, ready-to-serve', '6', '2019-04-01'],
    ['10', 'sr_legacy_food', 'Lentils, cooked', '16', '2019-04-01'],
  ]);
  csv('foundation_food.csv', [['fdc_id', 'NDB_number', 'footnote'], ['1', '0100', 'Keep source note']]);
  csv('sr_legacy_food.csv', [['fdc_id', 'NDB_number'], ['2', '0100'], ['3', '0101'], ['5', '0102'], ['6', '0103'], ['8', '0104'], ['9', '0105'], ['10', '0106']]);
  csv('food_category.csv', [['id', 'description'], ['16', 'Legumes'], ['6', 'Soups'], ['25', 'Restaurants']]);
});
afterEach(() => rmSync(directory, { recursive: true, force: true }));
describe('USDA candidate catalog importer', () => {
  it('joins the relational files, preserves provenance and quoted Unicode/newline CSV, and keeps identities distinct', () => {
    const result = run(); expect(result.status, result.stderr).toBe(0);
    const candidates = document('candidates.json').candidates;
    expect(candidates).toHaveLength(5);
    const general = candidates.find((c: { candidateId: string }) => c.candidateId === 'usda-ndb:0100');
    expect(general.sourceRecords.map((r: { fdcId: string }) => r.fdcId)).toEqual(['1', '2']);
    expect(general.sourceRecords[0].footnote).toBe('Keep source note');
    expect(candidates.find((c: { candidateId: string }) => c.candidateId === 'usda-ndb:0103').suggestedDisplayName).toBe('Food, "quoted", with\nnewlines é');
    expect(candidates.every((c: { reviewStatus: string }) => c.reviewStatus === 'needs_review')).toBe(true);
    expect(candidates.find((c: { candidateId: string }) => c.candidateId === 'usda-ndb:0106').preparation).toContain('cooked');
    expect(candidates.find((c: { candidateId: string }) => c.candidateId === 'usda-ndb:0101').candidateId).not.toBe(general.candidateId);
    expect(document('excluded.json').map((r: { fdcId: string }) => r.fdcId)).toEqual(['5', '8']);
    expect(candidates.some((c: { primaryFdcId: string }) => c.primaryFdcId === '9')).toBe(true); // Broth is retained.
  });
  it('holds parent-only records and labels name matches as investigation hints, never replacement proof', () => {
    expect(run().status).toBe(0);
    const report = document('report.json');
    expect(report.reconciliation.foundation_food).toMatchObject({ parentRows: 2, subtypeRows: 1,
      parentOnly: [{ fdc_id: '4', sameDescriptionSubtypeIds: ['1'] }] });
    expect(document('candidates.json').candidates.flatMap((c: { sourceRecords: { fdcId: string }[] }) => c.sourceRecords.map((r) => r.fdcId))).not.toContain('4');
    expect(report.counts.foodRowsByType.branded_food).toBe(1);
    expect(report.existingCatalogReview[0]).toMatchObject({ ingredientId: 'private-unknown', status: 'no_search_suggestion' });
    expect(report.existingCatalogReview[1]).toMatchObject({ ingredientId: 'red-lentils-dried', status: 'review_suggestions_only', suggestionCount: 1 });
    expect(report.applicationEffect).toContain('None');
  });
  it('is byte reproducible and never changes the source files or overwrites a previous review', () => {
    const before = readdirSync(input).map((name) => [name, readFileSync(join(input, name), 'utf8')]);
    expect(run().status).toBe(0);
    const second = join(directory, 'second'); expect(run(second).status).toBe(0);
    for (const name of readdirSync(second)) expect(readFileSync(join(second, name))).toEqual(readFileSync(join(directory, 'review', name)));
    expect(readdirSync(input).map((name) => [name, readFileSync(join(input, name), 'utf8')])).toEqual(before);
    writeFileSync(join(directory, 'review', 'human-notes.md'), 'Do not overwrite');
    expect(run().status).toBe(1);
    expect(readFileSync(join(directory, 'review', 'human-notes.md'), 'utf8')).toBe('Do not overwrite');
  });
  it('rejects missing/mismatched parents, duplicate keys, invalid dates and invalid source IDs', () => {
    csv('foundation_food.csv', [['fdc_id', 'NDB_number', 'footnote'], ['999', '1', '']]);
    expect(run().stderr).toContain('missing parent');
    csv('foundation_food.csv', [['fdc_id', 'NDB_number', 'footnote'], ['7', '1', '']]);
    expect(run().stderr).toContain('mismatched food type');
    csv('foundation_food.csv', [['fdc_id', 'NDB_number', 'footnote'], ['1', '1', ''], ['1', '2', '']]);
    expect(run().stderr).toContain('duplicate');
    csv('foundation_food.csv', [['fdc_id', 'NDB_number', 'footnote'], ['not-an-id', '1', '']]);
    expect(run().status).toBe(1);
    csv('foundation_food.csv', [['fdc_id', 'NDB_number', 'footnote'], ['1', '1', '']]);
    csv('food.csv', [['fdc_id', 'data_type', 'description', 'food_category_id', 'publication_date'], ['1', 'foundation_food', 'Lentils', '16', '2026-02-29']]);
    expect(run().stderr).toContain('invalid publication date');
  });
  it('rejects malformed CSV/headers and prevents writing into the source tree', () => {
    expect(run(join(input, 'nested')).stderr).toContain('must be separate');
    csv('foundation_food.csv', [['fdc_id', 'fdc_id'], ['1', '1']]);
    expect(run().stderr).toContain('missing or duplicate columns');
    writeFileSync(join(input, 'foundation_food.csv'), 'fdc_id,NDB_number,footnote\n1,1\n');
    expect(run().stderr).toContain('inconsistent field count');
    writeFileSync(join(input, 'foundation_food.csv'), 'fdc_id,NDB_number,footnote\n"1,1,\n');
    expect(run().status).toBe(1);
  });
  it('treats unknown categories as review warnings and validates the existing catalog', () => {
    csv('food_category.csv', [['id', 'description'], ['6', 'Soup']]);
    expect(run().status).toBe(0);
    expect(document('report.json').unknownCategoryIds).toEqual(['16', '25']);
    expect(run(join(directory, 'bad'), [seed[0], seed[0]]).stderr).toContain('must be unique');
    expect(run(join(directory, 'bad'), [{ id: 'x', name: 'Name', aliases: [false] }]).status).toBe(1);
  });
});
