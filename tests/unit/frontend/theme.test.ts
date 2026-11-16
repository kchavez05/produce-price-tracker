// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { THEME_STORAGE_KEY, parseThemePreference, resolveTheme, themeColors, themeInitScript } from '@/design/theme';
import { useTheme } from '@/hooks/useTheme';
import { renderUi, type RenderHandle } from '../../helpers/render';

let dark = false;
const listeners = new Set<() => void>();
function stubMedia() {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('dark') && dark, media: query,
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
  }));
}
const root = () => document.documentElement;
let handle: RenderHandle | undefined;

beforeEach(() => { dark = false; listeners.clear(); window.localStorage.clear(); root().removeAttribute('data-theme'); root().removeAttribute('data-ds'); stubMedia(); });
afterEach(async () => { await handle?.unmount(); handle = undefined; vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('theme helpers', () => {
  it('parses unknown stored values as system and resolves the preference', () => {
    expect(parseThemePreference('dark')).toBe('dark');
    expect(parseThemePreference('purple')).toBe('system');
    expect(parseThemePreference(null)).toBe('system');
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });
});

describe('head init script (no flash)', () => {
  const runScript = () => new Function(themeInitScript)();
  it('follows the system theme by default', () => {
    runScript(); expect(root().dataset.theme).toBe('light');
    dark = true; runScript(); expect(root().dataset.theme).toBe('dark');
  });
  it('lets a stored choice win over the system theme', () => {
    dark = true; window.localStorage.setItem(THEME_STORAGE_KEY, 'light'); runScript();
    expect(root().dataset.theme).toBe('light');
    dark = false; window.localStorage.setItem(THEME_STORAGE_KEY, 'dark'); runScript();
    expect(root().dataset.theme).toBe('dark');
  });
  it('falls back safely when storage or matchMedia throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    dark = true; runScript(); expect(root().dataset.theme).toBe('dark');
    vi.stubGlobal('matchMedia', () => { throw new Error('unsupported'); });
    expect(() => runScript()).not.toThrow();
  });
});

describe('useTheme', () => {
  let latest: ReturnType<typeof useTheme>;
  function Probe() { latest = useTheme(); return createElement('span', null, `${latest.preference}:${latest.theme}`); }

  it('starts as system, then remembers and applies a choice', async () => {
    handle = await renderUi(createElement(Probe));
    expect(handle.container.textContent).toBe('system:light');
    await handle.run(() => latest.setPreference('dark'));
    expect(handle.container.textContent).toBe('dark:dark');
    expect(root().dataset.theme).toBe('dark');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    await handle.run(() => latest.setPreference('system'));
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it('tracks system changes while on system', async () => {
    dark = true;
    handle = await renderUi(createElement(Probe));
    expect(handle.container.textContent).toBe('system:dark');
    dark = false; await handle.run(() => listeners.forEach((fn) => fn()));
    expect(handle.container.textContent).toBe('system:light');
    expect(root().dataset.theme).toBe('light');
  });

  it('updates browser chrome color only once screens adopt the tokens', async () => {
    const meta = document.createElement('meta'); meta.name = 'theme-color'; meta.content = '#059669'; document.head.append(meta);
    handle = await renderUi(createElement(Probe));
    await handle.run(() => latest.setPreference('dark'));
    expect(meta.content).toBe('#059669');
    root().setAttribute('data-ds', '');
    await handle.run(() => latest.setPreference('light'));
    expect(meta.content).toBe(themeColors.light);
    meta.remove();
  });

  it('still applies the choice when storage is unavailable', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    handle = await renderUi(createElement(Probe));
    await handle.run(() => latest.setPreference('dark'));
    expect(root().dataset.theme).toBe('dark');
  });
});
