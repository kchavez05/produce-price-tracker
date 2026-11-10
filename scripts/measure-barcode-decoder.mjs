/** Isolated proposal measurement; does not install packages or edit application dependencies. */
import { createRequire } from 'node:module';
import { gzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const directory = process.argv[2];
if (!directory) throw new Error('Usage: node scripts/measure-barcode-decoder.mjs /path/to/isolated-npm-prefix');
const requireFromProbe = createRequire(path.join(path.resolve(directory), 'package.json'));
const { build, version } = requireFromProbe('esbuild');
if (version !== '0.28.2') throw new Error('This proposal measurement requires isolated esbuild 0.28.2');
const browser = JSON.parse(readFileSync(path.join(directory, 'node_modules/@zxing/browser/package.json')));
const library = JSON.parse(readFileSync(path.join(directory, 'node_modules/@zxing/library/package.json')));
if (browser.version !== '0.2.1' || library.version !== '0.23.0') throw new Error('This proposal measurement requires the reviewed exact package versions');
const result = await build({
  stdin: {
    contents: "import { BrowserMultiFormatReader } from '@zxing/browser'; import { BarcodeFormat, DecodeHintType } from '@zxing/library'; export const createReader=()=>new BrowserMultiFormatReader(new Map([[DecodeHintType.POSSIBLE_FORMATS,[BarcodeFormat.UPC_A,BarcodeFormat.EAN_13]]]));",
    resolveDir: path.resolve(directory), sourcefile: 'camera-probe.ts', loader: 'ts',
  },
  bundle: true, minify: true, format: 'esm', platform: 'browser', target: ['safari16', 'chrome109'], write: false,
});
const data = result.outputFiles[0].contents;
console.log(JSON.stringify({ browser: browser.version, library: library.version, esbuild: version,
  target: ['safari16', 'chrome109'], minifiedBytes: data.length, gzipBytes: gzipSync(data).length,
  scope: 'isolated lazy reader entry; not a measured Next.js chunk or real camera test',
}, null, 2));
