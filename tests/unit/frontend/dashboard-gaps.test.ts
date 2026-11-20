// @vitest-environment jsdom
// Characterization tests for the coverage gaps in the v2.0 M3 characterization map, section 6
// (#701, plan decision 16): mount restore (gap 1), the syncDashboard ownership drop (gap 2),
// cloud hydration (gap 3) and save/unsave recipe (gap 8). They pin today's behavior so a
// verbatim move cannot silently change it. They run in Tier 1 and share the golden harness.
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  aliceSync, guestSync, createDashboardHarness as create, keylessPayload, type DashboardHarness, type FetchHandler,
} from 'tests/helpers/dashboard-harness';
import { ALL_STORE_CHAINS } from '@/data/store-registry';
import type { UserSyncPayload } from '@/types/domain';

const payload = keylessPayload();
const ALL_STORES_PARAM = ALL_STORE_CHAINS.join(',');
let harness: DashboardHarness | undefined;
let seed: Record<string, string> = {};
const localStorageSeed = (entries: Record<string, string>) => { seed = entries; };
const createDashboardHarness = (options: Parameters<typeof create>[0]) => create({ storage: seed, ...options });
afterEach(async () => { await harness?.teardown(); harness = undefined; seed = {}; });

const dashboardRequests = (h: DashboardHarness) =>
  h.requests.filter((request) => request.url.startsWith('/api/dashboard?')).map((request) => new URL(request.url, 'http://localhost'));
// The ZIP the app is showing. The page-top ZIP chip is gone (M4-3a), so this reads the app state the chip used to render.
const zipButtonText = (h: DashboardHarness) => `(${h.state().zip})`;

