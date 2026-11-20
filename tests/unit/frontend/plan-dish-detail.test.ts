// @vitest-environment jsdom
// Dish Detail (v2.0 M4-5b, wireframes Plan Dish Detail and iPad Plan): a path of its own, /plan/dish/<dish id>, that is a screen with a
// Back link below 1024 px and the pane beside the list from 1024 px (the widths are CSS; here the structure and the behavior), with the
// title and cost per serving, the ingredients, the staples, the method, View shopping list and Save. Through the in-memory router.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { guestPantryKey } from '@/lib/pantry/client-cache';
import { dishIdOfPath, pathOf } from '@/modules/shell/navigation';
import { createDashboardHarness, keylessPayload, type DashboardHarness } from 'tests/helpers/dashboard-harness';
import { expectNoA11yViolations } from 'tests/helpers/render';

const payload = keylessPayload();
let harness: DashboardHarness | undefined;
afterEach(async () => { await harness?.teardown(); harness = undefined; vi.restoreAllMocks(); });

async function start(path = '/plan', storage?: Record<string, string>) {
  harness = await createDashboardHarness({ payload, storage });
  await harness.mount({ initialPath: path });
  return harness;
}
const pane = (h: DashboardHarness) => h.container.querySelector<HTMLElement>('section[aria-label="Dish detail"]')!;
const viewLinks = (h: DashboardHarness) => [...h.container.querySelectorAll<HTMLAnchorElement>('article a')].filter((a) => a.textContent === 'View dish');
const trioIds = (h: DashboardHarness) => viewLinks(h).map((a) => decodeURIComponent(a.getAttribute('href')!.replace('/plan/dish/', '')));
const section = (h: DashboardHarness, id: string) => pane(h).querySelector<HTMLElement>(`section[aria-labelledby="${id}"]`)!;
const text = (el: Element) => el.textContent ?? '';

describe('the path', () => {
  it('names a dish by its id, and reads it back', () => {
    expect(pathOf({ module: 'plan', dish: 'a b/c' })).toBe('/plan/dish/a%20b%2Fc');
    expect(dishIdOfPath('/plan/dish/a%20b%2Fc')).toBe('a b/c');
    expect(pathOf({ module: 'plan' })).toBe('/plan');
  });

  it('is not a dish path for anything else, including a bad escape or no id', () => {
    for (const path of ['/plan', '/plan/dish', '/plan/dish/', '/shop/dish/x', '/pantry/item/x', '/plan/dish/%E0%A4%A']) expect(dishIdOfPath(path)).toBeNull();
  });
});

describe('opening a dish', () => {
  it('shows a prompt in the pane until one is chosen', async () => {
    const h = await start();
    expect(text(pane(h))).toContain('Choose a dish to see its ingredients and method.');
  });

  it('goes to its path from View dish and shows the dish in full', async () => {
    const h = await start();
    const [first] = trioIds(h);
    await h.click(viewLinks(h)[0]);
    expect(h.path()).toBe(`/plan/dish/${encodeURIComponent(first)}`);
    expect(h.pushes).toEqual([h.path()]);
    const dish = pane(h).querySelector('article')!;
    expect(dish.querySelector('h2')!.textContent).toBeTruthy();
    expect(text(dish)).toMatch(/\$\d+\.\d{2}\/srv/);
    expect(text(dish)).toMatch(/\d+ servings · \d+g protein · \d+ cal per serving/);
    expect(text(h.container)).not.toContain('Choose a dish');
  });

  it('opens straight from the path, and marks the open dish in the list', async () => {
    const h0 = await start();
    const [, second] = trioIds(h0);
    await h0.teardown();
    const h = await start(`/plan/dish/${encodeURIComponent(second)}`);
    expect(h.container.querySelector('h1')!.textContent).toBe('Plan');
    const open = viewLinks(h).filter((a) => a.getAttribute('aria-current') === 'page');
    expect(open).toHaveLength(1);
    expect(open[0].getAttribute('href')).toBe(`/plan/dish/${encodeURIComponent(second)}`);
  });

  it('finds a dish that is only among all the ranked blueprints', async () => {
    const h0 = await start();
    const inTrio = new Set(trioIds(h0));
    await h0.teardown();
    const other = payload.allRankedDishes.find((dish) => !inTrio.has(dish.id))!;
    const h = await start(`/plan/dish/${encodeURIComponent(other.id)}`);
    expect(pane(h).querySelector('h2')!.textContent).toBe(other.title);
  });
});

