// @vitest-environment jsdom
// The signed-in account actions (v2.0 M4-6): sign out, export my data, delete my account and data, and Sync Now. Written against the
// M4-6a panel first, then pointed at the Settings Account section (M4-6b) through the same driver, so the requests each action makes
// (and the two steps the delete needs) are proven unchanged. Sign-in, sync and account calls are not touched by this redesign.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { aliceSync, createDashboardHarness, keylessPayload, type DashboardHarness, type FetchHandler } from 'tests/helpers/dashboard-harness';
import type { UserSyncPayload } from '@/types/domain';

const payload = keylessPayload();
const cloudAccount: UserSyncPayload = { ...aliceSync, profile: { ...aliceSync.profile!, isCloudBacked: true } };
let harness: DashboardHarness | undefined;
afterEach(async () => { await harness?.teardown(); harness = undefined; vi.restoreAllMocks(); });

const archive = { profile: { id: 'alice', email: '', displayName: 'Alice' }, preferences: null, savedRecipes: [] };
const accountCalls = (h: DashboardHarness) => h.requests.filter((r) => r.url === '/api/account');

// The driver: the one place that knows where the controls are.
const ui = {
  async open() { /* a signed-in account's controls are on Settings itself (M4-6b) */ },
  signOut: (h: DashboardHarness) => h.click(h.button('Sign Out')),
  exportData: (h: DashboardHarness) => h.click(h.button('Export My Grocery Data')),
  startDelete: (h: DashboardHarness) => h.openSettingsPanel('Delete Account & Data'),
  confirmDelete: (h: DashboardHarness) => h.click(h.button('Yes, Purge All')),
  cancelDelete: (h: DashboardHarness) => h.click(h.button('Cancel')),
  async syncNow(h: DashboardHarness) { await h.openSettingsPanel('Sync Status'); await h.click(h.button('Sync Now')); },
};

async function start(onFetch?: FetchHandler) {
  const handler: FetchHandler = (input, init) => {
    const override = onFetch?.(input, init);
    if (override) return override;
    if (input === '/api/account') {
      const method = init?.method ?? 'GET';
      if (method === 'GET') return Response.json(archive);
      if (method === 'DELETE') return Response.json({ purgedUserId: 'alice' });
      if (method === 'POST') return Response.json({ ok: true });
    }
    return undefined;
  };
  harness = await createDashboardHarness({ payload, sync: cloudAccount, onFetch: handler });
  await harness.mount({ initialPath: '/settings', initialAccountId: 'alice' });
  await harness.waitUntil(() => harness!.container.querySelector('section[aria-label="Your account"]')?.textContent?.includes('Alice') === true);
  await ui.open();
  return harness;
}

describe('sign out', () => {
  it('posts the SIGN_OUT action to the account route', async () => {
    const h = await start();
    await ui.signOut(h);
    await h.waitUntil(() => accountCalls(h).some((r) => r.method === 'POST'));
    const post = accountCalls(h).find((r) => r.method === 'POST')!;
    expect(JSON.parse(post.body!)).toEqual({ action: 'SIGN_OUT' });
  });
});

describe('export my data', () => {
  it('reads the account archive and downloads it as a dated JSON file, and confirms it', async () => {
    const created: Blob[] = [];
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: (blob: Blob) => { created.push(blob); return 'blob:test'; }, revokeObjectURL: () => undefined }));
    const downloads: string[] = [];
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { downloads.push(this.download); });
    const h = await start();
    await ui.exportData(h);
    await h.waitUntil(() => downloads.length === 1);
    expect(accountCalls(h).filter((r) => r.method === 'GET')).toHaveLength(1);
    expect(downloads[0]).toBe('pantrybot-user-data-2026-11-17.json');
    const exported = JSON.parse(await created[0].text());
    expect(exported.profile.id).toBe('alice');
    expect(exported).toHaveProperty('browserPantryRecovery');
    expect(click).toHaveBeenCalledTimes(1);
    expect(`${h.container.textContent}${h.dialogText()}`).toContain('Downloaded');
  });

  it('says nothing is downloaded when the archive cannot be read', async () => {
    const downloads: string[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { downloads.push(this.download); });
    const h = await start((input, init) => (input === '/api/account' && (init?.method ?? 'GET') === 'GET' ? new Response('no', { status: 500 }) : undefined));
    await ui.exportData(h);
    await h.settle();
    expect(downloads).toEqual([]);
    expect(`${h.container.textContent}${h.dialogText()}`).not.toContain('Downloaded');
  });
});

describe('delete my account and data', () => {
  it('needs a second, explicit step: the first press only asks, and cancelling sends nothing', async () => {
    const h = await start();
    await ui.startDelete(h);
    await h.settle();
    expect(accountCalls(h).filter((r) => r.method === 'DELETE')).toEqual([]);
    await ui.cancelDelete(h);
    await h.settle();
    expect(accountCalls(h).filter((r) => r.method === 'DELETE')).toEqual([]);
  });

  it('deletes through the account route as this account, then the app is signed out and the device keeps no account data', async () => {
    const h = await start();
    localStorage.setItem('pantrybot_user_zip', '80542');
    await ui.startDelete(h);
    await ui.confirmDelete(h);
    await h.waitUntil(() => accountCalls(h).some((r) => r.method === 'DELETE'));
    expect(accountCalls(h).filter((r) => r.method === 'DELETE')).toHaveLength(1);
    await h.waitUntil(() => localStorage.getItem('pantrybot_user_zip') === null);
    await h.waitUntil(() => h.container.querySelector('section[aria-label="Your account"]')?.textContent?.includes('Guest') === true);
  });
});

describe('Sync Now', () => {
  it('retries the pantry and pushes the current preferences', async () => {
    const h = await start();
    const pantryGets = () => h.requests.filter((r) => r.url === '/api/pantry' && r.method === 'GET').length;
    const posts = () => h.requests.filter((r) => r.url === '/api/sync' && r.method !== 'GET');
    const beforePantry = pantryGets();
    const beforePosts = posts().length;
    await ui.syncNow(h);
    await h.waitUntil(() => posts().length > beforePosts);
    expect(pantryGets()).toBeGreaterThan(beforePantry);
    expect(JSON.stringify(posts().at(-1)!.body)).toContain('80542');
  });
});

describe('the export offered inside the delete confirmation', () => {
  it('is the same export: it reads the account archive and downloads it, and sends no delete', async () => {
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: () => 'blob:test', revokeObjectURL: () => undefined }));
    const downloads: string[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { downloads.push(this.download); });
    const h = await start();
    await ui.startDelete(h);
    await h.click(h.button('Export My Grocery Data'));
    await h.waitUntil(() => downloads.length === 1);
    expect(downloads[0]).toBe('pantrybot-user-data-2026-11-17.json');
    expect(accountCalls(h).filter((r) => r.method === 'DELETE')).toEqual([]);
  });
});

describe('while an account request is under way', () => {
  it('disables Sign Out until it finishes', async () => {
    let release!: () => void;
    const gate = new Promise<Response>((resolve) => { release = () => resolve(Response.json({ ok: true })); });
    const h = await start((input, init) => (input === '/api/account' && init?.method === 'POST' ? gate : undefined));
    const button = h.button('Sign Out');
    await h.click(button);
    expect(button.disabled).toBe(true);
    release();
    await h.settle();
  });
});
