import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { chmod, copyFile, lstat, mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import { execFileSync, spawn } from 'node:child_process';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';
import pin from '../../deployment/barcode-artifact.json';

export interface ArtifactPin { manifestSha256: string; artifactSha256: string; artifactBytes: number }
async function digest(filename: string) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(filename)) hash.update(chunk);
  return hash.digest('hex');
}
/** The reviewed pin is independent of the supplied manifest; never trust a self-declared hash. */
export async function verifyPinnedArtifact(directory: string, expected: ArtifactPin = pin) {
  const manifestPath = path.join(directory, 'manifest.json');
  const indexPath = path.join(directory, 'index.sqlite');
  const [manifestStat, indexStat] = await Promise.all([lstat(manifestPath), lstat(indexPath)]);
  if (!manifestStat.isFile() || !indexStat.isFile() || manifestStat.size > 8192 || indexStat.size !== expected.artifactBytes) throw new Error('Artifact files or size differ from the reviewed pin');
  if (await digest(manifestPath) !== expected.manifestSha256 || await digest(indexPath) !== expected.artifactSha256) throw new Error('Artifact digest differs from the reviewed pin');
  return { artifactBytes: indexStat.size, artifactSha256: expected.artifactSha256, manifestSha256: expected.manifestSha256 };
}

export async function copyPinnedArtifact(source: string, destination: string, expected: ArtifactPin = pin) {
  await verifyPinnedArtifact(source, expected);
  await mkdir(destination); // Never overwrite an existing artifact directory.
  for (const name of ['index.sqlite', 'manifest.json']) {
    await copyFile(path.join(source, name), path.join(destination, name));
    await chmod(path.join(destination, name), 0o444);
  }
  // Detect source changes during copying, before this bundle is deployable.
  await verifyPinnedArtifact(destination, expected);
}

function completed(child: ReturnType<typeof spawn>) {
  return new Promise<void>((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code) => code === 0 ? resolve() : reject(new Error('Source archive command failed')));
  });
}
export async function prepareBarcodeDeployment(repository: string, artifact: string, output: string, expected: ArtifactPin = pin, deploymentTarget: 'preview' | 'production' = 'preview') {
  if (deploymentTarget !== 'preview' && deploymentTarget !== 'production') throw new Error('Invalid deployment target');
  const root = await realpath(repository);
  const parent = await realpath(path.dirname(path.resolve(output)));
  const target = path.join(parent, path.basename(output));
  if (target === root || target.startsWith(root + path.sep)) throw new Error('Deployment output must be outside the repository');
  await verifyPinnedArtifact(artifact, expected);
  await mkdir(target); // Refuse existing destinations, including symlinks.
  const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  const archive = spawn('git', ['archive', '--format=tar', commit], { cwd: root, stdio: ['ignore', 'pipe', 'inherit'] });
  const extract = spawn('tar', ['-xf', '-', '-C', target], { stdio: ['pipe', 'ignore', 'inherit'] });
  await Promise.all([completed(archive), completed(extract), pipeline(archive.stdout!, extract.stdin!)]);
  await mkdir(path.join(target, 'data'), { recursive: true });
  await copyPinnedArtifact(artifact, path.join(target, 'data/fdc-barcode-index'), expected);
  const config = JSON.parse(await readFile(path.join(target, 'vercel.json'), 'utf8'));
  config.buildCommand = 'npm run barcode:verify-deployment && npm run build && npm run barcode:verify-trace';
  await writeFile(path.join(target, 'vercel.json'), JSON.stringify(config, null, 2) + '\n');
  // The bundle contains only tracked source and the finalized pair. Vercel also reads
  // .gitignore, so remove only this artifact exclusion inside the disposable bundle.
  const ignorePath = path.join(target, '.gitignore');
  const ignore = await readFile(ignorePath, 'utf8');
  await writeFile(ignorePath, ignore.split('\n').filter((line) => line.trim() !== '/data/fdc-barcode-index/').join('\n'));
  await writeFile(path.join(target, '.vercelignore'), [
    '.git', '.claude', '.env*', '.vercel', 'node_modules', '.next', 'data/*.sqlite', 'data/*.sqlite-*', 'data/runtime-cache.json', '',
  ].join('\n'));
  await mkdir(path.join(target, 'deployment'), { recursive: true });
  await writeFile(path.join(target, 'deployment/source-commit.json'), JSON.stringify({ commit, target: deploymentTarget }) + '\n');
  return target;
}