describe('what the dish shows', () => {
  async function open() {
    const h0 = await start();
    const [first] = trioIds(h0);
    await h0.teardown();
    return { h: await start(`/plan/dish/${encodeURIComponent(first)}`), id: first };
  }

  it('lists every ingredient with its amount and price, and where it is bought', async () => {
    const { h, id } = await open();
    const dish = payload.recommendedTrio.find((candidate) => candidate.id === id) ?? payload.allRankedDishes.find((candidate) => candidate.id === id)!;
    const rows = section(h, 'dish-ingredients').querySelectorAll('li');
    expect(rows).toHaveLength(dish.matchedIngredients.length);
    expect(text(rows[0])).toMatch(/(Need to buy|Optional|Make sure you have):/);
    expect(text(rows[0])).toMatch(/\$\d+\.\d{2}/);
  });

  it('marks an ingredient that is already at home', async () => {
    const owned = { owner: 'guest:test', legacyMigrationVersion: 1, needsCatalogMatch: [], legacySource: { owner: 'guest:test', freezerItems: [], onHandIngredientIds: [] },
      entries: [{ id: 'onions', displayName: 'Onions', ingredientId: 'onions-fresh', available: true, revision: 1, updatedAtIso: '' }] };
    // With onions marked, one of the dishes uses them: open the dishes until the one that does.
    const h = await start('/plan', { [guestPantryKey]: JSON.stringify(owned) });
    await h.waitUntil(() => [...h.container.querySelectorAll('[role=status]')].every((el) => !el.textContent?.includes('Mark what you have')));
    // The badge itself (the deal text of an owned ingredient also says "Already have", so the words alone prove nothing).
    const haveBadge = () => [...section(h, 'dish-ingredients').querySelectorAll('li span')].some((span) => span.textContent === 'Already have' && span.className.includes('rounded-pill'));
    let found = false;
    for (const link of viewLinks(h)) {
      await h.click(link);
      if (haveBadge()) { found = true; break; }
      await h.click([...pane(h).querySelectorAll('a')].find((a) => a.textContent === 'Plan')!);
    }
    expect(found).toBe(true);
    expect(text(section(h, 'dish-ingredients'))).toContain('Make sure you have:');
  });

  it('has the staples, the method with its steps and the nutrition, and the reheat tip', async () => {
    const { h, id } = await open();
    const dish = payload.recommendedTrio.find((candidate) => candidate.id === id) ?? payload.allRankedDishes.find((candidate) => candidate.id === id)!;
    expect(text(section(h, 'dish-staples'))).toContain('Staples (recipe-use estimate)');
    const method = section(h, 'dish-method');
    expect(method.querySelectorAll('ol li')).toHaveLength(dish.steps.length);
    expect(text(method)).toContain('Per Serving Nutrition Estimate:');
    expect(text(method)).toContain(`Reheat & Storage Tip: ${dish.reheatTip}`);
  });

  it('has View shopping list as the one primary action, beside Save', async () => {
    const { h } = await open();
    const primary = [...pane(h).querySelectorAll('a, button')].filter((el) => el.className.includes('bg-accent'));
    expect(primary.map((el) => el.textContent)).toEqual(['View shopping list']);
    const save = [...pane(h).querySelectorAll('button')].find((b) => b.getAttribute('aria-pressed') !== null)!;
    expect(save.textContent).toBe('Save');
  });

  it('opens the Trip from View shopping list', async () => {
    const { h } = await open();
    await h.click([...pane(h).querySelectorAll('a')].find((a) => a.textContent === 'View shopping list')!);
    expect(h.path()).toBe('/shop');
    expect(text(h.container)).toContain('ingredients to buy');
  });
});

describe('Back and leaving', () => {
  it('has a Back link to the Plan that returns to /plan', async () => {
    const h0 = await start();
    const [first] = trioIds(h0);
    await h0.teardown();
    const h = await start(`/plan/dish/${encodeURIComponent(first)}`);
    const back = [...pane(h).querySelectorAll('a')].find((a) => a.textContent === 'Plan')!;
    expect(back.getAttribute('href')).toBe('/plan');
    await h.click(back);
    expect(h.path()).toBe('/plan');
    expect(text(pane(h))).toContain('Choose a dish');
  });

  it('leaves the dish path for the Shop tab and for another module', async () => {
    const h0 = await start();
    const [first] = trioIds(h0);
    await h0.teardown();
    const h = await start(`/plan/dish/${encodeURIComponent(first)}`);
    await h.click(h.link('Shop'));
    expect(h.path()).toBe('/shop');
  });

  it('moves from one dish to another with a new entry each time', async () => {
    const h = await start();
    const [first, second] = trioIds(h);
    await h.click(viewLinks(h)[0]);
    await h.click(viewLinks(h)[1]);
    expect(h.pushes).toEqual([`/plan/dish/${encodeURIComponent(first)}`, `/plan/dish/${encodeURIComponent(second)}`]);
  });
});

describe('a dish that is not there', () => {
  it('says so and offers the way back', async () => {
    const h = await start('/plan/dish/no-such-dish');
    expect(text(pane(h))).toContain('This dish is not available');
    await h.click([...pane(h).querySelectorAll('a')].find((a) => a.textContent === 'Show the Plan')!);
    expect(h.path()).toBe('/plan');
  });
});

describe('accessibility', () => {
  it('has no violations on the detail', async () => {
    const h0 = await start();
    const [first] = trioIds(h0);
    await h0.teardown();
    const h = await start(`/plan/dish/${encodeURIComponent(first)}`);
    // The page content only: in jsdom every navigation variant is displayed (no CSS), which axe would flag as duplicate landmarks.
    await expectNoA11yViolations(h.container.querySelector('main')!);
  });
});
