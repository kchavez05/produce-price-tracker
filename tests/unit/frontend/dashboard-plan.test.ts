// @vitest-environment jsdom
// Characterization tests for the Plan UI state and the AI plan actions (v2.0 M3 Phase B.1c, #701): the request
// body, the fence that drops stale or cancelled responses, every outcome banner, the standard-suggestions reset,
// and the state kept across tab switches (owner decision 1). They pin develop's behavior so moving the state and
// handlers into hooks cannot silently change it.
import { afterEach, describe, expect, it } from 'vitest';
import {
  aliceSync, createDashboardHarness, keylessPayload, type DashboardHarness, type FetchHandler,
} from 'tests/helpers/dashboard-harness';
import type { UserSyncPayload } from '@/types/domain';

const payload = keylessPayload();
const cloudBacked: UserSyncPayload = { ...aliceSync, profile: { ...aliceSync.profile!, isCloudBacked: true } };
let harness: DashboardHarness | undefined;
afterEach(async () => { await harness?.teardown(); harness = undefined; });

const PLAN = 'Plan';
const BOARD = 'Deals';
const RADAR = 'Radar';
const REMIX = 'Suggest Dishes';
const aiDishes = payload.allRankedDishes.slice(3, 6);
const buttons = (h: DashboardHarness) => [...h.container.querySelectorAll('button')];
const promptInput = (h: DashboardHarness) => h.container.querySelector<HTMLInputElement>('input[aria-label="Optional AI meal-plan request"]')!;
const dishTitles = (h: DashboardHarness) => [...h.container.querySelectorAll('h3')].map((el) => el.textContent ?? '')
  .filter((title) => payload.allRankedDishes.some((dish) => dish.title === title));
const aiRequests = (h: DashboardHarness) => h.requests.filter((request) => request.url === '/api/ai-meal-plan');
// The AI card's message: a status for news (a plan made, standard suggestions back), an alert for a failure (M4-5c).
const banner = (h: DashboardHarness) => (h.container.querySelector('[role="status"][aria-live="polite"] p') ?? [...h.container.querySelectorAll('[role="alert"] p')].at(-1))?.textContent ?? null;

/** Mount a signed-in, cloud-backed dashboard on the Plan tab, with AI unlocked and `/api/ai-meal-plan` handled by `ai`. */
const oliveOil = { id: 'oil', ingredientId: 'olive-oil', displayName: 'Olive oil', available: true, revision: 1, updatedAtIso: '' };
async function start(ai: (init?: RequestInit) => Response | Promise<Response>, onHand: object[] = [], extra?: FetchHandler) {
  const onFetch: FetchHandler = (input, init) => {
    const custom = extra?.(input, init);
    if (custom) return custom;
    if (input === '/api/ai-meal-plan') return ai(init);
    if (input === '/api/pantry' && (init?.method ?? 'GET') === 'GET') {
      return Response.json({ owner: 'account:alice', entries: onHand, legacyMigrationVersion: 1, needsCatalogMatch: [], acceptedCatalogIds: [] });
    }
    return undefined;
  };
  harness = await createDashboardHarness({ payload, sync: cloudBacked, onFetch });
  await harness.mount({ initialAccountId: 'alice' });
  await harness.settle();
  await harness.click(harness.link(PLAN));
  await harness.waitUntil(() => buttons(harness!).some((b) => b.textContent?.includes(REMIX)));
  return harness;
}

/** A held AI request: the test releases it with a response, and can read the request's abort signal. */
function heldAi() {
  let release: (response: Response) => void = () => undefined;
  let signal: AbortSignal | null | undefined;
  const gate = new Promise<Response>((resolve) => { release = resolve; });
  return { handler: (init?: RequestInit) => { signal = init?.signal; return gate; }, release, signal: () => signal };
}

