// @vitest-environment jsdom
// Characterization tests for the Shell view state and its handlers (v2.0 M3 Phase B.1d, #701): the alerts preview and
// manual weekly sync, the digest copy, "select all stores", the Sync Now action, the toast and the modals kept across
// tab switches (owner decision 1). They pin develop's behavior so moving the state and handlers into hooks cannot
// silently change it.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import {
  aliceSync, createDashboardHarness, keylessPayload, type DashboardHarness, type FetchHandler,
} from 'tests/helpers/dashboard-harness';
import { ALL_STORE_CHAINS } from '@/data/store-registry';
import type { UserSyncPayload, WeeklySyncCronResult } from '@/types/domain';

const payload = keylessPayload();
const cloudBacked: UserSyncPayload = { ...aliceSync, profile: { ...aliceSync.profile!, isCloudBacked: true } };
let harness: DashboardHarness | undefined;
afterEach(async () => { await harness?.teardown(); harness = undefined; vi.restoreAllMocks(); });

const RADAR = 'Radar';
const PLAN = 'Plan';
const ALERTS = 'Preview Smart Push Notifications & Friday Weekend Meal-Prep Digest';
const digest = {
  ok: true, cycle: 'preview_digest', executedAtIso: '2026-11-17T12:00:00.000Z', syncedOffersCount: 0,
  refreshStatus: 'estimates_only', auditStorage: 'preview', dataSources: { flippLive: false, krogerLive: false, usdaLive: false },
  smartPushNotifications: [{ id: 'push-1', triggerType: 'FRIDAY_PREP_DIGEST', scheduledWindowLabel: 'Friday 4 PM', title: 'Weekend prep digest',
    subtitle: 'Three dishes', body: 'Your weekend trio is ready.', deepLinkPath: '/', badgeText: 'Digest', priority: 'normal' }],
  fridayWeekendDigest: { generatedAtIso: '2026-11-17T12:00:00.000Z', adCycleLabel: 'This week', zipCode: '80542', topValueCommodities: [],
    splurgeAlerts: [], recommendedWeekendTrio: [], markdownDigest: '# Weekend digest' },
  recentSyncRuns: [],
} as unknown as WeeklySyncCronResult;
const buttons = (h: DashboardHarness) => [...h.container.querySelectorAll('button')];
const text = (h: DashboardHarness) => h.container.textContent ?? '';
const cronRequests = (h: DashboardHarness) => h.requests.filter((r) => r.url.startsWith('/api/cron/weekly-sync'));
const dashboardRequests = (h: DashboardHarness) =>
  h.requests.filter((r) => r.url.startsWith('/api/dashboard?')).map((r) => new URL(r.url, 'http://localhost'));
const alertError = (h: DashboardHarness) => h.container.querySelector('[role="alert"]')?.textContent ?? null;
/**
 * Capture the timers with the given delays instead of scheduling them, so a late real timer cannot fire after the test
 * environment is torn down (the print timer calls window.print()); every other timer runs normally. The test fires the
 * captured callback itself.
 */
function captureTimers(delays: number[]) {
  const real = globalThis.setTimeout;
  const captured: Array<{ handler: () => void; delay: number }> = [];
  vi.spyOn(globalThis, 'setTimeout').mockImplementation(((handler: () => void, delay?: number, ...args: unknown[]) => {
    if (delay !== undefined && delays.includes(delay)) {
      captured.push({ handler, delay });
      return 0 as unknown as ReturnType<typeof setTimeout>;
    }
    return real(handler, delay, ...args);
  }) as typeof setTimeout);
  return (delay: number) => captured.find((entry) => entry.delay === delay)?.handler;
}

async function start(onFetch?: FetchHandler, options: { sync?: UserSyncPayload; accountId?: string } = {}) {
  harness = await createDashboardHarness({ payload, onFetch, sync: options.sync });
  await harness.mount(options.accountId ? { initialAccountId: options.accountId } : {});
  await harness.settle();
  return harness;
}

