// @vitest-environment jsdom
// The document shell and its Back link (v2.0 M4-8a): the header, the one h1, the article, the footer and the token color scheme; Back
// returns to the previous page when there is one and falls back to Settings otherwise.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const back = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ back, push: () => undefined }) }));
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children?: unknown }) => createElement('a', { href, 'data-next-link': '', ...rest }, children as never),
}));
import BackLink from '@/components/document/BackLink';
import DocumentShell, { DocCallout, DocLink, DocSection } from '@/components/document/DocumentShell';

let root: Root;
let container: HTMLDivElement;
async function run(action: () => unknown) { await act(async () => { await action(); }); }
async function render(node: ReturnType<typeof createElement>) { await run(() => root.render(node)); }
const setHistory = (length: number) => vi.spyOn(window.history, 'length', 'get').mockReturnValue(length);
function click(element: Element, init: MouseEventInit = {}) {
  const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...init });
  element.dispatchEvent(event);
  return event;
}

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.clearAllMocks();
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await run(() => root.unmount()); container.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals(); document.documentElement.removeAttribute('data-ds'); });

describe('the Back link', () => {
  const link = () => container.querySelector<HTMLAnchorElement>('a')!;

  it('goes back one page when there is history, instead of following the link', async () => {
    setHistory(3);
    await render(createElement(BackLink));
    const event = click(link());
    expect(back).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it('follows the link to Settings when the page was opened on its own', async () => {
    setHistory(1);
    await render(createElement(BackLink));
    expect(link().getAttribute('href')).toBe('/settings');
    const event = click(link());
    expect(back).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it('leaves a modified or non-primary click to the browser', async () => {
    setHistory(3);
    await render(createElement(BackLink));
    for (const init of [{ metaKey: true }, { ctrlKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }]) {
      const event = click(link(), init);
      expect(event.defaultPrevented).toBe(false);
    }
    expect(back).not.toHaveBeenCalled();
  });

  it('takes another fallback, and is a named link of touch size', async () => {
    await render(createElement(BackLink, { fallback: '/' }));
    expect(link().getAttribute('href')).toBe('/');
    expect(link().textContent).toBe('Back');
    expect(link().className).toContain('min-h-touch');
  });
});

describe('the document shell', () => {
  const shell = (extra = {}) => createElement(DocumentShell, {
    label: 'Legal', badge: createElement('span', { 'data-badge': '' }, 'Badge text'), title: 'The Title', subtitle: 'Effective Date: today',
    children: createElement(DocSection, { title: '1. First', children: createElement('p', null, 'Body.') }), ...extra,
  });

  it('has the header with Back and the label, one h1, the badge and dates, the article and the footer', async () => {
    setHistory(1);
    await render(shell());
    const header = container.querySelector('header')!;
    expect(header.querySelector('a')!.textContent).toBe('Back');
    expect(header.querySelector('p')!.textContent).toBe('Legal');
    expect(container.querySelectorAll('h1')).toHaveLength(1);
    expect(container.querySelector('h1')!.textContent).toBe('The Title');
    expect(container.querySelector('article [data-badge]')!.textContent).toBe('Badge text');
    expect(container.querySelector('article')!.textContent).toContain('Effective Date: today');
    expect(container.querySelector('main article h2')!.textContent).toBe('1. First');
    expect(container.querySelector('footer nav[aria-label="Footer legal and support navigation"]')).not.toBeNull();
  });

  it('keeps the article in a readable column', async () => {
    await render(shell());
    expect(container.querySelector('main')!.className).toContain('max-w-3xl');
  });

  it('opts the page into the token color scheme while it is shown', async () => {
    expect(document.documentElement.hasAttribute('data-ds')).toBe(false);
    await render(shell());
    expect(document.documentElement.hasAttribute('data-ds')).toBe(true);
    await run(() => root.unmount());
    expect(document.documentElement.hasAttribute('data-ds')).toBe(false);
    root = createRoot(container);
  });

  it('has a wide variant: a wider column, the heading block and the content as they come, with no article card', async () => {
    setHistory(1);
    await render(shell({ variant: 'wide', subtitle: 'What this page is' }));
    expect(container.querySelector('main')!.className).toContain('max-w-6xl');
    expect(container.querySelector('header .grid')!.className).toContain('max-w-6xl');
    expect(container.querySelector('article')).toBeNull();
    expect(container.querySelectorAll('h1')).toHaveLength(1);
    expect(container.querySelector('main > header h1')!.textContent).toBe('The Title');
    expect(container.querySelector('main > header p')!.textContent).toBe('What this page is');
    expect(container.querySelector('main [data-badge]')!.textContent).toBe('Badge text');
    expect(container.querySelector('main h2')!.textContent).toBe('1. First');
    expect(container.querySelector('footer')).not.toBeNull();
  });

  it('renders a callout with its title as a heading, and links as links', async () => {
    await render(createElement('div', null,
      createElement(DocCallout, { title: '3. Careful', children: createElement('p', null, 'Mind this.') }),
      createElement(DocLink, { href: '/privacy', children: 'Privacy' }),
      createElement(DocLink, { href: 'mailto:a@b.c', children: 'Mail' }),
    ));
    expect(container.querySelector('section h2')!.textContent).toBe('3. Careful');
    const links = [...container.querySelectorAll('a')].map((a) => [a.textContent, a.getAttribute('href')]);
    expect(links).toEqual([['Privacy', '/privacy'], ['Mail', 'mailto:a@b.c']]);
    // an in-app destination is a Link (soft navigation); a mail address is a plain anchor
    expect([...container.querySelectorAll('a')].map((a) => a.hasAttribute('data-next-link'))).toEqual([true, false]);
  });
});

describe('the document pages and shell use tokens only', () => {
  const RAW = /\b(?:bg|text|border|ring|from|to|via|fill|stroke|divide|outline)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d/;
  it.each([
    'src/app/privacy/page.tsx', 'src/app/terms/page.tsx', 'src/app/docs/page.tsx', 'src/components/document/DocumentShell.tsx', 'src/components/document/BackLink.tsx',
    'src/components/SwaggerUIConsole.tsx',
  ])('%s has no raw palette classes', (path) => {
    const offenders = readFileSync(resolve(process.cwd(), path), 'utf8').split('\n').filter((line) => RAW.test(line)).map((line) => line.trim());
    expect(offenders).toEqual([]);
  });
});
