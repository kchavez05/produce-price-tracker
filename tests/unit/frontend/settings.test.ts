// @vitest-environment jsdom
// Account and Settings (v2.0 M4-2a): a page at /settings that is not a tab. Its controls call the same context actions the
// old header, page-top drawers and the Plan's own chips called, so these tests pin the page, the navigation around it and
// each control's effect, through the in-memory router.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import {
  aliceSync, createDashboardHarness, keylessPayload, type DashboardHarness, type FetchHandler,
} from 'tests/helpers/dashboard-harness';
import type { UserSyncPayload, WeeklySyncCronResult } from '@/types/domain';

const payload = keylessPayload();
let harness: DashboardHarness | undefined;
beforeEach(() => {
  document.cookie = 'pantrybot_last_module=; Max-Age=0; Path=/';
  document.documentElement.removeAttribute('data-theme');
});
afterEach(async () => { await harness?.teardown(); harness = undefined; vi.restoreAllMocks(); });

const cloudAccount: UserSyncPayload = { ...aliceSync, profile: { ...aliceSync.profile!, isCloudBacked: true } };
const cookie = () => document.cookie.split('; ').find((entry) => entry.startsWith('pantrybot_last_module='));
const text = (h: DashboardHarness) => h.container.textContent ?? '';
const dashboardRequests = (h: DashboardHarness) => h.requests.filter((r) => r.url.startsWith('/api/dashboard?'));
const digest = {
  ok: true, cycle: 'preview_digest', executedAtIso: '2026-11-17T12:00:00.000Z', syncedOffersCount: 0,
  refreshStatus: 'estimates_only', auditStorage: 'preview', dataSources: { flippLive: false, krogerLive: false, usdaLive: false },
  smartPushNotifications: [{ id: 'push-1', triggerType: 'FRIDAY_PREP_DIGEST', scheduledWindowLabel: 'Friday 4 PM', title: 'Weekend prep digest',
    subtitle: 'Three dishes', body: 'Your weekend trio is ready.', deepLinkPath: '/', badgeText: 'Digest', priority: 'normal' }],
  fridayWeekendDigest: { generatedAtIso: '2026-11-17T12:00:00.000Z', adCycleLabel: 'This week', zipCode: '80542', topValueCommodities: [],
    splurgeAlerts: [], recommendedWeekendTrio: [], markdownDigest: '# Weekend digest' },
  recentSyncRuns: [],
} as unknown as WeeklySyncCronResult;

async function start(initialPath = '/settings', options: { sync?: UserSyncPayload; accountId?: string; onFetch?: FetchHandler } = {}) {
  harness = await createDashboardHarness({ payload, sync: options.sync, onFetch: options.onFetch });
  await harness.mount({ initialPath, ...(options.accountId ? { initialAccountId: options.accountId } : {}) });
  return harness;
}
const settingsSection = (h: DashboardHarness, title: string) => {
  const heading = [...h.container.querySelectorAll('h2')].find((el) => el.textContent === title)!;
  return heading.closest('section')!;
};
const buttonIn = (root: ParentNode, label: string) =>
  [...root.querySelectorAll('button')].find((b) => b.textContent?.includes(label))!;
const select = (h: DashboardHarness, label: string) => {
  const field = [...h.container.querySelectorAll('label')].find((l) => l.textContent === label)!;
  return h.container.querySelector<HTMLSelectElement>(`#${field.htmlFor}`)!;
};
async function choose(h: DashboardHarness, element: HTMLSelectElement, value: string) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')!.set!.call(element, value);
    element.dispatchEvent(new Event('change', { bubbles: true }));
    await h.settle();
  });
}