describe('alerts preview', () => {
  it('fetches the preview digest for the ZIP once, shows the loading state, and keeps the result when reopened', async () => {
    let release: (response: Response) => void = () => undefined;
    const gate = new Promise<Response>((resolve) => { release = resolve; });
    const h = await start((input) => (input.startsWith('/api/cron/weekly-sync?') ? gate : undefined));
    await h.click(h.buttonByTitle(ALERTS));
    expect(cronRequests(h).map((r) => r.url)).toEqual(['/api/cron/weekly-sync?cycle=preview_digest&zip=80542']);
    expect(text(h)).toContain('Syncing Circulars...');
    release(Response.json(digest));
    await h.waitUntil(() => text(h).includes('Weekend prep digest'));
    expect(text(h)).not.toContain('Syncing Circulars...');
    await h.click(h.buttonByTitle(ALERTS));
    expect(text(h)).not.toContain('Weekend prep digest');
    await h.click(h.buttonByTitle(ALERTS));
    expect(text(h)).toContain('Weekend prep digest');
    expect(cronRequests(h)).toHaveLength(1);
  });

  it('ignores a failed preview and fetches again on the next open', async () => {
    const h = await start((input) => (input.startsWith('/api/cron/weekly-sync?') ? new Response('{}', { status: 500 }) : undefined));
    await h.click(h.buttonByTitle(ALERTS));
    await h.waitUntil(() => !text(h).includes('Syncing Circulars...'));
    expect(alertError(h)).toBeNull();
    await h.click(h.buttonByTitle(ALERTS));
    await h.click(h.buttonByTitle(ALERTS));
    expect(cronRequests(h)).toHaveLength(2);
  });

  it('keeps the drawer and its digest across tab switches', async () => {
    const h = await start((input) => (input.startsWith('/api/cron/weekly-sync?') ? Response.json(digest) : undefined));
    await h.click(h.buttonByTitle(ALERTS));
    await h.waitUntil(() => text(h).includes('Weekend prep digest'));
    await h.openShopView('Radar');
    await h.click(h.link(PLAN));
    expect(text(h)).toContain('Weekend prep digest');
    expect(text(h)).toContain('Run Weekly Sync Now');
  });
});

describe('manual weekly sync', () => {
  const post = (h: DashboardHarness) => cronRequests(h).find((r) => r.method === 'POST');
  async function open(onFetch: FetchHandler) {
    const h = await start((input, init) => (input.startsWith('/api/cron/weekly-sync?') ? Response.json(digest) : onFetch(input, init)));
    await h.click(h.buttonByTitle(ALERTS));
    await h.waitUntil(() => text(h).includes('Weekend prep digest'));
    return h;
  }

  it('posts the manual cycle for the ZIP, applies the digest, then refetches the dashboard', async () => {
    const newDigest = { ...digest, fridayWeekendDigest: { ...digest.fridayWeekendDigest, markdownDigest: '# Fresh' },
      smartPushNotifications: [{ ...digest.smartPushNotifications[0], title: 'Fresh digest title' }] };
    const h = await open((input, init) => (input === '/api/cron/weekly-sync' && init?.method === 'POST' ? Response.json(newDigest) : undefined));
    const before = dashboardRequests(h).length;
    await h.click(h.button('Run Weekly Sync Now'));
    await h.waitUntil(() => dashboardRequests(h).length > before);
    expect(JSON.parse(post(h)!.body!)).toEqual({ cycle: 'manual_sync', zipCode: '80542' });
    expect(text(h)).toContain('Fresh digest title');
    expect(alertError(h)).toBeNull();
    expect(dashboardRequests(h).at(-1)!.searchParams.get('zip')).toBe('80542');
    expect(text(h)).not.toContain('Syncing Circulars...');
  });

  it('shows the audit message, applies the digest it carries, and does not refetch', async () => {
    const withDigest = { ...digest, auditStorage: 'unavailable', smartPushNotifications: [{ ...digest.smartPushNotifications[0], title: 'Audit digest' }] };
    const h = await open((input, init) => (input === '/api/cron/weekly-sync' && init?.method === 'POST'
      ? Response.json(withDigest, { status: 503 }) : undefined));
    const before = dashboardRequests(h).length;
    await h.click(h.button('Run Weekly Sync Now'));
    await h.waitUntil(() => alertError(h) !== null);
    expect(alertError(h)).toBe('Prices were checked, but the durable audit could not be saved. Please retry.');
    expect(text(h)).toContain('Audit digest');
    expect(dashboardRequests(h)).toHaveLength(before);
    expect(text(h)).not.toContain('Syncing Circulars...');
  });

  it('shows the generic failure message for another error status', async () => {
    const h = await open((input, init) => (input === '/api/cron/weekly-sync' && init?.method === 'POST'
      ? Response.json({ ok: false }, { status: 500 }) : undefined));
    await h.click(h.button('Run Weekly Sync Now'));
    await h.waitUntil(() => alertError(h) !== null);
    expect(alertError(h)).toBe('Weekly refresh failed. Please retry.');
  });

  it('shows the connection message when the request cannot be made, and clears it on the next run', async () => {
    let fail = true;
    const h = await open((input, init) => {
      if (input === '/api/cron/weekly-sync' && init?.method === 'POST') { if (fail) throw new TypeError('network'); return Response.json(digest); }
      return undefined;
    });
    await h.click(h.button('Run Weekly Sync Now'));
    await h.waitUntil(() => alertError(h) !== null);
    expect(alertError(h)).toBe('Weekly refresh could not connect. Please retry.');
    fail = false;
    await h.click(h.button('Run Weekly Sync Now'));
    await h.waitUntil(() => alertError(h) === null);
  });
});

