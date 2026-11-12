import { afterEach, expect, it } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { verifyBarcodeTrace } from '../../../scripts/lib/barcode-trace';
const folders: string[] = [];
afterEach(async () => { for (const root of folders.splice(0)) await rm(root, { recursive: true, force: true }); });
async function build() {
  const root = await mkdtemp(path.join(tmpdir(), 'barcode-trace-')); folders.push(root);
  const route = path.join(root, '.next/server/app/api/pantry/barcode-lookup/route.js');
  const asset = path.join(root, 'data/fdc-barcode-index'); await mkdir(path.dirname(route), { recursive: true }); await mkdir(asset, { recursive: true });
  await writeFile(route, 'entry'); await writeFile(path.join(asset, 'index.sqlite'), 'fixture'); await writeFile(path.join(asset, 'manifest.json'), '{}');
  const files = ['index.sqlite', 'manifest.json'].map((file) => path.relative(path.dirname(route), path.join(asset, file)));
  await writeFile(route + '.nft.json', JSON.stringify({ files }));
  return { root, route, files };
}
it('accepts the finalized pair only in the lookup trace and counts uncompressed entry/dependencies', async () => {
  const { root } = await build(); await expect(verifyBarcodeTrace(root)).resolves.toMatchObject({ files: 3, traceBytes: 14, artifactOnlyInLookup: true });
});
it('rejects an artifact accidentally traced into the main page function', async () => {
  const { root } = await build(); const page = path.join(root, '.next/server/app/page.js.nft.json');
  await writeFile(page, JSON.stringify({ files: ['../../../data/fdc-barcode-index/index.sqlite'] }));
  await expect(verifyBarcodeTrace(root)).rejects.toThrow('another function');
});
it('rejects a missing artifact and oversize trace', async () => {
  const { root, route, files } = await build(); await expect(verifyBarcodeTrace(root, 1)).rejects.toThrow('budget');
  await writeFile(route + '.nft.json', JSON.stringify({ files: files.slice(0, 1) }));
  await expect(verifyBarcodeTrace(root)).rejects.toThrow('exactly');
});