describe('the page', () => {
  it('is a screen of its own at /settings with a visible title, Back and the sections in order', async () => {
    const h = await start();
    expect(h.path()).toBe('/settings');
    expect(h.container.querySelector('h1')?.textContent).toBe('Account and Settings');
    expect(h.container.querySelector('h1')?.className).not.toContain('sr-only'); // not a tab: its title is visible (spec 6a)
    expect([...h.container.querySelectorAll('h2')].map((el) => el.textContent)).toEqual([
      'Shopping', 'Meal Prep', 'Appearance', 'Account', 'About',
    ]);
    expect(h.link('Back').getAttribute('href')).toBe('/shop');
  });

  it('marks no tab as current, and keeps the tabs as links to the modules', async () => {
    const h = await start();
    for (const nav of h.container.querySelectorAll('nav[aria-label="Primary"]')) {
      expect([...nav.querySelectorAll('a')].map((a) => a.getAttribute('aria-current'))).toEqual([null, null, null]);
      expect([...nav.querySelectorAll('a')].map((a) => a.getAttribute('href'))).toEqual(['/shop', '/pantry', '/plan']);
    }
    expect(h.link('Account and settings').getAttribute('aria-current')).toBe('page');
  });

  it('leaves out the page-top controls, store filter, pins summary and screen-name h1 of the tabs', async () => {
    const h = await start();
    expect(h.container.querySelector('button[title="Click to change your ZIP code"]')).toBeNull();
    expect(h.container.querySelector('button[title^="Preview Smart Push"]')).toBeNull();
    expect(text(h)).not.toContain('All Stores (');
    expect(h.container.querySelectorAll('h1').length).toBe(1);
  });

  it('is not remembered as the last-used module, and "/" never opens it', async () => {
    const h = await start('/plan');
    expect(cookie()).toBe('pantrybot_last_module=plan');
    await h.click(h.link('Account and settings'));
    expect(h.path()).toBe('/settings');
    expect(cookie()).toBe('pantrybot_last_module=plan');
  });
});

describe('Back', () => {
  it('returns to the tab the user came from', async () => {
    const h = await start('/plan');
    await h.click(h.link('Account and settings'));
    expect(h.link('Back').getAttribute('href')).toBe('/plan');
    await h.click(h.link('Back'));
    expect(h.path()).toBe('/plan');
  });

  it('returns to the Shop view the user was on', async () => {
    const h = await start('/shop');
    await h.openShopView('Radar');
    await h.click(h.link('Account and settings'));
    await h.click(h.link('Back'));
    expect(h.path()).toBe('/shop');
    expect(h.container.querySelector('nav[aria-label="Shop views"] a[aria-current="page"]')?.textContent).toBe('Radar');
  });

  it('goes to the Pantry when that is where the user came from', async () => {
    const h = await start('/pantry');
    await h.click(h.link('Account and settings'));
    expect(h.link('Back').getAttribute('href')).toBe('/pantry');
  });
});

describe('Shopping', () => {
  it('shows the location and stores as rows that open their panels in place', async () => {
    const h = await start();
    const shopping = settingsSection(h, 'Shopping');
    expect(shopping.textContent).toContain('Mead / Longmont, CO 80542');
    expect(shopping.textContent).toContain('6 selected');
    expect(text(h)).not.toContain('Change Grocery Location');
    await h.click(buttonIn(shopping, 'Location'));
    expect(shopping.textContent).toContain('Change Grocery Location');
    await h.click(buttonIn(shopping, 'My Stores'));
    expect(shopping.textContent).toContain('My Stores');
    expect(shopping.querySelectorAll('form, input').length).toBeGreaterThan(0);
  });

  it('changes the ZIP through the same action as before (a refetch for the new ZIP)', async () => {
    const h = await start();
    const shopping = settingsSection(h, 'Shopping');
    await h.click(buttonIn(shopping, 'Location'));
    const input = shopping.querySelector<HTMLInputElement>('input[placeholder^="e.g. 80542"]')!;
    await h.type(input, '80202');
    await h.click(buttonIn(shopping, 'Update Location'));
    await h.waitUntil(() => dashboardRequests(h).some((r) => r.url.includes('zip=80202')));
    expect(localStorage.getItem('pantrybot_user_zip')).toBe('80202');
  });
});

