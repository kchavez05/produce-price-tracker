// @vitest-environment jsdom
// The Swagger console wrapper (v2.0 M4-8b): what it asks Swagger UI for, its loading and error states, Copy Spec URL, the raw spec link and
// the quick filters. Written against the old toolbar first, then pointed at the token-based one: Swagger UI itself is third-party and stays
// untouched, so this pins how the wrapper drives it. Swagger UI is replaced by a recorder.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';

const bundle = vi.fn();
let importFails: Error | null = null;
vi.mock('swagger-ui-dist/swagger-ui.css', () => ({}));
vi.mock('swagger-ui-dist', () => ({
  get SwaggerUIBundle() {
    if (importFails) throw importFails;
    const fn = Object.assign((config: Record<string, unknown>) => {
      bundle(config);
      const domNode = config.domNode as HTMLElement;
      domNode.innerHTML = '<div class="swagger-ui"><div class="filter-container"><input type="text" aria-label="Filter by tag" /></div></div>';
    }, { presets: { apis: 'apis' } });
    return fn;
  },
  SwaggerUIStandalonePreset: 'standalone',
}));
import { expectNoA11yViolations } from 'tests/helpers/render';
import SwaggerUIConsole from '@/components/SwaggerUIConsole';

let root: Root;
let container: HTMLDivElement;
async function run(action: () => unknown) { await act(async () => { await action(); }); }
async function mount(specUrl?: string) {
  await run(() => root.render(createElement(SwaggerUIConsole, specUrl ? { specUrl } : {})));
  await run(() => new Promise((resolve) => setTimeout(resolve, 0)));
}
const button = (label: string) => [...container.querySelectorAll('button')].find((b) => b.textContent?.includes(label))!;

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.clearAllMocks();
  importFails = null;
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await run(() => root.unmount()); container.remove(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('driving Swagger UI', () => {
  it('starts it once on the spec with the console settings', async () => {
    await mount();
    expect(bundle).toHaveBeenCalledTimes(1);
    const config = bundle.mock.calls[0][0];
    expect(config).toMatchObject({
      url: '/api/openapi.json', deepLinking: true, layout: 'BaseLayout', docExpansion: 'list', filter: true, tryItOutEnabled: true,
      displayRequestDuration: true, persistAuthorization: true, defaultModelsExpandDepth: 1, defaultModelExpandDepth: 1,
      showExtensions: true, showCommonExtensions: true,
    });
    expect(config.presets).toEqual(['apis', 'standalone']);
    expect((config.domNode as HTMLElement).id).toBe('swagger-ui-container');
  });

  it('takes another spec URL', async () => {
    await mount('/api/other.json');
    expect(bundle.mock.calls[0][0].url).toBe('/api/other.json');
  });

  it('shows the console and no loading message once it is up', async () => {
    await mount();
    expect(container.textContent).not.toContain('Initializing Swagger UI');
    expect(container.querySelector('.swagger-ui')).not.toBeNull();
  });

  it('shows a loading message while Swagger UI is still being loaded', async () => {
    act(() => { root.render(createElement(SwaggerUIConsole, {})); }); // synchronous: Swagger UI's bundle has not resolved yet
    expect(container.textContent).toContain('Initializing Swagger UI & OpenAPI Spec...');
    await run(() => new Promise((resolve) => setTimeout(resolve, 0)));
  });

  it('says it could not load, with the error and a link to the spec, when Swagger UI fails to start', async () => {
    importFails = new Error('chunk failed');
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await mount();
    expect(container.textContent).toContain('Failed to load Swagger UI Console');
    expect(container.textContent).toContain('chunk failed');
    const link = [...container.querySelectorAll('a')].find((a) => a.textContent?.includes('Inspect'))!;
    expect(link.getAttribute('href')).toBe('/api/openapi.json');
    expect(container.textContent).not.toContain('Initializing Swagger UI');
    expect(container.querySelector('[role=alert]')!.textContent).toContain('Failed to load Swagger UI Console'); // announced as an alert
  });
});

describe('the toolbar', () => {
  it('copies the full spec URL and confirms it for two seconds', async () => {
    const writeText = vi.fn(async () => undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    await mount();
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    expect(button('Copy Spec URL')).toBeDefined();
    await run(() => button('Copy Spec URL').click());
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/api/openapi.json`);
    expect(button('Copied URL!')).toBeDefined();
    await run(() => { vi.advanceTimersByTime(2000); });
    expect(button('Copy Spec URL')).toBeDefined();
  });

  it('links to the raw spec in a new tab, safely', async () => {
    await mount();
    const link = [...container.querySelectorAll('a')].find((a) => a.textContent?.includes('Raw openapi.json'))!;
    expect(link.getAttribute('href')).toBe('/api/openapi.json');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('names what the console covers', async () => {
    await mount();
    for (const text of ['OpenAPI 3.1.0 Standard', 'Zero-Key Offline Resilience', 'PostgreSQL RLS & SQLite']) expect(container.textContent).toContain(text);
  });
});

describe('the quick filters', () => {
  const labels = ['All', 'Dashboard & Deals', 'Locations & Stores', 'Virtual Pantry', 'Retired Inventory', 'Saved Recipes', 'AI Meal Planner', 'Cloud Sync', 'Account & GDPR', 'Automation & Cron'];
  const pills = () => [...container.querySelectorAll<HTMLButtonElement>('[data-quick-filter] button')];

  it('lists the ten filters in order', async () => {
    await mount();
    expect(pills().map((b) => b.textContent)).toEqual(labels);
  });

  it('starts on All, and moves the selection to the pill that was pressed', async () => {
    await mount();
    expect(pills().map((b) => b.getAttribute('aria-pressed'))).toEqual(['true', ...Array(9).fill('false')]);
    await run(() => pills()[3].click());
    expect(pills().map((b) => b.getAttribute('aria-pressed'))).toEqual(['false', 'false', 'false', 'true', ...Array(6).fill('false')]);
    await run(() => pills()[0].click());
    expect(pills()[0].getAttribute('aria-pressed')).toBe('true');
  });

  it('types the pill into the Swagger filter box and tells it, so Swagger filters', async () => {
    await mount();
    const input = container.querySelector<HTMLInputElement>('.swagger-ui .filter-container input')!;
    const seen: string[] = [];
    input.addEventListener('input', () => seen.push(input.value));
    await run(() => pills().find((b) => b.textContent === 'Cloud Sync')!.click());
    expect(input.value).toBe('Sync');
    expect(seen).toEqual(['Sync']);
    await run(() => pills().find((b) => b.textContent === 'Dashboard & Deals')!.click());
    expect(input.value).toBe('Dashboard');
    await run(() => pills()[0].click());
    expect(input.value).toBe('');
  });
});

describe('the Swagger panel', () => {
  const panel = () => container.querySelector('#swagger-ui-container')!.parentElement!;

  it('stays a light panel in both themes, and scrolls sideways on a narrow screen instead of widening the page (#546)', async () => {
    await mount();
    expect(panel().className).toContain('bg-white');
    expect(panel().className).toContain('[color-scheme:light]');
    expect(panel().className).toContain('overflow-x-auto');
    expect(container.querySelector('#swagger-ui-container')!.className).toContain('min-w-0');
  });

  it('is hidden while Swagger UI loads, and shown after', async () => {
    act(() => { root.render(createElement(SwaggerUIConsole, {})); });
    expect(panel().className).toContain('opacity-0');
    await run(() => new Promise((resolve) => setTimeout(resolve, 0)));
    expect(panel().className).toContain('opacity-100');
  });

  it('has no accessibility violations in the toolbar, with the console up and with the error', async () => {
    await mount();
    await expectNoA11yViolations(container);
    await run(() => root.unmount());
    root = createRoot(container);
    importFails = new Error('chunk failed');
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await mount();
    await expectNoA11yViolations(container);
  });
});
