import { afterEach, describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, readdir, rm, stat, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { copyPinnedArtifact, prepareBarcodeDeployment, verifyPinnedArtifact } from '../../../scripts/lib/barcode-deployment';
import pin from '../../../deployment/barcode-artifact.json';
import { BARCODE_MAPPING_DIGEST, BARCODE_PACKET_DIGEST, BARCODE_SOURCE_MANIFEST } from '@/lib/barcodes/approved';
const folders: string[] = [];
const hash = (data: string) => createHash('sha256').update(data).digest('hex');
async function fixture() {
  const directory = await mkdtemp(path.join(tmpdir(), 'barcode-delivery-')); folders.push(directory);
  const index = 'immutable fixture'; const manifest = JSON.stringify({ artifactSha256: hash(index) });
  await writeFile(path.join(directory, 'index.sqlite'), index);
  await writeFile(path.join(directory, 'manifest.json'), manifest);
  return { directory, expected: { artifactSha256: hash(index), artifactBytes: index.length, manifestSha256: hash(manifest) } };
}
afterEach(async () => { for (const directory of folders.splice(0)) await rm(directory, { recursive: true, force: true }); });
describe('pinned deployment delivery', () => {
  it('pins the qualified source and exact release artifact independently of supplied files', () => {
    expect(pin.packetSha256).toBe(BARCODE_PACKET_DIGEST); expect(pin.mappingSha256).toBe(BARCODE_MAPPING_DIGEST);
    expect(pin.sourceManifest).toEqual(BARCODE_SOURCE_MANIFEST); expect(pin.artifactBytes).toBe(115613696);
    expect(pin.mappingCount).toBe(16);
  });
  it('copies only the finalized pair as read-only, leaving raw/operator extras out', async () => {
    const { directory, expected } = await fixture();
    await writeFile(path.join(directory, 'food.csv'), 'source must not ship'); await mkdir(path.join(directory, 'audit'));
    const destination = path.join(directory, 'output');
    await copyPinnedArtifact(directory, destination, expected);
    expect((await readdir(destination)).sort()).toEqual(['index.sqlite', 'manifest.json']);
    expect((await stat(path.join(destination, 'index.sqlite'))).mode & 0o222).toBe(0);
    await expect(verifyPinnedArtifact(destination, expected)).resolves.toMatchObject(expected);
  });
  it('rejects a changed index even if the supplied manifest is updated to match', async () => {
    const { directory, expected } = await fixture();
    await writeFile(path.join(directory, 'index.sqlite'), 'corrupted fixture');
    await writeFile(path.join(directory, 'manifest.json'), JSON.stringify({ artifactSha256: hash('corrupted fixture') }));
    await expect(verifyPinnedArtifact(directory, expected)).rejects.toThrow('digest');
  });
  it('rejects changed manifest, truncated artifact and symlink files', async () => {
    const { directory, expected } = await fixture();
    const manifest = await readFile(path.join(directory, 'manifest.json'));
    await writeFile(path.join(directory, 'manifest.json'), '{}');
    await expect(verifyPinnedArtifact(directory, expected)).rejects.toThrow('digest');
    await writeFile(path.join(directory, 'manifest.json'), manifest);
    await writeFile(path.join(directory, 'index.sqlite'), 'short');
    await expect(verifyPinnedArtifact(directory, expected)).rejects.toThrow('size');
    await rm(path.join(directory, 'index.sqlite'));
    await symlink(path.join(directory, 'manifest.json'), path.join(directory, 'index.sqlite'));
    await expect(verifyPinnedArtifact(directory, expected)).rejects.toThrow('files or size');
  });
  it('refuses destination overwrites and repository-nested deployment output', async () => {
    const { directory, expected } = await fixture();
    await expect(copyPinnedArtifact(directory, directory, expected)).rejects.toThrow();
    await expect(prepareBarcodeDeployment(directory, directory, path.join(directory, 'bundle'))).rejects.toThrow('outside');
    expect(await readFile(path.join(directory, 'index.sqlite'), 'utf8')).toBe('immutable fixture');
  });
  it('requires the reviewed pin by default rather than accepting a new self-signed artifact', async () => {
    const { directory } = await fixture(); await expect(verifyPinnedArtifact(directory)).rejects.toThrow();
  });
});
