// @vitest-environment jsdom
// First-run setup (v2.0 M4-2b): the shell sends a device that has never been set up to /welcome once, the two steps save each
// choice through the same actions as Settings and the Plan, and Skip applies today's defaults. A returning or signed-in user
// never sees it. Through the in-memory router, with the first-run marker left out of the device (`firstRun`).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createDashboardHarness, keylessPayload, type DashboardHarness } from 'tests/helpers/dashboard-harness';
import { SETUP_COMPLETED_KEY } from '@/modules/shell/first-run';

const payload = keylessPayload();
let harness: DashboardHarness | undefined;
afterEach(async () => { await harness?.teardown(); harness = undefined; vi.restoreAllMocks(); });

async function start(options: { initialPath?: string; firstRun?: boolean; accountId?: string; storage?: Record<string, string> } = {}) {
  harness = await createDashboardHarness({ payload, storage: options.storage });
  await harness.mount({
    initialPath: options.initialPath ?? '/shop', firstRun: options.firstRun ?? true,
    ...(options.accountId ? { initialAccountId: options.accountId } : {}),
  });
  return harness;
}
const text = (h: DashboardHarness) => h.container.textContent ?? '';
const dashboardRequests = (h: DashboardHarness) => h.requests.filter((r) => r.url.startsWith('/api/dashboard?'));
const checkbox = (h: DashboardHarness, label: string) =>
  [...h.container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')].find((box) => box.labels?.[0]?.textContent === label)!;

describe('the first-run redirect', () => {
  it('sends a device that has never been set up to /welcome once, without a history entry', async () => {
    const h = await start();
    expect(h.replaces).toEqual(['/welcome']);
    expect(h.pushes).toEqual([]);
    expect(h.path()).toBe('/welcome');
    await h.settle();
    expect(h.replaces).toEqual(['/welcome']);
  });

  it('shows no navigation, header or page controls on the welcome screen', async () => {
    const h = await start();
    expect(h.container.querySelector('nav')).toBeNull();
    expect(h.container.querySelector('header')).toBeNull();
    expect(h.container.querySelector('button[title="Click to change your ZIP code"]')).toBeNull();
    expect(h.container.querySelector('h1')?.textContent).toBe('Where Do You Shop?');
    expect(text(h)).toContain('Step 1 of 2');
  });

  it('does not redirect a device that is set up', async () => {
    const h = await start({ firstRun: false });
    expect(h.replaces).toEqual([]);
    expect(h.path()).toBe('/shop');
  });

  it.each(['pantrybot_user_zip', 'pantrybot_active_stores', 'pantrybot_nutrition_profile_v12'])(
    'does not redirect a returning guest with %s', async (key) => {
      const h = await start({ storage: { [key]: key === 'pantrybot_user_zip' ? '80202' : '[]' } });
      expect(h.replaces).toEqual([]);
      expect(h.path()).toBe('/shop');
    },
  );

  it('does not redirect a guest who has pantry entries, but the pantry key the app creates empty does not count', async () => {
    const key = 'pantrybot_private_guest_pantry_v16';
    const used = await start({ storage: { [key]: JSON.stringify({ owner: 'guest:private', entries: [{ id: 'a' }] }) } });
    expect(used.replaces).toEqual([]);
    await used.teardown();
    // Leaving setup half way leaves the empty pantry key the app wrote; the next visit is still a first run.
    const left = await start({ storage: { [key]: JSON.stringify({ owner: 'guest:private', entries: [] }) } });
    expect(left.replaces).toEqual(['/welcome']);
  });

  it('does not redirect a signed-in user, even on a new device, and marks them as set up', async () => {
    const h = await start({ accountId: 'alice' });
    expect(h.replaces).toEqual([]);
    expect(h.path()).toBe('/shop');
    expect(localStorage.getItem(SETUP_COMPLETED_KEY)).toBe('1');
  });

  it('does not redirect again when /welcome is opened directly', async () => {
    const h = await start({ initialPath: '/welcome' });
    expect(h.replaces).toEqual([]);
    expect(h.path()).toBe('/welcome');
  });

  it('redirects from any module the app opens on', async () => {
    const h = await start({ initialPath: '/plan' });
    expect(h.replaces).toEqual(['/welcome']);
  });
});

describe('Skip', () => {
  it('applies today\'s defaults: no ZIP or store key, the marker written, and Shop opens', async () => {
    const h = await start();
    await h.click(h.button('Skip for now'));
    expect(h.replaces).toEqual(['/welcome', '/shop']);
    expect(h.path()).toBe('/shop');
    expect(localStorage.getItem(SETUP_COMPLETED_KEY)).toBe('1');
    expect(localStorage.getItem('pantrybot_user_zip')).toBeNull();
    expect(localStorage.getItem('pantrybot_active_stores')).toBeNull();
    expect(localStorage.getItem('pantrybot_nutrition_profile_v12')).toBeNull();
    expect(h.container.querySelector('h1')?.textContent).toBe('Shop');
  });

  it('names the defaults it applies', async () => {
    const h = await start();
    expect(h.button('Skip for now').textContent).toContain('uses ZIP 80542 and all stores');
  });

  it('is not shown again after setup: the next visit stays where it opens', async () => {
    const h = await start();
    await h.click(h.button('Skip for now'));
    await h.mount({ initialPath: '/plan', firstRun: false });
    expect(h.replaces).toEqual([]);
    expect(h.path()).toBe('/plan');
  });
});

describe('step 1: ZIP and stores', () => {
  it('saves a typed ZIP through the Settings action (a key, a refetch) and moves to step 2', async () => {
    const h = await start();
    const input = h.container.querySelector<HTMLInputElement>('input[inputmode="numeric"]')!;
    await h.type(input, '80202');
    await h.click(h.button('Continue'));
    await h.waitUntil(() => text(h).includes('Step 2 of 2'));
    expect(localStorage.getItem('pantrybot_user_zip')).toBe('80202');
    expect(dashboardRequests(h).some((r) => r.url.includes('zip=80202'))).toBe(true);
    expect(h.container.querySelector('h1')?.textContent).toBe('Any Food Preferences?');
  });

  it('keeps today\'s ZIP when the field is empty, and does not save one', async () => {
    const h = await start();
    await h.click(h.button('Continue'));
    expect(text(h)).toContain('Step 2 of 2');
    expect(localStorage.getItem('pantrybot_user_zip')).toBeNull();
    expect(dashboardRequests(h)).toEqual([]);
  });

  it('rejects a ZIP that is not five digits, stays on step 1 and saves nothing', async () => {
    const h = await start();
    await h.type(h.container.querySelector<HTMLInputElement>('input[inputmode="numeric"]')!, '123');
    await h.click(h.button('Continue'));
    await h.waitUntil(() => text(h).includes('Please enter a valid 5-digit US ZIP code.'));
    expect(text(h)).toContain('Step 1 of 2');
    expect(localStorage.getItem('pantrybot_user_zip')).toBeNull();
  });

  it('saves the store choice through the My Stores action as it is made', async () => {
    const h = await start();
    expect(checkbox(h, 'ALDI').checked).toBe(true);
    await h.click(checkbox(h, 'ALDI'));
    expect(checkbox(h, 'ALDI').checked).toBe(false);
    expect(JSON.parse(localStorage.getItem('pantrybot_active_stores')!)).not.toContain('ALDI');
  });
});

describe('step 2: food preferences', () => {
  async function toStep2() {
    const h = await start();
    await h.click(h.button('Continue'));
    return h;
  }

  it('saves dietary restrictions and the macro goal into the existing profile key', async () => {
    const h = await toStep2();
    await h.click(checkbox(h, 'Gluten-free'));
    const high = h.container.querySelector<HTMLInputElement>('[role="radiogroup"][aria-label="Macro goal"] input[value="HIGH_PROTEIN"]')!;
    await h.click(high);
    const profile = JSON.parse(localStorage.getItem('pantrybot_nutrition_profile_v12')!);
    expect(profile.dietaryConstraints).toEqual(['GLUTEN_FREE']);
    expect(profile.macroGoal).toBe('HIGH_PROTEIN');
  });

  it.each(['Finish', 'Skip for Now'])('%s ends setup: the marker, then Shop', async (label) => {
    const h = await toStep2();
    await h.click(h.button(label));
    expect(localStorage.getItem(SETUP_COMPLETED_KEY)).toBe('1');
    expect(h.replaces).toEqual(['/welcome', '/shop']);
    expect(h.path()).toBe('/shop');
  });

  it('sends nothing to the cloud for a guest: no sync request during setup', async () => {
    const h = await toStep2();
    await h.click(checkbox(h, 'Dairy-free'));
    await h.click(h.button('Finish'));
    expect(h.requests.filter((r) => r.url === '/api/sync' && r.method !== 'GET')).toEqual([]);
  });

  it('writes no key other than the existing ones and the one new marker', async () => {
    const h = await toStep2();
    await h.click(checkbox(h, 'Nut-free'));
    await h.click(h.button('Finish'));
    const keys = Object.keys({ ...localStorage });
    // The guest pantry key is the app's own (created empty on the first load, with or without setup).
    const allowed = new Set(['pantrybot_nutrition_profile_v12', 'pantrybot_active_stores', 'pantrybot_user_zip', 'pantrybot_private_guest_pantry_v16', SETUP_COMPLETED_KEY]);
    expect(keys.filter((key) => !allowed.has(key))).toEqual([]);
  });
});

describe('the welcome page is a screen like the others', () => {
  it('keeps its step across a render but not a reload (a reload starts at step 1)', async () => {
    const h = await start();
    await h.click(h.button('Continue'));
    expect(text(h)).toContain('Step 2 of 2');
    await h.mount({ initialPath: '/welcome', firstRun: true });
    expect(text(h)).toContain('Step 1 of 2');
  });

  it('is never remembered as the last-used module', async () => {
    document.cookie = 'pantrybot_last_module=; Max-Age=0; Path=/';
    await start({ initialPath: '/welcome' });
    expect(document.cookie).not.toContain('welcome');
    await act(async () => { await harness!.settle(); });
  });
});
