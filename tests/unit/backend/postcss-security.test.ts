import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Exercise the dependency Next actually resolves, including a nested copy.
const require = createRequire(import.meta.url);
const nextRequire = createRequire(require.resolve('next/package.json'));
const postcss = nextRequire('postcss') as typeof import('postcss');
const marker = 'synthetic-private-map-content';
const sourceMap = JSON.stringify({
  version: 3, sources: ['private.css'], names: [], mappings: 'AAAA', sourcesContent: [marker],
});
let directory: string;
let cssDirectory: string;

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), 'pantrybot-postcss-'));
  cssDirectory = join(directory, 'public');
  mkdirSync(cssDirectory);
  writeFileSync(join(directory, 'private.map'), sourceMap);
  writeFileSync(join(cssDirectory, 'local.map'), sourceMap);
});
afterEach(() => rmSync(directory, { recursive: true, force: true }));

describe('Next-resolved PostCSS source-map boundary', () => {
  it('does not load an absolute map path when the CSS origin is unknown', () => {
    const css = `a{color:red}\n/*# sourceMappingURL=${join(directory, 'private.map')} */`;
    const root = postcss.parse(css, { from: undefined });
    expect(root.source?.input.map?.text ?? '').not.toContain(marker);
  });

  it('does not load a map outside the originating CSS directory', () => {
    const root = postcss.parse('a{color:red}\n/*# sourceMappingURL=../private.map */', {
      from: join(cssDirectory, 'input.css'),
    });
    expect(root.source?.input.map?.text ?? '').not.toContain(marker);
  });

  it('still supports an ordinary map beside the originating CSS file', () => {
    const root = postcss.parse('a{color:red}\n/*# sourceMappingURL=local.map */', {
      from: join(cssDirectory, 'input.css'),
    });
    expect(root.source?.input.map?.text).toContain(marker);
  });
});
