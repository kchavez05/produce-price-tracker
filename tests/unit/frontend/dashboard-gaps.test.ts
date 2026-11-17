// @vitest-environment jsdom
// Characterization tests for the coverage gaps in the v2.0 M3 characterization map, section 6
// (#701, plan decision 16): mount restore (gap 1), the syncDashboard ownership drop (gap 2),
// cloud hydration (gap 3) and save/unsave recipe (gap 8). They pin today's behavior so a
// verbatim move cannot silently change it. They run in Tier 1 and share the golden harness.
import { afterEach, describe, expect, it } from 'vitest';
import {
  aliceSync, guestSync, createDashboardHarness as create, keylessPayload, type DashboardHarness, type FetchHandler,
} from 'tests/helpers/dashboard-harness';
import type { UserSyncPayload } from '@/types/domain';

const payload = keylessPayload();
let harness: DashboardHarness | undefined;
let seed: Record<string, string> = {};
const localStorageSeed = (entries: Record<string, string>) => { seed = entries; };
const createDashboardHarness = (options: Parameters<typeof create>[0]) => create({ storage: seed, ...options });
afterEach(async () => { await harness?.teardown(); harness = undefined; seed = {}; });

const dashboardRequests = (h: DashboardHarness) =>
  h.requests.filter((request) => request.url.startsWith('/api/dashboard?')).map((request) => new URL(request.url, 'http://localhost'));
const zipButtonText = (h: DashboardHarness) =>
  [...h.container.querySelectorAll('button')].map((b) => b.textContent ?? '').find((text) => /\(\d{5}\)\s*Change$/.test(text));

describe('mount restore of the five localStorage keys (gap 1)', () => {
  it('restores checklist, coupons, profile, stores and ZIP, and refetches with the loaded values', async () => {
    localStorageSeed({
      mead_checked_items_v03: JSON.stringify({ 'potatoes-russet-gold': true }),
      mead_clipped_coupons_v03: JSON.stringify({ 'coupon-a': true }),
      pantrybot_nutrition_profile_v12: JSON.stringify({ macroGoal: 'HIGH_PROTEIN', dietaryConstraints: ['GLUTEN_FREE'], applianceFilter: 'ANY' }),
      pantrybot_active_stores: JSON.stringify(['KING_SOOPERS', 'SAFEWAY']),
      pantrybot_user_zip: '80301',
    });
    harness = await createDashboardHarness({ payload });
    await harness.mount();
    await harness.waitUntil(() => dashboardRequests(harness!).length > 0);
    const params = dashboardRequests(harness)[0].searchParams;
    // State updates are not visible in the mount closure, so the loaded values are passed explicitly.
    expect(params.get('zip')).toBe('80301');
    expect(params.get('stores')).toBe('KING_SOOPERS,SAFEWAY');
    expect(params.get('macroGoal')).toBe('HIGH_PROTEIN');
    expect(params.get('dietary')).toBe('GLUTEN_FREE');
    expect(params.get('vessel')).toBe('ANY');
    expect(zipButtonText(harness)).toContain('(80301)');
  });

  it('keeps the server ZIP and makes no refetch when the saved ZIP matches or is malformed', async () => {
    for (const saved of [payload.zipCode, '8030', 'abcde']) {
      localStorageSeed({ pantrybot_user_zip: saved });
      harness = await createDashboardHarness({ payload });
      await harness.mount();
      await harness.settle();
      expect(dashboardRequests(harness)).toHaveLength(0);
      expect(zipButtonText(harness)).toContain(`(${payload.zipCode})`);
      await harness.teardown();
    }
    harness = undefined;
  });

  it('ignores unreadable storage without breaking the first render', async () => {
    localStorageSeed({ mead_checked_items_v03: '{not json', pantrybot_active_stores: '[' });
    harness = await createDashboardHarness({ payload });
    await harness.mount();
    expect(harness.container.textContent).toContain('1. Value Board');
  });
});