describe('Meal Prep', () => {
  it('sets the macro goal and persists it in the existing profile key', async () => {
    const h = await start();
    await choose(h, select(h, 'Macro goal'), 'HIGH_PROTEIN');
    expect(select(h, 'Macro goal').value).toBe('HIGH_PROTEIN');
    expect(localStorage.getItem('pantrybot_nutrition_profile_v12')).toContain('HIGH_PROTEIN');
    await h.waitUntil(() => dashboardRequests(h).some((r) => /HIGH_PROTEIN/.test(r.url)));
  });

  it('toggles a dietary rule and sets the cookware', async () => {
    const h = await start();
    const meal = settingsSection(h, 'Meal Prep');
    const glutenFree = [...meal.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')]
      .find((box) => box.labels?.[0]?.textContent === 'Gluten-free')!;
    expect(glutenFree.checked).toBe(false);
    await h.click(glutenFree);
    expect(glutenFree.checked).toBe(true);
    expect(localStorage.getItem('pantrybot_nutrition_profile_v12')).toContain('GLUTEN_FREE');
    await choose(h, select(h, 'Cookware'), 'DUTCH_OVEN_BRAISE');
    expect(localStorage.getItem('pantrybot_nutrition_profile_v12')).toContain('DUTCH_OVEN_BRAISE');
  });

  it('sets the default servings, and the Plan shows the same choice', async () => {
    const h = await start();
    const servings = h.container.querySelector<HTMLElement>('[role="radiogroup"][aria-label="Default servings"]')!;
    const radio = (value: string) => servings.querySelector<HTMLInputElement>(`input[value="${value}"]`)!;
    expect(radio('6').checked).toBe(true);
    await h.click(radio('8'));
    expect(radio('8').checked).toBe(true);
    await h.waitUntil(() => dashboardRequests(h).some((r) => r.url.includes('servings=8')));
    await h.click(h.link('Plan'));
    expect(h.button('8 Srv / Dish').className).toContain('bg-emerald-400');
  });
});

describe('Appearance', () => {
  it('sets the theme, remembers it on the device and applies it at once', async () => {
    const h = await start();
    const theme = h.container.querySelector<HTMLElement>('[role="radiogroup"][aria-label="Theme"]')!;
    const radio = (value: string) => theme.querySelector<HTMLInputElement>(`input[value="${value}"]`)!;
    expect(radio('system').checked).toBe(true);
    await h.click(radio('dark'));
    expect(localStorage.getItem('pantrybot-theme')).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    await h.click(radio('light'));
    expect(localStorage.getItem('pantrybot-theme')).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    await h.click(radio('system'));
    expect(localStorage.getItem('pantrybot-theme')).toBeNull();
  });
});

describe('Account', () => {
  it('shows a guest card, whose Sign In opens the account dialog in place', async () => {
    const h = await start();
    const card = h.container.querySelector('section[aria-label="Your account"]')!;
    expect(card.textContent).toContain('Guest');
    expect(card.textContent).toContain('Saved on this device');
    expect(text(h)).not.toContain('Sign In to Sync Your Virtual Pantry & Preferences');
    await h.click(buttonIn(card, 'Sign In'));
    expect(text(h)).toContain('Sign In to Sync Your Virtual Pantry & Preferences');
    expect(h.path()).toBe('/settings');
  });

  it('shows the sync status and AI features of a guest, and opens the AI sign-in from the row', async () => {
    const h = await start();
    const account = settingsSection(h, 'Account');
    expect(account.textContent).toContain('Device only');
    await h.click(buttonIn(account, 'Sign In to Access'));
    expect(text(h)).toContain('Sign in to access AI features'); // the dialog opens with the AI intent
    expect(text(h)).not.toContain('Sign In to Sync Your Virtual Pantry & Preferences');
  });

  it('shows a signed-in account: name, email, sync status, AI on, and Manage Account', async () => {
    const h = await start('/settings', { sync: cloudAccount, accountId: 'alice' });
    await h.waitUntil(() => h.container.querySelector('section[aria-label="Your account"]')?.textContent?.includes('Alice') === true);
    const card = h.container.querySelector('section[aria-label="Your account"]')!;
    expect(card.textContent).toContain(aliceSync.profile!.email);
    expect(buttonIn(card, 'Manage Account')).toBeDefined();
    const account = settingsSection(h, 'Account');
    await h.waitUntil(() => account.textContent?.includes('On') === true);
    expect(account.textContent).toContain('Synced');
    await h.click(buttonIn(card, 'Manage Account'));
    expect(text(h)).toContain('Account, Cloud Sync & Privacy Controls');
  });

  it('opens the weekly digest preview in place', async () => {
    const h = await start('/settings', {
      onFetch: (input) => (input.startsWith('/api/cron/weekly-sync?') ? Response.json(digest) : undefined),
    });
    const account = settingsSection(h, 'Account');
    await h.click(buttonIn(account, 'Weekly Digest'));
    await h.waitUntil(() => account.textContent?.includes('Weekend prep digest') === true);
  });
});

describe('About', () => {
  it('links to the data explorer, the docs, privacy and terms', async () => {
    const h = await start();
    const about = settingsSection(h, 'About');
    expect([...about.querySelectorAll('a')].map((a) => a.getAttribute('href'))).toEqual(['/data', '/docs', '/privacy', '/terms']);
  });
});