describe('digest copy', () => {
  it('copies the markdown digest, shows the copied state and clears it after 2.5 seconds', async () => {
    const writeText = vi.fn();
    const h = await start((input) => (input.startsWith('/api/cron/weekly-sync?') ? Response.json(digest) : undefined));
    Object.assign(navigator, { clipboard: { writeText } });
    expect(h.container.querySelector('button[disabled]')).toBeNull();
    await h.click(h.buttonByTitle(ALERTS));
    await h.waitUntil(() => text(h).includes('Weekend prep digest'));
    const timer = captureTimers([2500]);
    await h.click(h.button('Copy Friday Markdown Digest'));
    expect(writeText).toHaveBeenCalledWith('# Weekend digest');
    expect(text(h)).toContain('Copied Digest!');
    const clear = timer(2500);
    expect(clear).toBeDefined();
    await act(async () => { clear!(); });
    expect(text(h)).not.toContain('Copied Digest!');
  });

  it('copies nothing and shows no copied state when the digest has no markdown', async () => {
    const writeText = vi.fn();
    const { fridayWeekendDigest: _omitted, ...withoutDigest } = digest as unknown as Record<string, unknown>;
    void _omitted;
    const h = await start((input) => (input.startsWith('/api/cron/weekly-sync?') ? Response.json(withoutDigest) : undefined));
    Object.assign(navigator, { clipboard: { writeText } });
    await h.click(h.buttonByTitle(ALERTS));
    await h.waitUntil(() => text(h).includes('Weekend prep digest'));
    await h.click(h.button('Copy Friday Markdown Digest'));
    expect(writeText).not.toHaveBeenCalled();
    expect(text(h)).not.toContain('Copied Digest!');
  });

  it('is disabled until a digest has loaded', async () => {
    const h = await start((input) => (input.startsWith('/api/cron/weekly-sync?') ? new Response('{}', { status: 500 }) : undefined));
    await h.click(h.buttonByTitle(ALERTS));
    await h.waitUntil(() => !text(h).includes('Syncing Circulars...'));
    expect(h.button('Copy Friday Markdown Digest').disabled).toBe(true);
  });
});

describe('stores drawer: select all', () => {
  it('selects every store, writes storage and refetches with all stores', async () => {
    const h = await start();
    await h.click(h.button('My Stores'));
    const cards = () => [...h.container.querySelectorAll<HTMLElement>('div.cursor-pointer')];
    await h.click(cards()[ALL_STORE_CHAINS.indexOf('SAFEWAY')]);
    await h.waitUntil(() => dashboardRequests(h).length > 0);
    expect(text(h)).toContain(`My Stores (${ALL_STORE_CHAINS.length - 1})`);
    expect(JSON.parse(localStorage.getItem('pantrybot_active_stores')!)).not.toEqual(ALL_STORE_CHAINS);
    const before = dashboardRequests(h).length;
    await h.click(h.button('Select All'));
    expect(JSON.parse(localStorage.getItem('pantrybot_active_stores')!)).toEqual(ALL_STORE_CHAINS);
    await h.waitUntil(() => dashboardRequests(h).length > before);
    expect(dashboardRequests(h).at(-1)!.searchParams.get('stores')).toBe(ALL_STORE_CHAINS.join(','));
    expect(cards()).toHaveLength(ALL_STORE_CHAINS.length);
    expect(text(h)).toContain(`My Stores (${ALL_STORE_CHAINS.length})`);
  });

  it('keeps the stores drawer open across tab switches', async () => {
    const h = await start();
    await h.click(h.button('My Stores'));
    await h.openShopView('Radar');
    await h.click(h.link(PLAN));
    expect(text(h)).toContain('Select All');
  });
});