describe('syncDashboard ownership drop (gap 2)', () => {
  // A request started after the pantry owner settled, held until the test releases it.
  async function startHeldRequest(signedInLater: boolean) {
    let releaseSync: () => void = () => undefined;
    let releaseDashboard: () => void = () => undefined;
    const syncGate = new Promise<void>((resolve) => { releaseSync = resolve; });
    const dashboardGate = new Promise<void>((resolve) => { releaseDashboard = resolve; });
    harness = await createDashboardHarness({
      payload,
      sync: signedInLater ? aliceSync : guestSync,
      onFetch: async (input) => {
        if (input === '/api/sync') { await syncGate; return Response.json(signedInLater ? aliceSync : guestSync); }
        if (input.startsWith('/api/dashboard?')) { await dashboardGate; return Response.json({ ...payload, zipCode: '80999' }); }
        return undefined;
      },
    });
    await harness.mount();
    await harness.click(harness.button('2. 3-Dish Meal Prep'));
    await harness.click(harness.button('High-Protein')); // preference change -> syncDashboard
    await harness.waitUntil(() => dashboardRequests(harness!).length === 1);
    return { releaseSync, releaseDashboard };
  }

  it('applies the response when the owner is unchanged', async () => {
    const gates = await startHeldRequest(false);
    gates.releaseDashboard();
    await harness!.waitUntil(() => zipButtonText(harness!)?.includes('(80999)') === true);
  });

  it('drops the response when the pantry owner changed while the request was in flight', async () => {
    const gates = await startHeldRequest(true);
    gates.releaseSync(); // the owner moves from the guest device to account:alice
    await harness!.waitUntil(() => harness!.requests.filter((r) => r.url === '/api/pantry').length > 1);
    gates.releaseDashboard();
    await harness!.settle();
    await harness!.settle();
    expect(zipButtonText(harness!)).toContain(`(${payload.zipCode})`);
    expect(zipButtonText(harness!)).not.toContain('(80999)');
  });

  it('currently drops the ZIP-restore refetch for a guest whose response arrives after the pantry loads', async () => {
    // Characterizes today's behavior so the M3 moves preserve it; it is not an endorsement. The restore
    // runs on mount, before the guest pantry snapshot loads, so the owner captured with the request
    // differs from the owner at response time and the ownership guard discards the response. The ZIP
    // itself is restored; only the refreshed prices for it are lost. A fix belongs in its own PR.
    localStorageSeed({ pantrybot_user_zip: '80301' });
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    harness = await createDashboardHarness({ payload, onFetch: async (input) => {
      if (input.startsWith('/api/dashboard?')) { await gate; return Response.json({ ...payload, zipCode: '80301', cityLabel: 'Boulder, CO' }); }
      return undefined;
    } });
    await harness.mount();
    await harness.settle(); await harness.settle(); await harness.settle(); // the guest pantry loads from localStorage
    release();
    await harness.settle(); await harness.settle();
    expect(dashboardRequests(harness)).toHaveLength(1);
    expect(zipButtonText(harness)).toContain('(80301)');
    expect(harness.container.textContent).not.toContain('Boulder, CO');
  });
});

describe('cloud hydration (gap 3)', () => {
  const hydrated = (preferences: Partial<NonNullable<UserSyncPayload['preferences']>>): UserSyncPayload => ({
    ...aliceSync, preferences: { ...aliceSync.preferences!, ...preferences },
  });
  const pinned = () => payload.commodities[0].ingredient.id;

  it('writes cloud preferences into the dashboard state', async () => {
    harness = await createDashboardHarness({ payload, sync: hydrated({
      defaultZip: '80301', favoriteStoreIds: ['KING_SOOPERS'], macroGoal: 'HIGH_PROTEIN', dietaryConstraints: ['GLUTEN_FREE'],
      targetServings: 8, pinnedIngredientIds: [pinned()],
    }) });
    await harness.mount();
    await harness.waitUntil(() => zipButtonText(harness!)?.includes('(80301)') === true);
    expect(harness.container.textContent).toContain('1 Pinned');
    await harness.click(harness.button('2. 3-Dish Meal Prep'));
    const macro = harness.button('High-Protein');
    expect(macro.className).toContain('bg-emerald-400');
    expect(harness.button('All Macros').className).not.toContain('bg-emerald-400');
  });

  it('rejects a malformed cloud ZIP and an empty store list, keeping local values', async () => {
    harness = await createDashboardHarness({ payload, sync: hydrated({ defaultZip: '80x01', favoriteStoreIds: [], pinnedIngredientIds: [] }) });
    await harness.mount();
    await harness.settle();
    expect(zipButtonText(harness)).toContain(`(${payload.zipCode})`);
  });

  it('ignores a signed-out payload', async () => {
    harness = await createDashboardHarness({ payload });
    await harness.mount();
    await harness.settle();
    expect(zipButtonText(harness)).toContain(`(${payload.zipCode})`);
    expect(harness.container.textContent).not.toContain('1 Pinned');
  });
});

