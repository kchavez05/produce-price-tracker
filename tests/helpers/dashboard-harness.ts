// Shared jsdom harness for the v2.0 M3 dashboard characterization tests (#701).
// It mounts the real MealPrepDashboard with the real usePantry and useUserSync hooks against a
// stubbed fetch, a fixed clock and a keyless payload, so the rendered HTML is deterministic.
// Test files must still declare `// @vitest-environment jsdom`.
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { webcrypto } from 'node:crypto';
import { vi } from 'vitest';
import MealPrepDashboard from '@/components/MealPrepDashboard';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createTestSyncLock } from 'tests/sync-lock';
import type { DashboardPayload, RecommendedDish, UserSyncPayload } from '@/types/domain';

export const FIXED_NOW_ISO = '2026-11-17T12:00:00.000Z';

export type FetchHandler = (input: string, init?: RequestInit) => Response | undefined | Promise<Response | undefined>;

export interface DashboardHarness {
  container: HTMLDivElement;
  root: Root;
  requests: { url: string; method: string; body?: string }[];
  mount: (props?: Partial<MountProps>) => Promise<void>;
  unmount: () => Promise<void>;
  click: (element: HTMLElement) => Promise<void>;
  /** Set a text input's value the way a user edit does, so React's onChange fires. */
  type: (input: HTMLInputElement, value: string) => Promise<void>;
  button: (text: string) => HTMLButtonElement;
  buttonByTitle: (title: string) => HTMLButtonElement;
  waitUntil: (check: () => boolean) => Promise<void>;
  settle: () => Promise<void>;
  /** Serialize the rendered dashboard with one tag per line, so golden diffs stay readable. */
  html: () => string;
  teardown: () => Promise<void>;
}

export interface MountProps {
  initialData: DashboardPayload;
  initialAccountId: string | null;
  initialPrivateRecipes: RecommendedDish[];
}

/**
 * The keyless production payload for ZIP 80542 at FIXED_NOW_ISO: 33 commodities, 3 recommended
 * dishes, no live sources. It is a frozen fixture (tests/fixtures/dashboard-keyless-payload.json),
 * generated once from buildDashboardPayload on develop 3737441 under a fixed clock, so catalog
 * or scoring changes cannot shift the goldens. jsdom cannot import node:sqlite to build it live.
 */
export function keylessPayload(): DashboardPayload {
  const file = join(process.cwd(), 'tests/fixtures/dashboard-keyless-payload.json');
  return JSON.parse(readFileSync(file, 'utf8')) as DashboardPayload;
}

export const guestSync: UserSyncPayload = {
  authenticated: false, profile: null, preferences: null, savedRecipes: [],
  storageMode: 'SQLITE_LOCAL_FALLBACK', supabaseConfigured: false, syncedAtIso: FIXED_NOW_ISO,
};

export const aliceSync: UserSyncPayload = {
  authenticated: true,
  profile: { id: 'alice', email: '', displayName: 'Alice', provider: 'google', isCloudBacked: false, createdAtIso: FIXED_NOW_ISO, updatedAtIso: FIXED_NOW_ISO },
  preferences: { userId: 'alice', defaultZip: '80542', favoriteStoreIds: [], macroGoal: 'ANY', dietaryConstraints: [],
    vesselArchetype: 'ANY', targetServings: 6, pinnedIngredientIds: [], updatedAtIso: FIXED_NOW_ISO },
  savedRecipes: [], storageMode: 'SQLITE_LOCAL_FALLBACK', supabaseConfigured: false, syncedAtIso: FIXED_NOW_ISO,
};

/** Insert line breaks between tags so a golden diff points at the element that changed. */
export function formatHtml(raw: string): string {
  return raw.replace(/></g, '>\n<');
}

export async function createDashboardHarness(options: {
  payload: DashboardPayload;
  sync?: UserSyncPayload;
  onFetch?: FetchHandler;
  /** localStorage entries to seed after the reset, before the first render. */
  storage?: Record<string, string>;
}): Promise<DashboardHarness> {
  const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
  const requests: DashboardHarness['requests'] = [];
  localStorage.clear();
  sessionStorage.clear();
  for (const [key, value] of Object.entries(options.storage ?? {})) localStorage.setItem(key, value);
  // Only Date is faked: the dashboard's price clock reads new Date(), timers stay real.
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(FIXED_NOW_ISO));
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('crypto', webcrypto);
  vi.stubGlobal('navigator', { onLine: true, locks: { request: createTestSyncLock() } });
  vi.stubGlobal('fetch', vi.fn(async (input: string, init?: RequestInit) => {
    requests.push({ url: input, method: init?.method ?? 'GET', body: typeof init?.body === 'string' ? init.body : undefined });
    const custom = await options.onFetch?.(input, init);
    if (custom) return custom;
    if (input === '/api/sync') return Response.json(options.sync ?? guestSync);
    if (input === '/api/pantry') {
      return Response.json({ owner: options.sync?.authenticated ? 'account:alice' : 'guest:private', entries: [],
        legacyMigrationVersion: 1, needsCatalogMatch: [], acceptedCatalogIds: [] });
    }
    if (input.startsWith('/api/dashboard?')) {
      // Like the real route, answer for the requested ZIP: the dashboard adopts the response's zipCode.
      const zip = new URL(input, 'http://localhost').searchParams.get('zip') ?? options.payload.zipCode;
      return Response.json({ ...options.payload, zipCode: zip });
    }
    throw new Error(`Unexpected request: ${input}`);
  }));
  const container = document.createElement('div');
  document.body.append(container);
  let root = createRoot(container);
  let mounted = false;
  const run = async (action: () => unknown) => { await act(async () => { await action(); await settle(); }); };
  const button = (text: string) => {
    const found = [...container.querySelectorAll('button')].find((element) => element.textContent?.includes(text));
    if (!found) throw new Error(`Missing button: ${text}`);
    return found;
  };
  const harness: DashboardHarness = {
    container, get root() { return root; }, requests, settle: () => run(() => undefined),
    mount: async (props = {}) => {
      if (mounted) await run(() => root.unmount());
      root = createRoot(container);
      mounted = true;
      await run(() => root.render(createElement(MealPrepDashboard, {
        initialData: options.payload, initialAccountId: null, ...props,
      })));
    },
    unmount: async () => { if (mounted) { mounted = false; await run(() => root.unmount()); } },
    click: (element) => run(() => element.click()),
    type: (input, value) => run(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }),
    button,
    buttonByTitle: (title) => {
      const found = container.querySelector<HTMLButtonElement>(`button[title="${title}"]`);
      if (!found) throw new Error(`Missing button titled: ${title}`);
      return found;
    },
    waitUntil: async (check) => {
      // The clock is frozen, so bound the wait by attempts instead of time.
      for (let attempt = 0; !check(); attempt += 1) {
        if (attempt > 500) throw new Error('Dashboard did not reach the expected state');
        await run(() => undefined);
      }
    },
    html: () => formatHtml(container.innerHTML),
    teardown: async () => {
      await harness.unmount();
      container.remove();
      vi.useRealTimers();
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    },
  };
  return harness;
}
