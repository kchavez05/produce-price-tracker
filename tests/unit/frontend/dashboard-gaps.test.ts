// @vitest-environment jsdom
// Characterization tests for the coverage gaps in the v2.0 M3 characterization map, section 6
// (#701, plan decision 16): mount restore (gap 1), the syncDashboard ownership drop (gap 2),
// cloud hydration (gap 3) and save/unsave recipe (gap 8). They pin today's behavior so a
// verbatim move cannot silently change it. They run in Tier 1 and share the golden harness.
import { afterEach, describe, expect, it, vi } from 'vitest';
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
    await harness.click(harness.button('3. Shopping List & Cart Bridge'));
    expect(harness.container.querySelectorAll('.lucide-check-square').length).toBeGreaterThan(0);
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
    expect(harness.container.textContent).toContain('1 Pinned');
    await harness.click(harness.button('2. 3-Dish Meal Prep'));
    const macro = harness.button('High-Protein');
    expect(macro.className).toContain('bg-emerald-400');
    expect(harness.button('All Macros').className).not.toContain('bg-emerald-400');
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

describe('promote a blueprint to the top three (Meal Plan)', () => {
  it('puts the chosen blueprint first, keeps two of the current dishes, and scrolls to the top', async () => {
    const scrollTo = vi.fn();
    vi.stubGlobal('scrollTo', scrollTo);
    try {
      harness = await createDashboardHarness({ payload });
      await harness.mount();
      await harness.click(harness.button('2. 3-Dish Meal Prep'));
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
    await harness.click(harness.button('2. 3-Dish Meal Prep'));
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
        expect(harness.container.textContent).toContain('Stock-up Value Alerts');
    const firstAlertPin = pinButtons()[0];
    expect(firstAlertPin).toBeDefined();
    await harness.click(firstAlertPin);
    expect(harness.container.textContent).toContain('1 Pinned');
  });

  it('opens the pantry with a review toast from the Buy 2 stock-up button', async () => {
    harness = await createDashboardHarness({ payload: alertPayload });
    await harness.mount();
    const stockUp = [...harness.container.querySelectorAll('button')].find((b) => /^Buy 2: Prep 1, Freeze 1/.test(b.textContent ?? ''));
    expect(stockUp).toBeDefined();
    await harness.click(stockUp!);
    expect(harness.container.textContent).toContain('Review your Pantry before stocking up.');
  });

  it('switches category and sort from the controls', async () => {
    harness = await createDashboardHarness({ payload: alertPayload });
    await harness.mount();
    const pill = () => harness!.button('Fresh Produce');
    expect(pill().className).not.toContain('bg-emerald-600');
    await harness.click(pill());
    expect(pill().className).toContain('bg-emerald-600');
    const select = harness.container.querySelector('select')!;
    expect(select.value).toBe('VALUE_SCORE');
    const { act } = await import('react');
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')!.set!.call(select, 'LOWEST_PRICE');
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await harness.settle();
    expect(harness.container.querySelector('select')!.value).toBe('LOWEST_PRICE');
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
    expect(harness.container.textContent).toContain('1 Pinned');
  });

  it('marks specific ingredients as available at home and explains grouped deals', async () => {
    harness = await createDashboardHarness({ payload: cardPayload });
    await harness.mount();
    const toggles = (h: DashboardHarness) => buttons(h).filter((b) => /Not marked available|Already have/.test(b.textContent ?? ''));
    const have = (h: DashboardHarness) => buttons(h).filter((b) => /Already have/.test(b.textContent ?? '')).length;
    expect(have(harness)).toBe(0);
    expect(harness.container.textContent).not.toContain('Choose the specific ingredient');
    // In the keyless fixture the first two cards are grouped deals (toast, no change); the next two are specific ingredients.
    for (let index = 0; index < 4; index += 1) await harness.click(toggles(harness)[index]);
    expect(harness.container.textContent).toContain('Choose the specific ingredient in Virtual Pantry');
    expect(have(harness)).toBe(2);
  });

  it('opens the pantry review toast from the Buy 2 button on a card', async () => {
    harness = await createDashboardHarness({ payload: cardPayload });
    await harness.mount();
    await harness.click(buttons(harness).find((b) => /^Buy 2: Prep 1, Freeze 1 \(\+/.test(b.textContent ?? ''))!);
    expect(harness.container.textContent).toContain('Review your Pantry before stocking up.');
  });

  it('pins the suggested substitute from the cycle-peak card', async () => {
    harness = await createDashboardHarness({ payload: cardPayload });
    await harness.mount();
    expect(harness.container.textContent).not.toContain('1 Pinned');
    await harness.click(buttons(harness).find((b) => /Pin Substitute Instead/.test(b.textContent ?? ''))!);
    expect(harness.container.textContent).toContain('1 Pinned');
    // The substitute is the first commodity (the one with the Buy 2 button): its own card now shows Pinned.
    let footer = buttons(harness).find((b) => /^Buy 2: Prep 1, Freeze 1 \(\+/.test(b.textContent ?? ''))!.parentElement;
    while (footer && !/Pin to Prep|Pinned/.test(footer.textContent ?? '')) footer = footer.parentElement;
    expect(footer?.textContent).toContain('Pinned');
    expect(footer?.textContent).not.toContain('Pin to Prep');
  });
});

describe('header, store filter and navigation', () => {
  const buttons = (h: DashboardHarness) => [...h.container.querySelectorAll('button')];

  it('filters by one store from the store bar and refetches with it', async () => {
    harness = await createDashboardHarness({ payload });
    await harness.mount();
    const chip = buttons(harness).find((b) => b.textContent === 'ALDI');
    expect(chip).toBeDefined();
    const before = dashboardRequests(harness).length;
    await harness.click(chip!);
    await harness.waitUntil(() => dashboardRequests(harness!).length > before);
    expect(dashboardRequests(harness).at(-1)!.searchParams.get('store')).toBe('ALDI');
    await harness.click(harness.button('All Stores'));
    await harness.waitUntil(() => dashboardRequests(harness!).at(-1)!.searchParams.get('store') === 'ALL');
  });

  it('switches between the four tabs from the navigation', async () => {
    harness = await createDashboardHarness({ payload });
    await harness.mount();
    const tabs = ['1. Value Board', '2. 3-Dish Meal Prep', '3. Shopping List', '4. Cycle & Club Radar'];
    const activeTab = () => tabs.filter((label) => !harness!.button(label).className.includes('hover:bg-'));
    const text = () => harness!.container.textContent ?? '';
    expect(activeTab()).toEqual([tabs[0]]);
    expect(text()).toContain('Sort by:');
    for (const label of tabs.slice(1)) {
      await harness.click(harness.button(label));
      expect(activeTab()).toEqual([label]);
      expect(text()).not.toContain('Sort by:');
    }
    await harness.click(harness.button(tabs[1]));
    expect(buttons(harness).some((b) => /^Show All \d+ Dishes$/.test(b.textContent ?? ''))).toBe(true);
    await harness.click(harness.button(tabs[0]));
    expect(activeTab()).toEqual([tabs[0]]);
    expect(text()).toContain('Sort by:');
  });

  it('shows pin and availability counts and jumps to the meal plan from View 3 Dishes', async () => {
    harness = await createDashboardHarness({ payload });
    await harness.mount();
    expect(buttons(harness).some((b) => /View 3 Dishes/.test(b.textContent ?? ''))).toBe(false);
    await harness.click(buttons(harness).find((b) => /Pin to Prep/.test(b.textContent ?? ''))!);
    expect(harness.container.textContent).toContain('1 Pinned');
    await harness.click(harness.button('View 3 Dishes'));
    expect(harness.container.textContent).not.toContain('Sort by:');
  });

  it('opens the pantry from the header and returns focus to the trigger when it closes', async () => {
    harness = await createDashboardHarness({ payload });
    await harness.mount();
    const trigger = harness.buttonByTitle('Open Virtual Pantry');
    await harness.click(trigger);
    expect(harness.container.textContent).toContain('Saved on this device');
    const close = buttons(harness).find((b) => b.getAttribute('aria-label') === 'Close' || /^Close$/.test(b.textContent ?? ''));
    expect(close).toBeDefined();
    await harness.click(close!);
    expect(harness.container.textContent).not.toContain('Saved on this device');
    expect(document.activeElement).toBe(harness.buttonByTitle('Open Virtual Pantry'));
  });
});

describe('initial preference and location state', () => {
  it('starts from the payload ZIP and active stores', async () => {
    const custom = { ...keylessPayload(), zipCode: '80301', activeStores: ['ALDI', 'WALMART'] as ('ALDI' | 'WALMART')[] };
    harness = await createDashboardHarness({ payload: custom });
    await harness.mount();
    expect(zipButtonText(harness)).toContain('(80301)');
    const bar = [...harness.container.querySelectorAll('button')].map((b) => b.textContent ?? '');
    expect(bar).toContain('ALDI');
    expect(bar).toContain('Walmart');
    expect(bar).not.toContain('Safeway');
    await harness.click([...harness.container.querySelectorAll('button')].find((b) => /\(\d{5}\)\s*Change$/.test(b.textContent ?? ''))!);
    expect(harness.container.querySelector<HTMLInputElement>('input[maxlength="5"]')?.value).toBe('80301');
  });
});