describe('save and unsave recipe (gap 8)', () => {
  const saveButtons = (h: DashboardHarness) => [...h.container.querySelectorAll<HTMLButtonElement>('button[title="Save this recipe into your SQLite Personal Library"]')];

  async function openPlan(onFetch?: FetchHandler) {
    harness = await createDashboardHarness({ payload, sync: aliceSync, onFetch });
    await harness.mount({ initialAccountId: 'alice' });
    await harness.waitUntil(() => harness!.container.textContent?.includes('Alice') === true || harness!.requests.some((r) => r.url === '/api/sync'));
    await harness.click(harness.button('2. 3-Dish Meal Prep'));
  }

  it('saves, then unsaves, and refetches the dashboard each time', async () => {
    await openPlan((input, init) => {
      if (input.startsWith('/api/saved-recipes')) return Response.json({ ok: true }, { status: init?.method === 'DELETE' ? 200 : 201 });
      return undefined;
    });
    const before = saveButtons(harness!).length;
    expect(before).toBeGreaterThan(0);
    await harness!.click(saveButtons(harness!)[0]);
    const post = harness!.requests.find((r) => r.method === 'POST' && r.url === '/api/saved-recipes');
    expect(post).toBeDefined();
    expect(JSON.parse(post!.body!).dish.id).toBeTruthy();
    expect(harness!.container.textContent).toContain('Saved in Library');
    expect(dashboardRequests(harness!).length).toBeGreaterThan(0);
    await harness!.click(saveButtons(harness!)[0]);
    expect(harness!.requests.some((r) => r.method === 'DELETE' && r.url.startsWith('/api/saved-recipes?id='))).toBe(true);
    expect(harness!.container.textContent).not.toContain('Saved in Library');
  });

  it('shows the failure banner and does not refetch when the save fails', async () => {
    await openPlan((input) => (input.startsWith('/api/saved-recipes') ? Response.json({ error: 'no' }, { status: 500 }) : undefined));
    await harness!.click(saveButtons(harness!)[0]);
    expect(harness!.container.textContent).toContain('Unable to update your saved recipes. Please try again.');
    expect(harness!.container.textContent).not.toContain('Saved in Library');
    expect(dashboardRequests(harness!)).toHaveLength(0);
  });

  it('does nothing further when the owner changed while the save was in flight', async () => {
    let releaseSave: () => void = () => undefined;
    const saveGate = new Promise<void>((resolve) => { releaseSave = resolve; });
    let releaseSync: () => void = () => undefined;
    const syncGate = new Promise<void>((resolve) => { releaseSync = resolve; });
    harness = await createDashboardHarness({ payload, sync: aliceSync, onFetch: async (input) => {
      if (input === '/api/sync') { await syncGate; return Response.json(aliceSync); }
      if (input === '/api/saved-recipes') { await saveGate; return Response.json({ ok: true }, { status: 201 }); }
      return undefined;
    } });
    await harness.mount(); // guest owner while /api/sync is held
    await harness.click(harness.button('2. 3-Dish Meal Prep'));
    await harness.click(saveButtons(harness)[0]);
    releaseSync(); // the owner changes to account:alice
    await harness.settle();
    releaseSave();
    await harness.settle();
    await harness.settle();
    expect(harness.container.textContent).not.toContain('Saved in Library');
    expect(dashboardRequests(harness)).toHaveLength(0);
  });
});

