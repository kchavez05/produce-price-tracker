// @vitest-environment jsdom
// The production router seam (v2.0 M3 Phase B.3c, #701): NextAppRouter hands the app the Next.js pathname and a push that
// goes through router.push, and useAppRouter fails clearly without a provider. The in-memory router the other tests use
// replaces this component, so its wiring is checked here against a mocked next/navigation.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';

const nav = vi.hoisted(() => ({ pathname: '/plan', push: vi.fn() }));
vi.mock('next/navigation', () => ({ usePathname: () => nav.pathname, useRouter: () => ({ push: nav.push }) }));
import { NextAppRouter, useAppRouter, type AppRouter } from '@/modules/shell/app-router';

let root: Root | undefined;
let container: HTMLDivElement | undefined;
afterEach(() => { if (root) act(() => root!.unmount()); container?.remove(); root = undefined; container = undefined; nav.push.mockReset(); nav.pathname = '/plan'; });

let seen: AppRouter;
function Probe() { seen = useAppRouter(); return null; }

describe('NextAppRouter', () => {
  it('gives the app the Next.js pathname and a push that goes through router.push', () => {
    container = document.createElement('div');
    root = createRoot(container);
    act(() => root!.render(createElement(NextAppRouter, null, createElement(Probe))));
    expect(seen.pathname).toBe('/plan');
    seen.push('/pantry');
    expect(nav.push).toHaveBeenCalledTimes(1);
    expect(nav.push).toHaveBeenCalledWith('/pantry');
  });

  it('follows the pathname when Next.js navigates', () => {
    container = document.createElement('div');
    root = createRoot(container);
    act(() => root!.render(createElement(NextAppRouter, null, createElement(Probe))));
    nav.pathname = '/shop';
    act(() => root!.render(createElement(NextAppRouter, null, createElement(Probe))));
    expect(seen.pathname).toBe('/shop');
  });
});

describe('useAppRouter outside a provider', () => {
  it('fails with a clear message', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => renderToString(createElement(Probe))).toThrow('useAppRouter must be used inside an AppRouterProvider');
    vi.restoreAllMocks();
  });
});
