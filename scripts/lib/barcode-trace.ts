import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

/** Inspect the emitted traces, not just the configuration that was meant to produce them. */
export async function verifyBarcodeTrace(root: string, budget = 240 * 1024 * 1024) {
  const lookupTrace = path.join(root, '.next/server/app/api/pantry/barcode-lookup/route.js.nft.json');
  const pair = ['index.sqlite', 'manifest.json'].map((name) => path.join(root, 'data/fdc-barcode-index', name));
  let lookupFiles: Set<string> | undefined;
  async function visit(directory: string): Promise<void> {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const filename = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(filename);
      else if (entry.name.endsWith('.nft.json')) {
        const value: unknown = JSON.parse(await readFile(filename, 'utf8'));
        if (!value || typeof value !== 'object' || !('files' in value) || !Array.isArray(value.files) || !value.files.every((file: unknown) => typeof file === 'string')) throw new Error('Invalid build trace');
        const files = new Set<string>(value.files.map((file: string) => path.resolve(directory, file)));
        const references = [...files].filter((file) => file.startsWith(path.join(root, 'data/fdc-barcode-index') + path.sep));
        if (references.length && filename !== lookupTrace) throw new Error('Barcode artifact leaked into another function trace');
        if (filename === lookupTrace) {
          if (references.length !== 2 || !pair.every((file) => files.has(file))) throw new Error('Lookup trace must contain exactly the pinned artifact pair');
          files.add(filename.replace('.nft.json', '')); // Include the actual route entry.
          lookupFiles = files;
        }
      }
    }
  }
  await visit(path.join(root, '.next'));
  if (!lookupFiles) throw new Error('Lookup build trace is missing');
  let bytes = 0;
  for (const filename of lookupFiles) bytes += (await stat(filename)).size;
  if (bytes > budget) throw new Error('Lookup trace exceeds the uncompressed deployment budget');
  return { files: lookupFiles.size, traceBytes: bytes, budget, artifactOnlyInLookup: true };
}