describe('AI plan request', () => {
  it('sends the whole context, shows the busy state, then applies the plan and banner, and links each dish to its detail', async () => {
    const held = heldAi();
    const h = await start(held.handler, [oliveOil]);
    await h.openShopView('Deals');
    await h.click(buttons(h).find((b) => /Pin to Prep/.test(b.textContent ?? ''))!);
    await h.click(h.link(PLAN));
    await h.click(h.servingsRadio(8));
    await h.type(promptInput(h), 'extra spicy');
    await h.click(h.button(REMIX));
    expect(aiRequests(h)).toHaveLength(1);
    const body = JSON.parse(aiRequests(h)[0].body!);
    expect(body).toMatchObject({ targetServings: 8, customPreference: 'extra spicy', storeFilter: 'ALL', zipCode: '80542',
      cityLabel: payload.cityLabel, macroGoal: 'ANY', dietaryConstraints: [], applianceFilter: 'ANY' });
    expect(body.pinnedIngredientIds).toHaveLength(1);
    expect(body.onHandIngredientIds).toHaveLength(1);
    expect(typeof body.requestId).toBe('string');
    expect(h.container.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(h.container.textContent).toContain('Generating meal plan...');
    expect(h.container.textContent).toContain('Cancel and use standard suggestions');
    held.release(Response.json({ dishes: aiDishes, message: 'Fresh AI plan.' }));
    await h.waitUntil(() => banner(h) === 'Fresh AI plan.');
    expect(h.container.querySelector('[aria-busy="true"]')).toBeNull();
    expect(dishTitles(h).slice(0, 3)).toEqual(aiDishes.map((dish) => dish.title));
    // Each generated dish links to its own detail (M4-5b); nothing is expanded in place.
    const links = [...h.container.querySelectorAll<HTMLAnchorElement>('a')].filter((a) => a.textContent === 'View dish');
    expect(links.map((a) => a.getAttribute('href'))).toEqual(aiDishes.map((dish) => `/plan/dish/${encodeURIComponent(dish.id)}`));
  });

  it('uses the default banner when the response has no message', async () => {
    const h = await start(() => Response.json({ dishes: aiDishes }));
    await h.click(h.button(REMIX));
    await h.waitUntil(() => banner(h) === 'Updated 3-dish meal-prep plan.');
    expect(dishTitles(h)[0]).toBe(aiDishes[0].title);
  });

  it('shows the server error with a retry hint and keeps the standard plan', async () => {
    const standard = (await start(() => Response.json({ error: 'Daily limit reached.' }, { status: 429, headers: { 'Retry-After': '120' } })), dishTitles(harness!));
    await harness!.click(harness!.button(REMIX));
    await harness!.waitUntil(() => banner(harness!) !== null);
    expect(banner(harness!)).toBe('Daily limit reached. Try again in about 2 minutes.');
    expect(dishTitles(harness!)).toEqual(standard);
  });

  it('shows the default message for an error without text or a response without dishes', async () => {
    const h = await start(() => Response.json({ dishes: 'nope' }));
    await h.click(h.button(REMIX));
    await h.waitUntil(() => banner(h) !== null);
    expect(banner(h)).toBe('Unable to generate a meal plan. Standard suggestions remain available.');
  });

  it('asks for sign-in when the server answers 401', async () => {
    const h = await start(() => Response.json({ error: 'Sign in required.' }, { status: 401 }));
    await h.click(h.button(REMIX));
    await h.waitUntil(() => h.container.textContent?.includes('Sign in to access AI features') === true);
    expect(banner(h)).toBe('Sign in required.');
  });

  it('shows the offline message when the request cannot be made', async () => {
    const h = await start(() => { throw new TypeError('network'); });
    await h.click(h.button(REMIX));
    await h.waitUntil(() => banner(h) !== null);
    expect(banner(h)).toBe('Unable to reach AI assistance. Standard suggestions remain available. Try again when connected.');
    // A failure to connect is an alert with Try Again (M4-5c), not a status.
    expect(h.container.querySelector('section[aria-label="AI meal plan"] [role="alert"]')).not.toBeNull();
    expect(h.button('Try Again')).toBeDefined();
  });
});

describe('the request fence', () => {
  it('drops a response when the plan context changed while it was in flight, and aborts the request', async () => {
    const held = heldAi();
    const h = await start(held.handler);
    const standard = dishTitles(h);
    await h.click(h.button(REMIX));
    await h.type(promptInput(h), 'changed my mind');
    expect(held.signal()?.aborted).toBe(true);
    expect(h.container.querySelector('[aria-busy="true"]')).toBeNull();
    held.release(Response.json({ dishes: aiDishes, message: 'Too late.' }));
    await h.settle();
    await h.settle();
    expect(banner(h)).toBeNull();
    expect(dishTitles(h)).toEqual(standard);
  });

  it('aborts an in-flight request when the dashboard unmounts', async () => {
    const held = heldAi();
    const h = await start(held.handler);
    await h.click(h.button(REMIX));
    expect(held.signal()?.aborted).toBe(false);
    await h.unmount();
    expect(held.signal()?.aborted).toBe(true);
  });

  it('clears the banner when the context changes', async () => {
    const h = await start(() => Response.json({ dishes: aiDishes, message: 'Fresh AI plan.' }));
    await h.click(h.button(REMIX));
    await h.waitUntil(() => banner(h) === 'Fresh AI plan.');
    await h.click(h.servingsRadio(8));
    expect(banner(h)).toBeNull();
  });
});

describe('standard suggestions', () => {
  it('cancels an in-flight request, clears the plan and says so', async () => {
    const held = heldAi();
    const h = await start(held.handler);
    const standard = dishTitles(h);
    await h.click(h.button(REMIX));
    await h.click(h.button('Cancel and use standard suggestions'));
    expect(held.signal()?.aborted).toBe(true);
    expect(h.container.querySelector('[aria-busy="true"]')).toBeNull();
    expect(banner(h)).toBe('Using standard meal-prep suggestions.');
    held.release(Response.json({ dishes: aiDishes }));
    await h.settle();
    expect(dishTitles(h)).toEqual(standard);
    expect(banner(h)).toBe('Using standard meal-prep suggestions.');
  });

  it('reverts a generated plan to the standard suggestions', async () => {
    const h = await start(() => Response.json({ dishes: aiDishes }));
    const standard = dishTitles(h);
    await h.click(h.button(REMIX));
    await h.waitUntil(() => banner(h) === 'Updated 3-dish meal-prep plan.');
    expect(dishTitles(h)).not.toEqual(standard);
    await h.click(h.button('Use standard suggestions'));
    expect(dishTitles(h)).toEqual(standard);
    expect(banner(h)).toBe('Using standard meal-prep suggestions.');
  });
});

describe('Plan state survives tab switches (owner decision 1)', () => {
  it('keeps a generated plan, its banner and the request text', async () => {
    const h = await start(() => Response.json({ dishes: aiDishes, message: 'Fresh AI plan.' }));
    await h.type(promptInput(h), 'soup');
    // Typing changes the context, so generate after typing.
    await h.click(h.button(REMIX));
    await h.waitUntil(() => banner(h) === 'Fresh AI plan.');
    // A chosen radio is a DOM property, not an attribute, so compare what is shown and chosen, not the markup.
    const shown = () => [h.container.textContent, [...h.container.querySelectorAll<HTMLInputElement>('input[type="radio"]')].map((radio) => radio.checked)];
    const before = shown();
    await h.openShopView('Radar');
    await h.click(h.link(PLAN));
    expect(shown()).toEqual(before);
    expect(promptInput(h).value).toBe('soup');
  });
});

// v2.0 M4-5c: the AI Chef card's states, through the real request flow.
describe('the AI Chef card states', () => {
  const alertIn = (h: DashboardHarness) => h.container.querySelector('section[aria-label="AI meal plan"] [role="alert"]');
  const statusIn = (h: DashboardHarness) => h.container.querySelector('section[aria-label="AI meal plan"] [role="status"][aria-live="polite"]');

  it('shows a failure as an alert that names the problem, with Try Again and Dismiss', async () => {
    const h = await start(() => Response.json({ error: 'Daily limit reached.' }, { status: 429 }));
    await h.click(h.button(REMIX));
    await h.waitUntil(() => alertIn(h) !== null);
    expect(alertIn(h)!.textContent).toContain('AI Chef could not make a plan');
    expect(alertIn(h)!.textContent).toContain('Daily limit reached.');
    expect(statusIn(h)).toBeNull();
    expect(buttons(h).some((b) => b.textContent === 'Try Again')).toBe(true);
    expect(buttons(h).some((b) => b.textContent === 'Dismiss')).toBe(true);
  });

  it('repeats the request on Try Again, and the alert gives way to the plan that comes back', async () => {
    let calls = 0;
    const h = await start(() => (++calls === 1 ? Response.json({ error: 'Busy.' }, { status: 503 }) : Response.json({ dishes: aiDishes, message: 'Fresh AI plan.' })));
    await h.click(h.button(REMIX));
    await h.waitUntil(() => alertIn(h) !== null);
    await h.click(h.button('Try Again'));
    await h.waitUntil(() => alertIn(h) === null && statusIn(h) !== null);
    expect(aiRequests(h)).toHaveLength(2);
    expect(banner(h)).toBe('Fresh AI plan.');
    expect(dishTitles(h).slice(0, 3)).toEqual(aiDishes.map((dish) => dish.title));
  });

  it('dismisses an alert and a status, and keeps the standard plan when it fails', async () => {
    const h = await start(() => Response.json({ error: 'Busy.' }, { status: 503 }));
    const standard = dishTitles(h);
    await h.click(h.button(REMIX));
    await h.waitUntil(() => alertIn(h) !== null);
    await h.click(h.button('Dismiss'));
    expect(alertIn(h)).toBeNull();
    expect(dishTitles(h)).toEqual(standard);
    await h.click(h.button('Use standard suggestions'));
    expect(statusIn(h)!.textContent).toContain('Using standard meal-prep suggestions.');
    await h.click(buttons(h).find((b) => b.textContent === 'Dismiss')!);
    expect(statusIn(h)).toBeNull();
  });

  it('shows a plan that was made as a status, not an alert', async () => {
    const h = await start(() => Response.json({ dishes: aiDishes, message: 'Fresh AI plan.' }));
    await h.click(h.button(REMIX));
    await h.waitUntil(() => statusIn(h) !== null);
    expect(statusIn(h)!.querySelector('p')!.textContent).toBe('Fresh AI plan.');
    expect(alertIn(h)).toBeNull();
  });

  it('shows a failed recipe save as an alert too, which Dismiss clears', async () => {
    const h = await start(() => Response.json({ dishes: aiDishes }), [], (input) => (input === '/api/saved-recipes' ? Response.json({ error: 'no' }, { status: 500 }) : undefined));
    await h.click(buttons(h).find((b) => b.textContent === 'Save')!);
    await h.waitUntil(() => alertIn(h) !== null);
    expect(alertIn(h)!.textContent).toContain('Unable to update your saved recipes. Please try again.');
    await h.click(h.button('Dismiss'));
    expect(alertIn(h)).toBeNull();
  });

  it('dims the plan and marks it busy while a request is out', async () => {
    const held = heldAi();
    const h = await start(held.handler);
    await h.click(h.button(REMIX));
    const column = h.container.querySelector('[aria-busy="true"]')!;
    expect(column).not.toBeNull();
    expect([...h.container.querySelectorAll('[aria-busy="true"]')].some((el) => el.className.includes('opacity-60'))).toBe(true);
    held.release(Response.json({ dishes: aiDishes }));
    await h.waitUntil(() => h.container.querySelector('[aria-busy="true"]') === null);
  });
});