describe('mount restore of the five localStorage keys (gap 1)', () => {
  it('restores the checklist, profile, stores and ZIP, and refetches with the loaded values', async () => {
    localStorageSeed({
      mead_checked_items_v03: JSON.stringify({ [payload.recommendedTrio[0].matchedIngredients[0].ingredientId]: true }),
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
    // The saved checklist item is shown as checked once the shopping list is opened.
    await harness.openShopView('Trip');
    expect(harness.container.querySelectorAll('input[type="checkbox"][id^="trip-"]:checked').length).toBeGreaterThan(0);
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
    expect(harness.container.textContent).toContain('Deals');
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
    await harness.click(harness.link('Plan'));
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

  it('applies the ZIP-restore refetch for a guest whose response arrives after the pantry loads (#780)', async () => {
    // The restore runs on mount before the guest pantry snapshot loads, so the request starts with no owner (null).
    // The owner becoming known afterwards is not an identity change, so the response must be applied. A response
    // for a request that started under a known owner that then changed is still dropped (see the test above).
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
    await harness.waitUntil(() => (harness!.container.textContent ?? '').includes('Boulder, CO'));
    expect(dashboardRequests(harness)).toHaveLength(1);
    expect(zipButtonText(harness)).toContain('(80301)');
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
    expect(harness.state().pinnedIds).toHaveLength(1);
    await harness.click(harness.link('Plan'));
    const macro = harness.button('High-Protein');
    expect(macro.className).toContain('bg-emerald-400');
    expect(harness.button('All Macros').className).not.toContain('bg-emerald-400');
    expect(harness.button('8 Srv / Dish').className).toContain('bg-emerald-400');
    expect(harness.button('6 Srv / Dish').className).not.toContain('bg-emerald-400');
    expect(harness.button('Gluten-Free').className).not.toBe(harness.button('Dairy-Free').className);
    await harness.openShopView('Deals');
    // The cloud stores are the app's stores (the page-top store chips are gone, M4-3a; the Filters sheet lists them).
    expect(harness.state().activeStores).toContain('KING_SOOPERS');
    expect(harness.state().activeStores).not.toContain('SAFEWAY');
  });

  it('rejects a malformed cloud ZIP, keeping the local ZIP', async () => {
    harness = await createDashboardHarness({ payload, sync: hydrated({ defaultZip: '80x01', favoriteStoreIds: [], pinnedIngredientIds: [] }) });
    await harness.mount();
    await harness.settle();
    expect(zipButtonText(harness)).toContain(`(${payload.zipCode})`);
  });

  it('ignores preferences in a signed-out payload', async () => {
    harness = await createDashboardHarness({ payload, sync: { ...guestSync, preferences: { ...aliceSync.preferences!, defaultZip: '80301', pinnedIngredientIds: [pinned()] } } });
    await harness.mount();
    await harness.settle();
    expect(zipButtonText(harness)).toContain(`(${payload.zipCode})`);
    expect(harness.state().pinnedIds).toHaveLength(0);
  });
});

describe('save and unsave recipe (gap 8)', () => {
  const saveButtons = (h: DashboardHarness) => [...h.container.querySelectorAll<HTMLButtonElement>('button[title="Save this recipe into your SQLite Personal Library"]')];

  async function openPlan(onFetch?: FetchHandler) {
    harness = await createDashboardHarness({ payload, sync: aliceSync, onFetch });
    await harness.mount({ initialAccountId: 'alice' });
    await harness.waitUntil(() => harness!.container.textContent?.includes('Alice') === true || harness!.requests.some((r) => r.url === '/api/sync'));
    await harness.click(harness.link('Plan'));
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
    await harness.click(harness.link('Plan'));
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

describe('promote a blueprint to the top three (Meal Plan)', () => {
  it('puts the chosen blueprint first, keeps two of the current dishes, and scrolls to the top', async () => {
    const scrollTo = vi.fn();
    vi.stubGlobal('scrollTo', scrollTo);
    try {
      harness = await createDashboardHarness({ payload });
      await harness.mount();
      await harness.click(harness.link('Plan'));
      const dishTitles = () => [...harness!.container.querySelectorAll('h3')].map((h) => h.textContent ?? '');
      const before = dishTitles().filter((title) => payload.allRankedDishes.some((dish) => dish.title === title));
      expect(before.length).toBeGreaterThanOrEqual(3);
      const showAll = [...harness.container.querySelectorAll('button')].find((b) => /^Show All \d+ Dishes$/.test(b.textContent ?? ''));
      expect(showAll).toBeDefined();
      await harness.click(showAll!);
      const promote = [...harness.container.querySelectorAll('button')].filter((b) => b.textContent === 'Promote to Top 3');
      expect(promote.length).toBeGreaterThan(0);
      const chosen = promote[promote.length - 1];
      const chosenTitle = chosen.parentElement?.querySelector('h4')?.textContent ?? '';
      expect(chosenTitle).not.toBe('');
      await harness.click(chosen);
      const after = dishTitles().filter((title) => payload.allRankedDishes.some((dish) => dish.title === title));
      expect(after[0]).toBe(chosenTitle);
      expect(after).toHaveLength(3);
      expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe('clear profile filters (Meal Plan header)', () => {
  it('resets the profile, persists it, refetches with the cleared values and hides the button', async () => {
    localStorageSeed({
      pantrybot_nutrition_profile_v12: JSON.stringify({ macroGoal: 'HIGH_PROTEIN', dietaryConstraints: ['GLUTEN_FREE'], applianceFilter: 'ANY' }),
    });
    harness = await createDashboardHarness({ payload });
    await harness.mount();
    await harness.settle();
    await harness.click(harness.link('Plan'));
    const clear = () => [...harness!.container.querySelectorAll('button')].find((b) => b.textContent === 'Clear Profile Filters');
    expect(clear()).toBeDefined();
    const before = dashboardRequests(harness).length;
    await harness.click(clear()!);
    await harness.waitUntil(() => dashboardRequests(harness!).length > before);
    const params = dashboardRequests(harness).at(-1)!.searchParams;
    expect(params.get('macroGoal')).toBe('ANY');
    expect(params.get('dietary') ?? '').toBe('');
    expect(params.get('vessel')).toBe('ANY');
    expect(JSON.parse(window.localStorage.getItem('pantrybot_nutrition_profile_v12') ?? '{}')).toEqual({
      macroGoal: 'ANY', dietaryConstraints: [], applianceFilter: 'ANY',
    });
    expect(clear()).toBeUndefined();
  });
});

describe('Board alerts and controls', () => {
  // The keyless fixture has no splurge alerts, so promote one commodity with a stock-up prompt.
  const alertPayload = (() => {
    const base = keylessPayload();
    const item = { ...base.commodities[0], arbitragePrompt: { eligible: true, label: 'Buy 2: Prep 1, Freeze 1', recommendedFreezeQty: 1, unit: 'lb' as const, freezeCostBasis: 3, futureWeekSavings: 1.5 } };
    return { ...base, splurgeAlerts: [item] };
  })();

  it('pins from a Stock-up alert and shows the pin as taken', async () => {
    harness = await createDashboardHarness({ payload: alertPayload });
    await harness.mount();
    const pinButtons = () => [...harness!.container.querySelectorAll('button')].filter((b) => /Pin to Prep/.test(b.textContent ?? ''));
        expect(harness.container.textContent).toContain('Stock-Up Alert');
    const firstAlertPin = pinButtons()[0];
    expect(firstAlertPin).toBeDefined();
    await harness.click(firstAlertPin);
    expect(harness.state().pinnedIds).toHaveLength(1);
  });

  it('opens the pantry with a review toast from the Buy 2 stock-up button', async () => {
    harness = await createDashboardHarness({ payload: alertPayload });
    await harness.mount();
    const stockUp = [...harness.container.querySelectorAll('button')].find((b) => /^Buy 2: Prep 1, Freeze 1/.test(b.textContent ?? ''));
    expect(stockUp).toBeDefined();
    await harness.click(stockUp!);
    expect(harness.container.textContent).toContain('Review your Pantry before stocking up.');
  });

  it('switches category from the chips', async () => {
    harness = await createDashboardHarness({ payload: alertPayload });
    await harness.mount();
    const pill = () => harness!.button('Produce');
    expect(pill().getAttribute('aria-pressed')).toBe('false');
    await harness.click(pill());
    expect(pill().getAttribute('aria-pressed')).toBe('true');
    expect(harness.button('All').getAttribute('aria-pressed')).toBe('false');
  });
});

describe('Board leaderboard cards', () => {
  // The keyless fixture has no stock-up prompt or cycle substitution, so add one of each to two commodities.
  const cardPayload = (() => {
    const base = keylessPayload();
    const [first, second, ...rest] = base.commodities;
    const withPrompt = { ...first, arbitragePrompt: { eligible: true, label: 'Buy 2: Prep 1, Freeze 1', recommendedFreezeQty: 1, unit: 'lb' as const, freezeCostBasis: 3, futureWeekSavings: 1.5 } };
    const withSubstitute = {
      ...second,
      cycleSignal: {
        status: 'CYCLE_PEAK_WAIT' as const, badgeLabel: 'Peak', sixWeekLow: 1, sixWeekHigh: 2, sixWeekMedian: 1.5, pctVsSixWeekLow: 40,
        substitutionSuggestion: {
          substituteIngredientId: first.ingredient.id, substituteName: 'Substitute Pick', substitutePrice: 1, substituteStore: 'KING_SOOPERS' as const,
          savingsPerUnit: 0.5, reason: 'Cheaper this week',
        },
      },
    };
    return { ...base, splurgeAlerts: [], commodities: [withPrompt, withSubstitute, ...rest] };
  })();
  const buttons = (h: DashboardHarness) => [...h.container.querySelectorAll('button')];

  it('pins from a card', async () => {
    harness = await createDashboardHarness({ payload: cardPayload });
    await harness.mount();
    await harness.click(buttons(harness).find((b) => /Pin to Prep/.test(b.textContent ?? ''))!);
    expect(harness.state().pinnedIds).toHaveLength(1);
  });

  it('marks specific ingredients as available at home and explains grouped deals', async () => {
    harness = await createDashboardHarness({ payload: cardPayload });
    await harness.mount();
    const toggles = (h: DashboardHarness) => buttons(h).filter((b) => /^Have it$/.test(b.textContent ?? ''));
    const have = (h: DashboardHarness) => toggles(h).filter((b) => b.getAttribute('aria-pressed') === 'true').length;
    expect(have(harness)).toBe(0);
    expect(harness.container.textContent).not.toContain('Choose the specific ingredient');
    // In the keyless fixture the first two cards are grouped deals and the next two are specific ingredients. A specific
    // ingredient flips on the Board; a grouped deal explains itself with a toast and opens the Pantry module (B.3b), which
    // replaces the Board, so the specific ones go first.
    for (const index of [2, 3]) await harness.click(toggles(harness)[index]);
    expect(have(harness)).toBe(2);
    expect(harness.container.textContent).not.toContain('Choose the specific ingredient');
    await harness.click(toggles(harness)[0]);
    expect(harness.container.textContent).toContain('Choose the specific ingredient in Virtual Pantry');
    expect(harness.container.querySelector('#virtual-pantry-title')).not.toBeNull();
    expect(toggles(harness)).toHaveLength(0);
  });

  it('opens the pantry review toast from the Buy 2 button on a card', async () => {
    harness = await createDashboardHarness({ payload: cardPayload });
    await harness.mount();
    await harness.click(buttons(harness).find((b) => /^Buy 2: Prep 1, Freeze 1 \(\+/.test(b.textContent ?? ''))!);
    expect(harness.container.textContent).toContain('Review your Pantry before stocking up.');
  });

  it('pins the suggested substitute from the cycle-peak deal\'s detail', async () => {
    harness = await createDashboardHarness({ payload: cardPayload });
    await harness.mount();
    expect(harness.state().pinnedIds).toHaveLength(0);
    // The cycle-peak deal is the second commodity; its detail (M4-3a) holds the substitution.
    const detailLink = harness.container.querySelector<HTMLAnchorElement>(`a[href="/shop/deal/${encodeURIComponent(cardPayload.commodities[1].ingredient.id)}"]`)!;
    await harness.click(detailLink);
    await harness.click(buttons(harness).find((b) => /Pin Substitute instead/.test(b.textContent ?? ''))!);
    expect(harness.state().pinnedIds).toHaveLength(1);
    await harness.click([...harness.container.querySelectorAll('a')].find((a) => a.textContent === 'Deals' && a.closest('article'))!);
    // The substitute is the first commodity (the one with the Buy 2 button): its own card now shows Pinned.
    let footer = buttons(harness).find((b) => /^Buy 2: Prep 1, Freeze 1 \(\+/.test(b.textContent ?? ''))!.parentElement;
    while (footer && !/Pin to Prep|Pinned/.test(footer.textContent ?? '')) footer = footer.parentElement;
    expect(footer?.textContent).toContain('Pinned');
    expect(footer?.textContent).not.toContain('Pin to Prep');
  });
});

describe('header, store filter and navigation', () => {
  const buttons = (h: DashboardHarness) => [...h.container.querySelectorAll('button')];

  it('filters by one store from the Filters sheet and refetches with it', async () => {
    harness = await createDashboardHarness({ payload });
    await harness.mount();
    const before = dashboardRequests(harness).length;
    await harness.setStoreFilter('ALDI');
    await harness.waitUntil(() => dashboardRequests(harness!).length > before);
    expect(dashboardRequests(harness).at(-1)!.searchParams.get('store')).toBe('ALDI');
    expect(harness.state().storeFilter).toBe('ALDI');
    await harness.setStoreFilter('ALL');
    await harness.waitUntil(() => dashboardRequests(harness!).at(-1)!.searchParams.get('store') === 'ALL');
  });

  it('switches between the Shop views and the Plan from the navigation', async () => {
    harness = await createDashboardHarness({ payload });
    await harness.mount();
    // The current link is the one marked aria-current (the tab for the module, the Shop view link for the view).
    // The Trip link carries its item count (M4-3a), so compare by the label it starts with.
    const current = () => [...harness!.container.querySelectorAll('a[aria-current="page"]')].map((a) => a.textContent?.replace(/\d+$/, ''));
    const category = () => harness!.container.querySelector('[role="group"][aria-label="Category"]');
    expect(current()).toContain('Deals');
    expect(category()).not.toBeNull();
    for (const label of ['Trip', 'Radar'] as const) {
      await harness.openShopView(label);
      expect(current()).toContain(label);
      expect(current()).not.toContain('Deals');
      expect(category()).toBeNull();
    }
    await harness.click(harness.link('Plan'));
    expect(harness.path()).toBe('/plan');
    expect(current()).toContain('Plan');
    expect(buttons(harness).some((b) => /^Show All \d+ Dishes$/.test(b.textContent ?? ''))).toBe(true);
    await harness.openShopView('Deals');
    expect(current()).toContain('Deals');
    expect(category()).not.toBeNull();
  });

  it('opens the pantry from its tab, which has no Close button, and leaves it by choosing the Shop tab', async () => {
    harness = await createDashboardHarness({ payload });
    await harness.mount();
    // The Pantry is a tab (M4-1a): a link to /pantry, and the other tabs are the way out.
    expect(harness.link('Pantry').getAttribute('href')).toBe('/pantry');
    await harness.click(harness.link('Pantry'));
    expect(harness.path()).toBe('/pantry');
    expect(harness.container.textContent).toContain('Saved on this device');
    expect(buttons(harness).some((b) => b.getAttribute('aria-label') === 'Close Virtual Pantry')).toBe(false);
    await harness.click(harness.link('Shop'));
    expect(harness.path()).toBe('/shop');
    expect(harness.container.textContent).not.toContain('Saved on this device');
  });
});

describe('initial preference and location state', () => {
  it('starts from the payload ZIP and active stores', async () => {
    const custom = { ...keylessPayload(), zipCode: '80301', activeStores: ['ALDI', 'WALMART'] as ('ALDI' | 'WALMART')[] };
    harness = await createDashboardHarness({ payload: custom });
    await harness.mount();
    expect(zipButtonText(harness)).toContain('(80301)');
    expect(harness.state().activeStores).toEqual(['ALDI', 'WALMART']);
    await harness.openSettingsPanel('Location');
    expect(harness.container.querySelector<HTMLInputElement>('input[maxlength="5"]')?.value).toBe('80301');
  });
});

describe('syncDashboard defaults, failures and acknowledgment (M3 A.5b)', () => {
  const buttons = (h: DashboardHarness) => [...h.container.querySelectorAll('button')];

  it('sends all nine parameters, defaulting the omitted ones to the current state', async () => {
    localStorageSeed({ pantrybot_user_zip: '80301' });
    harness = await createDashboardHarness({ payload });
    await harness.mount();
    await harness.waitUntil(() => dashboardRequests(harness!).length >= 1 && (zipButtonText(harness!) ?? '').includes('(80301)'));
    await harness.click(harness.link('Plan'));
    await harness.click(harness.button('High-Protein'));
    await harness.click(harness.button('Gluten-Free'));
    await harness.click(harness.button('Dutch Oven'));
    await harness.click(harness.button('8 Srv / Dish'));
    await harness.openShopView('Deals');
    await harness.setStoreFilter('ALDI');
    await harness.click(buttons(harness).find((b) => /Pin to Prep/.test(b.textContent ?? ''))!);
    await harness.waitUntil(() => dashboardRequests(harness!).length >= 7);
    const params = dashboardRequests(harness).at(-1)!.searchParams;
    expect(params.get('zip')).toBe('80301');
    expect(params.get('store')).toBe('ALDI');
    expect(params.get('stores')).toBe(ALL_STORES_PARAM);
    expect(params.get('pinned')).not.toBe('');
    expect(params.get('onHand')).toBe('');
    expect(params.get('servings')).toBe('8');
    expect(params.get('macroGoal')).toBe('HIGH_PROTEIN');
    expect(params.get('dietary')).toBe('GLUTEN_FREE');
    expect(params.get('vessel')).toBe('DUTCH_OVEN_BRAISE');
  });

  it('keeps the current data and ZIP when the refetch fails or returns an error', async () => {
    let mode: 'ok' | 'error' | 'throw' = 'ok';
    harness = await createDashboardHarness({ payload, onFetch: async (input) => {
      if (!input.startsWith('/api/dashboard?')) return undefined;
      if (mode === 'throw') throw new Error('offline');
      if (mode === 'error') return Response.json({ error: 'no' }, { status: 500 });
      return undefined;
    } });
    await harness.mount();
    const before = harness.container.textContent;
    for (const next of ['error', 'throw'] as const) {
      mode = next;
      const requests = dashboardRequests(harness).length;
      await harness.setStoreFilter('ALDI');
      await harness.waitUntil(() => dashboardRequests(harness!).length > requests);
      await harness.setStoreFilter('ALL');
      expect(zipButtonText(harness)).toContain(`(${payload.zipCode})`);
    }
    // The prices on screen are the old ones, and the Shop says so (M4-3a) instead of failing silently.
    expect(harness.container.textContent).toContain('Could not update prices');
    expect(harness.container.textContent!.replace('Could not update pricesYou are seeing the last prices we got.Try again', '')).toBe(before);
  });

  it('refetches with the current state when a cloud sync is acknowledged', async () => {
    harness = await createDashboardHarness({ payload, sync: aliceSync });
    await harness.mount();
    await harness.settle();
    await harness.click(harness.link('Plan'));
    await harness.click(harness.button('High-Protein'));
    // The preference change pushes a cloud sync; its acknowledgment triggers a second refetch.
    await harness.waitUntil(() => dashboardRequests(harness!).length >= 2);
    const [direct, acknowledged] = dashboardRequests(harness);
    expect(direct.searchParams.get('macroGoal')).toBe('HIGH_PROTEIN');
    expect(acknowledged.searchParams.get('macroGoal')).toBe('HIGH_PROTEIN');
    expect(acknowledged.searchParams.get('store')).toBe('ALL');
    expect(acknowledged.searchParams.get('servings')).toBe('6');
  });
});

describe('account, pantry and AI wiring (M3 A.5c)', () => {
  const cloudBacked: UserSyncPayload = { ...aliceSync, profile: { ...aliceSync.profile!, isCloudBacked: true } };
  const buttons = (h: DashboardHarness) => [...h.container.querySelectorAll('button')];
  const label = (h: DashboardHarness, text: string) => buttons(h).some((b) => b.textContent?.includes(text));

  it('marks recipes from the cloud library as saved for the signed-in account', async () => {
    const dish = payload.recommendedTrio[0];
    harness = await createDashboardHarness({ payload, sync: { ...aliceSync, savedRecipes: [dish] } });
    await harness.mount({ initialAccountId: 'alice' });
    await harness.settle();
    await harness.click(harness.link('Plan'));
    await harness.waitUntil(() => (harness!.container.textContent ?? '').includes('Saved in Library'));
  });

  it('does not take a library from a signed-out payload', async () => {
    const dish = payload.recommendedTrio[0];
    harness = await createDashboardHarness({ payload, sync: { ...guestSync, savedRecipes: [dish] } });
    await harness.mount();
    await harness.settle();
    await harness.click(harness.link('Plan'));
    expect(harness.container.textContent).not.toContain('Saved in Library');
  });

  it('keeps AI locked until the account pantry has loaded', async () => {
    let releasePantry: () => void = () => undefined;
    const pantryGate = new Promise<void>((resolve) => { releasePantry = resolve; });
    harness = await createDashboardHarness({ payload, sync: cloudBacked, onFetch: async (input) => {
      if (input === '/api/pantry') await pantryGate;
      return undefined;
    } });
    await harness.mount({ initialAccountId: 'alice' });
    await harness.settle();
    await harness.click(harness.link('Plan'));
    expect(label(harness, 'Sign in to access AI')).toBe(true);
    releasePantry();
    await harness.waitUntil(() => label(harness!, 'Remix 3-dish plan with AI'));
  });

  it('asks a signed-out visitor to sign in for AI and opens the account dialog', async () => {
    harness = await createDashboardHarness({ payload });
    await harness.mount();
    await harness.click(harness.link('Plan'));
    expect(label(harness, 'Remix 3-dish plan with AI')).toBe(false);
    await harness.click(harness.button('Sign in to access AI'));
    expect(harness.container.textContent).toContain('Sign in to access AI features');
  });

  it('keeps AI locked for a signed-in account that is not cloud-backed, and unlocks it when cloud-backed', async () => {
    harness = await createDashboardHarness({ payload, sync: aliceSync });
    await harness.mount({ initialAccountId: 'alice' });
    await harness.settle();
    await harness.click(harness.link('Plan'));
    expect(label(harness, 'Sign in to access AI')).toBe(true);
    expect(label(harness, 'Remix 3-dish plan with AI')).toBe(false);
    await harness.teardown();
    harness = await createDashboardHarness({ payload, sync: cloudBacked });
    await harness.mount({ initialAccountId: 'alice' });
    await harness.settle();
    await harness.click(harness.link('Plan'));
    await harness.waitUntil(() => label(harness!, 'Remix 3-dish plan with AI'));
  });
});

describe('mount restore runs once and shows the restored state (M3 A.6)', () => {
  it('applies the restored profile and stores to the visible state', async () => {
    localStorageSeed({
      pantrybot_nutrition_profile_v12: JSON.stringify({ macroGoal: 'HIGH_PROTEIN', dietaryConstraints: ['GLUTEN_FREE'], applianceFilter: 'DUTCH_OVEN_BRAISE' }),
      pantrybot_active_stores: JSON.stringify(['KING_SOOPERS', 'SAFEWAY']),
    });
    harness = await createDashboardHarness({ payload });
    await harness.mount();
    await harness.settle();
    expect(harness.state().activeStores).toEqual(['KING_SOOPERS', 'SAFEWAY']);
    await harness.click(harness.link('Plan'));
    expect(harness.button('High-Protein').className).toContain('bg-emerald-400');
    expect(harness.button('All Macros').className).not.toContain('bg-emerald-400');
    expect(harness.button('Dutch Oven').className).not.toBe(harness.button('Skillet').className);
    expect(harness.button('Gluten-Free').className).not.toBe(harness.button('Dairy-Free').className);
  });

  it('restores only once: later changes do not re-run it or reset the ZIP', async () => {
    localStorageSeed({ pantrybot_user_zip: '80301', pantrybot_active_stores: JSON.stringify(['KING_SOOPERS', 'SAFEWAY']) });
    harness = await createDashboardHarness({ payload });
    await harness.mount();
    await harness.waitUntil(() => dashboardRequests(harness!).length === 1);
    await harness.settle();
    // A later store filter change makes exactly one more request, and the restored values persist.
    await harness.setStoreFilter('KING_SOOPERS');
    await harness.waitUntil(() => dashboardRequests(harness!).length === 2);
    await harness.settle(); await harness.settle();
    expect(dashboardRequests(harness)).toHaveLength(2);
    expect(dashboardRequests(harness)[1].searchParams.get('zip')).toBe('80301');
    expect(dashboardRequests(harness)[1].searchParams.get('stores')).toBe('KING_SOOPERS,SAFEWAY');
    expect(zipButtonText(harness)).toContain('(80301)');
  });
});

describe('preference and location actions (M3 A.5d)', () => {
  const buttons = (h: DashboardHarness) => [...h.container.querySelectorAll('button')];
  const syncPosts = (h: DashboardHarness) => h.requests.filter((r) => r.url === '/api/sync' && r.method !== 'GET').map((r) => JSON.parse(r.body ?? '{}'));
  const prefsPushed = (h: DashboardHarness) => syncPosts(h).map((body) => body.preferences ?? body.mutation?.preferences).filter(Boolean);
  const profile = () => JSON.parse(window.localStorage.getItem('pantrybot_nutrition_profile_v12') ?? 'null');
  async function signedInPlan() {
    harness = await createDashboardHarness({ payload, sync: aliceSync });
    await harness.mount({ initialAccountId: 'alice' });
    await harness.settle();
    await harness.click(harness.link('Plan'));
  }

  it('macro goal: sets it, persists the profile, pushes it to the cloud and refetches', async () => {
    await signedInPlan();
    await harness!.click(harness!.button('High-Protein'));
    await harness!.waitUntil(() => prefsPushed(harness!).length > 0);
    expect(profile()).toEqual({ macroGoal: 'HIGH_PROTEIN', dietaryConstraints: [], applianceFilter: 'ANY' });
    expect(prefsPushed(harness!).at(-1)).toMatchObject({ macroGoal: 'HIGH_PROTEIN', dietaryConstraints: [], vesselArchetype: 'ANY' });
    expect(dashboardRequests(harness!).at(-1)!.searchParams.get('macroGoal')).toBe('HIGH_PROTEIN');
  });

  it('dietary constraints: toggles on and off, persisting and pushing each time', async () => {
    await signedInPlan();
    await harness!.click(harness!.button('Gluten-Free'));
    await harness!.waitUntil(() => prefsPushed(harness!).length > 0);
    expect(profile().dietaryConstraints).toEqual(['GLUTEN_FREE']);
    expect(prefsPushed(harness!).at(-1)).toMatchObject({ dietaryConstraints: ['GLUTEN_FREE'] });
    expect(dashboardRequests(harness!).at(-1)!.searchParams.get('dietary')).toBe('GLUTEN_FREE');
    await harness!.click(harness!.button('Gluten-Free'));
    await harness!.waitUntil(() => prefsPushed(harness!).length > 1);
    expect(profile().dietaryConstraints).toEqual([]);
    expect(prefsPushed(harness!).at(-1)).toMatchObject({ dietaryConstraints: [] });
  });

  it('cooking vessel: sets it, persists the profile, pushes it and refetches', async () => {
    await signedInPlan();
    await harness!.click(harness!.button('Dutch Oven'));
    await harness!.waitUntil(() => prefsPushed(harness!).length > 0);
    expect(profile().applianceFilter).toBe('DUTCH_OVEN_BRAISE');
    expect(prefsPushed(harness!).at(-1)).toMatchObject({ vesselArchetype: 'DUTCH_OVEN_BRAISE' });
    expect(dashboardRequests(harness!).at(-1)!.searchParams.get('vessel')).toBe('DUTCH_OVEN_BRAISE');
  });

  it('active stores: toggles a store, persists, pushes and refetches, and never drops below one store', async () => {
    await signedInPlan();
    await harness!.openSettingsPanel('My Stores');
    const cards = () => [...harness!.container.querySelectorAll<HTMLElement>('div.cursor-pointer')];
    const stored = () => JSON.parse(window.localStorage.getItem('pantrybot_active_stores')!) as string[];
    expect(cards()).toHaveLength(ALL_STORE_CHAINS.length);
    await harness!.click(cards()[ALL_STORE_CHAINS.indexOf('SAFEWAY')]);
    await harness!.waitUntil(() => prefsPushed(harness!).length > 0);
    expect(stored()).toEqual(ALL_STORE_CHAINS.filter((chain) => chain !== 'SAFEWAY'));
    expect(prefsPushed(harness!).at(-1)).toMatchObject({ favoriteStoreIds: stored() });
    expect(dashboardRequests(harness!).at(-1)!.searchParams.get('stores')).toBe(stored().join(','));
    // Toggle every other store off: the last remaining store cannot be removed.
    for (const chain of ALL_STORE_CHAINS.filter((c) => c !== 'SAFEWAY' && c !== 'KING_SOOPERS')) {
      await harness!.click(cards()[ALL_STORE_CHAINS.indexOf(chain)]);
    }
    expect(stored()).toEqual(['KING_SOOPERS']);
    await harness!.click(cards()[ALL_STORE_CHAINS.indexOf('KING_SOOPERS')]);
    expect(stored()).toEqual(['KING_SOOPERS']);
  });

  it('pin and servings: refetch with the new value and do not push to the cloud', async () => {
    await signedInPlan();
    await harness!.click(harness!.button('8 Srv / Dish'));
    await harness!.waitUntil(() => dashboardRequests(harness!).some((r) => r.searchParams.get('servings') === '8'));
    await harness!.openShopView('Deals');
    await harness!.click(buttons(harness!).find((b) => /Pin to Prep/.test(b.textContent ?? ''))!);
    await harness!.waitUntil(() => dashboardRequests(harness!).at(-1)!.searchParams.get('pinned') !== '');
    expect(dashboardRequests(harness!).at(-1)!.searchParams.get('servings')).toBe('8');
    expect(prefsPushed(harness!)).toHaveLength(0);
  });

  it('ZIP submit: saves the ZIP, pushes it, refetches for it and closes the panel', async () => {
    await signedInPlan();
    await harness!.openSettingsPanel('Location');
    const input = () => harness!.container.querySelector<HTMLInputElement>('input[maxlength="5"]')!;
    expect(window.localStorage.getItem('pantrybot_user_zip')).toBeNull();
    await harness!.type(input(), '80301');
    await harness!.click(harness!.button('Update Location'));
    await harness!.waitUntil(() => harness!.container.querySelector('input[maxlength="5"]') === null);
    expect(window.localStorage.getItem('pantrybot_user_zip')).toBe('80301');
    expect(prefsPushed(harness!).at(-1)).toMatchObject({ defaultZip: '80301' });
    expect(dashboardRequests(harness!).at(-1)!.searchParams.get('zip')).toBe('80301');
  });

  it('clear filters resets the profile and pushes the cleared profile to the cloud (#807)', async () => {
    await signedInPlan();
    await harness!.click(harness!.button('High-Protein'));
    await harness!.waitUntil(() => prefsPushed(harness!).length > 0);
    const before = prefsPushed(harness!).length;
    await harness!.click(harness!.button('Clear Profile Filters'));
    await harness!.waitUntil(() => prefsPushed(harness!).length > before);
    expect(profile()).toEqual({ macroGoal: 'ANY', dietaryConstraints: [], applianceFilter: 'ANY' });
    expect(prefsPushed(harness!).at(-1)).toMatchObject({ macroGoal: 'ANY', dietaryConstraints: [], vesselArchetype: 'ANY' });
    expect(dashboardRequests(harness!).at(-1)!.searchParams.get('macroGoal')).toBe('ANY');
  });

  it('clear filters sends nothing to the cloud for a guest', async () => {
    harness = await createDashboardHarness({ payload });
    await harness.mount();
    await harness.click(harness.link('Plan'));
    await harness.click(harness.button('High-Protein'));
    await harness.click(harness.button('Clear Profile Filters'));
    await harness.settle(); await harness.settle();
    expect(prefsPushed(harness)).toHaveLength(0);
    expect(profile()).toEqual({ macroGoal: 'ANY', dietaryConstraints: [], applianceFilter: 'ANY' });
  });
});

describe('cleared profile filters survive a reload (#807)', () => {
  // A tiny stateful cloud: a push merges its preferences into the profile, and every later /api/sync returns it.
  it('keeps the cleared filters for a signed-in user after the dashboard reloads', async () => {
    const cloud: UserSyncPayload = JSON.parse(JSON.stringify(aliceSync));
    harness = await createDashboardHarness({ payload, sync: cloud, onFetch: async (input, init) => {
      if (input !== '/api/sync') return undefined;
      if (init?.method && init.method !== 'GET') {
        const body = JSON.parse(String(init.body ?? '{}'));
        const preferences = body.preferences ?? body.mutation?.preferences;
        if (preferences) Object.assign(cloud.preferences!, preferences);
      }
      return Response.json(cloud);
    } });
    await harness.mount({ initialAccountId: 'alice' });
    await harness.settle();
    await harness.click(harness.link('Plan'));
    await harness.click(harness.button('High-Protein'));
    await harness.waitUntil(() => cloud.preferences!.macroGoal === 'HIGH_PROTEIN');
    await harness.click(harness.button('Clear Profile Filters'));
    await harness.settle(); await harness.settle();
    // Reload: a fresh mount restores localStorage, then the cloud profile is hydrated over it.
    await harness.mount({ initialAccountId: 'alice' });
    await harness.settle(); await harness.settle();
    await harness.click(harness.link('Plan'));
    expect(cloud.preferences!.macroGoal).toBe('ANY');
    expect(harness.button('All Macros').className).toContain('bg-emerald-400');
    expect(harness.button('High-Protein').className).not.toContain('bg-emerald-400');
  });
});

describe('store toggle side effects run once (#808)', () => {
  // Development-style StrictMode calls state updaters twice, so side effects inside an updater would run twice.
  const pushesOf = (h: DashboardHarness) => h.requests.filter((r) => r.url === '/api/sync' && r.method !== 'GET' && (r.body ?? '').includes('favoriteStoreIds')).length;
  async function toggleSafeway(sync?: UserSyncPayload) {
    harness = await createDashboardHarness({ payload, sync, strictMode: true });
    await harness.mount(sync ? { initialAccountId: 'alice' } : {});
    await harness.settle(); await harness.settle();
    await harness.openSettingsPanel('My Stores');
    const storeWrites: string[] = [];
    const setItem = Storage.prototype.setItem;
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key: string, value: string) {
      if (key === 'pantrybot_active_stores') storeWrites.push(value);
      return setItem.call(this, key, value);
    });
    try {
      const requestsBefore = dashboardRequests(harness).length;
      const pushesBefore = pushesOf(harness);
      const cards = [...harness.container.querySelectorAll<HTMLElement>('div.cursor-pointer')];
      await harness.click(cards[ALL_STORE_CHAINS.indexOf('SAFEWAY')]);
      if (sync) await harness.waitUntil(() => pushesOf(harness!) > pushesBefore);
      await harness.waitUntil(() => dashboardRequests(harness!).length > requestsBefore);
      await harness.settle(); await harness.settle(); await harness.settle();
      return { writes: storeWrites.length, pushes: pushesOf(harness) - pushesBefore, refetches: dashboardRequests(harness).length - requestsBefore };
    } finally {
      spy.mockRestore();
    }
  }

  it('writes storage and refetches once per click for a guest under StrictMode', async () => {
    expect(await toggleSafeway()).toEqual({ writes: 1, pushes: 0, refetches: 1 });
  });

  it('writes storage and pushes once per click for a signed-in user under StrictMode', async () => {
    // Two refetches are expected for a signed-in user: the click's own, and one when the cloud acknowledges the push.
    expect(await toggleSafeway(aliceSync)).toEqual({ writes: 1, pushes: 1, refetches: 2 });
  });
});