describe('Sync Now (signed-in account)', () => {
  it('retries the pantry, then pushes the current preferences to the cloud', async () => {
    const h = await start(undefined, { sync: cloudBacked, accountId: 'alice' });
    await h.click(h.button('Alice'));
    expect(text(h)).toContain('Account, Cloud Sync & Privacy Controls');
    const pantryGets = () => h.requests.filter((r) => r.url === '/api/pantry' && r.method === 'GET').length;
    const syncPosts = () => h.requests.filter((r) => r.url === '/api/sync' && r.method !== 'GET');
    const beforePantry = pantryGets();
    const beforePosts = syncPosts().length;
    await h.click(h.button('Sync Now'));
    await h.waitUntil(() => syncPosts().length > beforePosts);
    expect(pantryGets()).toBeGreaterThan(beforePantry);
    expect(JSON.stringify(syncPosts().at(-1)!.body)).toContain('80542');
  });
});

describe('toast and drawers kept across tab switches (owner decision 1)', () => {
  it('opens the pantry drawer from a grouped deal with a toast, and the toast closes on its own button', async () => {
    const h = await start();
    await h.click(buttons(h).find((b) => /Not marked available/.test(b.textContent ?? ''))!);
    expect(text(h)).toContain('Choose the specific ingredient in Virtual Pantry');
    await h.waitUntil(() => Boolean(h.container.querySelector('#virtual-pantry-title')));
    await h.click(h.button('✕'));
    expect(text(h)).not.toContain('Choose the specific ingredient in Virtual Pantry');
    expect(h.container.querySelector('#virtual-pantry-title')).not.toBeNull();
  });

  it('opens the pantry drawer with the review toast from a Buy 2 stock-up button', async () => {
    const [first, ...rest] = payload.commodities;
    const withPrompt = { ...first, arbitragePrompt: { eligible: true, label: 'Buy 2: Prep 1, Freeze 1', recommendedFreezeQty: 1, unit: 'lb' as const, freezeCostBasis: 3, futureWeekSavings: 1.5 } };
    harness = await createDashboardHarness({ payload: { ...payload, splurgeAlerts: [], commodities: [withPrompt, ...rest] } });
    await harness.mount();
    await harness.click(buttons(harness).find((b) => /^Buy 2: Prep 1, Freeze 1 \(\+/.test(b.textContent ?? ''))!);
    expect(text(harness)).toContain('Review your Pantry before stocking up.');
    await harness.waitUntil(() => Boolean(harness!.container.querySelector('#virtual-pantry-title')));
  });

  it('shows the error as a toast when the pantry cannot save an availability change', async () => {
    const h = await start((input, init) => (input === '/api/pantry' && init?.method === 'POST'
      ? Response.json({ error: 'Pantry unavailable.' }, { status: 500 }) : undefined), { sync: cloudBacked, accountId: 'alice' });
    // The first two cards are grouped deals (a toast, no save); the next specific ingredient triggers a save.
    await h.click(buttons(h).filter((b) => /Not marked available/.test(b.textContent ?? ''))[2]);
    await h.waitUntil(() => h.container.querySelector('.bg-sky-950') !== null);
    expect(h.container.querySelector('.bg-sky-950')!.textContent).toContain('This ingredient is not ready for this account yet.');
    expect(text(h)).not.toContain('Choose the specific ingredient');
  });

  it('shows the Pantry in place of the tabs, keeps the toast across tab switches, and leaves the Pantry when a tab is chosen', async () => {
    const h = await start();
    // The grouped-deal cards on the Board explain themselves with a toast and open the pantry.
    const grouped = buttons(h).find((b) => /Not marked available/.test(b.textContent ?? ''))!;
    await h.click(grouped);
    expect(text(h)).toContain('Choose the specific ingredient in Virtual Pantry');
    await h.waitUntil(() => Boolean(h.container.querySelector('#virtual-pantry-title')));
    // The Pantry replaces the tab content (it is a module, not a drawer over it).
    expect(text(h)).not.toContain('Sort by:');
    // The header is sticky on every module, the Pantry included (M4-1a; it used to stay in the page flow while the Pantry was open).
    expect(h.container.querySelector('header')!.className).toContain('sticky');
    await h.openShopView('Radar');
    expect(h.container.querySelector('header')!.className).toContain('sticky');
    expect(text(h)).toContain('Choose the specific ingredient in Virtual Pantry');
    expect(h.container.querySelector('#virtual-pantry-title')).toBeNull();
    await h.click(h.button('✕'));
    expect(text(h)).not.toContain('Choose the specific ingredient in Virtual Pantry');
  });

  it('keeps the account dialog open across tab switches', async () => {
    const h = await start();
    await h.click(h.button('Sign In'));
    expect(text(h)).toContain('Sign In to Sync Your Virtual Pantry & Preferences');
    await h.openShopView('Radar');
    await h.click(h.link(PLAN));
    expect(text(h)).toContain('Sign In to Sync Your Virtual Pantry & Preferences');
  });
});
