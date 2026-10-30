import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, symlinkSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CatalogDecision } from '@/types/catalog';
import { decisionHash, makeBaseline } from '../../../scripts/lib/catalog-curation';
let root: string;
const script = resolve('scripts/curate-catalog.ts');
const general = { id: 'lentils-dried', name: 'Dried lentils', aliases: [] };
const canned = { id: 'lentils-canned', name: 'Canned lentils', aliases: [] };
const proposal: CatalogDecision = { id: 'canned-lentils', revision: 1, rulesVersion: 1, status: 'proposed', action: 'upsert', sourceKind: 'CURATED', sourceRefs: [], rationale: 'Cooking-form proposal for review', ingredient: canned };
function save(name: string, value: unknown) { writeFileSync(join(root, name), JSON.stringify(value)); }
function read(name: string) { return JSON.parse(readFileSync(join(root, name), 'utf8')); }
function run(output = join(root, 'out'), additional: string[] = []) {
  return spawnSync(process.execPath, ['--import', 'tsx', script, '--review', join(root, 'review'), '--ledger', join(root, 'ledger.json'), '--previous', join(root, 'baseline.json'), '--output', output, '--version', 'next', ...(additional.includes('--fixtures') ? [] : ['--fixtures', join(root, 'fixtures.json')]), ...additional], { encoding: 'utf8' });
}
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'catalog-curation-cli-')); mkdirSync(join(root, 'review'));
  save('review/source-records.json', { formatVersion: 1, rulesVersion: 1, releaseDate: '2026-10-29', records: [] });
  save('review/report.json', { rulesVersion: 1, counts: { foodRowsByType: { foundation_food: 0, sr_legacy_food: 0 } }, source: { publisher: 'Fixture source', releaseDate: '2026-10-29', files: [] } });
  save('fixtures.json', [{ query: 'dried lentils', expected: [general.id] }]);
  save('baseline.json', makeBaseline([general], 'initial'));
  save('ledger.json', { formatVersion: 1, decisions: [proposal] });
});
afterEach(() => rmSync(root, { recursive: true, force: true }));
describe('catalog curation command', () => {
  it('separates proposed preview from approved content and records an unpublished audit envelope', () => {
    const result = run(); expect(result.status, result.stderr).toBe(0);
    expect(read('out/catalog.json').ingredients).toEqual([general]);
    expect(read('out/preview-catalog.json')).toMatchObject({ status: 'UNAPPROVED_PREVIEW', ingredients: expect.arrayContaining([canned]) });
    expect(read('out/audit.json')).toMatchObject({ published: false, outcome: 'staged', parentVersion: 'initial', sourceManifest: { releaseDate: '2026-10-29' } });
    expect(run(join(root, 'second')).status).toBe(0);
    for (const name of ['catalog.json', 'preview-catalog.json', 'report.json', 'report.md']) expect(readFileSync(join(root, 'out', name))).toEqual(readFileSync(join(root, 'second', name)));
    expect(read('out/audit.json').runId).not.toBe(read('second/audit.json').runId);
  });
  it('does not let passing preview fixtures authorize unapproved publication', () => {
    save('fixtures.json', [{ query: 'lentils', expected: [general.id, canned.id] }]);
    const result = run(join(root, 'out'), ['--fixtures', join(root, 'fixtures.json')]);
    expect(result.status, result.stderr).toBe(2);
    expect(read('out/report.json')).toMatchObject({ publishable: false, fixtureResults: [{ passed: true, approvedPassed: false }] });
    expect(read('out/audit.json').outcome).toBe('blocked');
    save('ledger.json', { formatVersion: 1, decisions: [{ ...proposal, status: 'approved', review: { by: 'fixture-reviewer', date: '2026-10-30', payloadSha256: decisionHash(proposal) } }] });
    const approved = run(join(root, 'approved'), ['--fixtures', join(root, 'fixtures.json')]);
    expect(approved.status, approved.stderr).toBe(0);
    expect(read('approved/report.json').publishable).toBe(true);
    expect(read('approved/catalog.json').ingredients).toContainEqual(canned);
  });
  it('refuses existing output and symlinked descendants of the source without overwriting review work', () => {
    expect(run().status).toBe(0);
    writeFileSync(join(root, 'out', 'notes.txt'), 'Keep human notes');
    expect(run().status).toBe(1);
    expect(readFileSync(join(root, 'out', 'notes.txt'), 'utf8')).toBe('Keep human notes');
    symlinkSync(join(root, 'review'), join(root, 'alias'), 'dir');
    expect(run(join(root, 'alias', 'nested')).status).toBe(1);
    expect(existsSync(join(root, 'review', 'nested'))).toBe(false);
  });
  it('rejects missing source rows and mismatched release manifests before writing an artifact', () => {
    const report = read('review/report.json'); report.counts.foodRowsByType.foundation_food = 1; save('review/report.json', report);
    expect(run().status).toBe(1); expect(existsSync(join(root, 'out'))).toBe(false);
    report.counts.foodRowsByType.foundation_food = 0; report.source.releaseDate = '2026-04-01'; save('review/report.json', report);
    expect(run().stderr).toContain('manifest/rules');
  });
  it('rejects an empty search contract', () => {
    save('fixtures.json', []);
    expect(run().stderr).toContain('nonempty array');
    expect(existsSync(join(root, 'out'))).toBe(false);
  });
  it('prints payload hashes without creating approvals or requiring a source snapshot', () => {
    const result = spawnSync(process.execPath, ['--import', 'tsx', script, '--ledger', join(root, 'ledger.json'), '--decision-hashes'], { encoding: 'utf8' });
    expect(result.status, result.stderr).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual([{ id: proposal.id, revision: 1, payloadSha256: decisionHash(proposal) }]);
    expect(read('ledger.json').decisions[0].status).toBe('proposed');
  });
});
