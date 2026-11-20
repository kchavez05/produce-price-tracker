// @vitest-environment jsdom
// Ingredient Detail (v2.0 M4-4b, wireframe Pantry Detail): a path of its own, /pantry/item/<entry id>, that is a screen with a Back
// link below 1024 px and the pane beside the list from 1024 px (the widths are CSS; here the structure and the behavior), with
// "Do I have this?", the optional details, what this week's plan uses it for, the current deals and Remove from Pantry. A guest
// pantry is seeded in storage, so the real pantry hooks run. Through the in-memory router.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { guestPantryKey } from '@/lib/pantry/client-cache';
import { cookingIngredients } from '@/lib/pantry/model';
import { recipePantryIngredientId } from '@/lib/pantry/recipe-identity';
import { itemIdOfPath, pathOf } from '@/modules/shell/navigation';
import { createDashboardHarness, keylessPayload, type DashboardHarness } from 'tests/helpers/dashboard-harness';
import { expectNoA11yViolations } from 'tests/helpers/render';
import type { PantryEntry } from '@/types/pantry';

const payload = keylessPayload();
const entry = (over: Partial<PantryEntry> & Pick<PantryEntry, 'id' | 'displayName'>): PantryEntry => ({ available: true, revision: 1, updatedAtIso: '', ...over });
const thighs = entry({ id: 'thighs', displayName: 'Chicken thighs', ingredientId: 'chicken-thighs-boneless' });
const salt = entry({ id: 'salt', displayName: 'Salt', ingredientId: 'salt', available: false });
const custom = entry({ id: 'tahini', displayName: 'Tahini' });
const withDeal = payload.commodities.find((commodity) => cookingIngredients.some((ingredient) => ingredient.id === recipePantryIngredientId(commodity.ingredient.id)))!;
// A market ingredient whose reviewed recipe identity is a different pantry id (yellow-white-onions is onions-fresh), and used in the plan.
const onions = entry({ id: 'onions', displayName: 'Onions', ingredientId: 'onions-fresh' });
const gone = entry({ id: 'gone', displayName: 'Removed item', ingredientId: 'olive-oil', deletedAtIso: '2026-11-01T00:00:00.000Z' });
const dealEntry = entry({ id: 'deal', displayName: 'Dealt item', ingredientId: recipePantryIngredientId(withDeal.ingredient.id) });
let harness: DashboardHarness | undefined;
afterEach(async () => { await harness?.teardown(); harness = undefined; vi.restoreAllMocks(); });

async function start(path = '/pantry') {
  // The harness clears storage when it starts, so the guest pantry is seeded through its own option (any guest owner is accepted).
  const seeded = { owner: 'guest:test', entries: [thighs, salt, custom, dealEntry, onions, gone], legacyMigrationVersion: 1, needsCatalogMatch: [], legacySource: { owner: 'guest:test', freezerItems: [], onHandIngredientIds: [] } };
  harness = await createDashboardHarness({ payload, storage: { [guestPantryKey]: JSON.stringify(seeded) } });
  await harness.mount({ initialPath: path });
  await harness.waitUntil(() => [...harness!.container.querySelectorAll('[role=status]')].some((el) => el.textContent?.includes('Saved')));
  return harness;
}
const text = (h: DashboardHarness) => h.container.textContent ?? '';
const pane = (h: DashboardHarness) => h.container.querySelector<HTMLElement>('section[aria-label="Ingredient detail"]')!;
const nameLink = (h: DashboardHarness, id: string) => h.container.querySelector<HTMLAnchorElement>(`li p a[href="/pantry/item/${id}"]`)!;
const buttons = (root: ParentNode) => [...root.querySelectorAll('button')];
const section = (h: DashboardHarness, id: string) => pane(h).querySelector<HTMLElement>(`section[aria-labelledby="${id}"]`)!;

describe('the path', () => {
  it('names an entry by its id, and reads it back', () => {
    expect(pathOf({ module: 'pantry', item: 'a b/c' })).toBe('/pantry/item/a%20b%2Fc');
    expect(itemIdOfPath('/pantry/item/a%20b%2Fc')).toBe('a b/c');
    expect(pathOf({ module: 'pantry' })).toBe('/pantry');
  });

  it('is not an item path for anything else, including a bad escape or no id', () => {
    for (const path of ['/pantry', '/pantry/item', '/pantry/item/', '/shop/deal/x', '/pantry/other/x', '/pantry/item/%E0%A4%A']) expect(itemIdOfPath(path)).toBeNull();
  });
});

describe('opening an ingredient', () => {
  it('shows a prompt in the pane until one is chosen', async () => {
    const h = await start();
    expect(pane(h).textContent).toContain('Choose an ingredient to see its details.');
  });

  it('goes to its path from the name in the list and shows it in full', async () => {
    const h = await start();
    await h.click(nameLink(h, 'thighs'));
    expect(h.path()).toBe('/pantry/item/thighs');
    expect(h.pushes).toEqual(['/pantry/item/thighs']);
    expect(pane(h).querySelector('h2')!.textContent).toBe('Chicken thighs');
    expect(text(h)).not.toContain('Choose an ingredient');
  });

  it('opens straight from the path, with the heading focused', async () => {
    const h = await start('/pantry/item/thighs');
    const heading = pane(h).querySelector('h2')!;
    expect(heading.textContent).toBe('Chicken thighs');
    expect(document.activeElement).toBe(heading);
    expect(h.container.querySelector('h1')!.textContent).toBe('Pantry');
  });

  it('marks the open ingredient in the list', async () => {
    const h = await start('/pantry/item/salt');
    const open = [...h.container.querySelectorAll('li[aria-current="true"]')];
    expect(open).toHaveLength(1);
    expect(open[0].textContent).toContain('Salt');
  });
});

describe('Do I have this?', () => {
  it('shows the current answer and saves the other one, the list following', async () => {
    const h = await start('/pantry/item/thighs');
    const group = () => pane(h).querySelector<HTMLElement>('[role=radiogroup]')!;
    expect(group().getAttribute('aria-label')).toBe('Do I have Chicken thighs?');
    expect(group().querySelector<HTMLInputElement>('input:checked')!.value).toBe('true');
    await h.click(group().querySelector<HTMLInputElement>('input[value="false"]')!);
    await h.waitUntil(() => group().querySelector<HTMLInputElement>('input:checked')!.value === 'false');
    const listGroup = h.container.querySelector<HTMLElement>('li [role=radiogroup][aria-label="Chicken thighs availability"]')!;
    expect(listGroup.querySelector<HTMLInputElement>('input:checked')!.value).toBe('false');
  });
});

describe('the optional details', () => {
  it('saves the quantity and unit, which the list then shows, keeping the answer', async () => {
    const h = await start('/pantry/item/thighs');
    const form = pane(h).querySelector('form')!;
    const set = (name: string, value: string) => {
      const field = form.querySelector<HTMLInputElement>(`input[name=${name}]`)!;
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(field, value);
      field.dispatchEvent(new Event('input', { bubbles: true }));
    };
    set('quantity', '3'); set('unit', 'lb');
    await h.click(buttons(pane(h)).find((b) => b.textContent === 'Save details')!);
    await h.waitUntil(() => text(h).includes('3 lb'));
    expect(text(h)).toContain('Details saved.');
    expect(pane(h).querySelector<HTMLInputElement>('[role=radiogroup] input:checked')!.value).toBe('true');
  });

  it('reports a bad value and saves nothing', async () => {
    const h = await start('/pantry/item/thighs');
    const quantity = pane(h).querySelector<HTMLInputElement>('input[name=quantity]')!;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(quantity, '-1');
    quantity.dispatchEvent(new Event('input', { bubbles: true }));
    // Dispatched directly: the browser's own min check would otherwise stop the submit before the form's validation.
    await act(async () => { pane(h).querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); await h.settle(); });
    expect(pane(h).querySelector('[role=alert]')!.textContent).toContain('nonnegative');
    expect(text(h)).not.toContain('Details saved.');
    expect(pane(h).querySelector('form')).not.toBeNull();
  });
});

describe('the plan and the deals', () => {
  it('lists the dishes in this week\'s plan that use the ingredient', async () => {
    const h = await start('/pantry/item/thighs');
    const used = section(h, 'pantry-detail-plan').querySelector('p')!.textContent!;
    expect(used).not.toContain('Not used in this week');
    expect(payload.allRankedDishes.some((dish) => used.includes(dish.title))).toBe(true);
  });

  it('says so for an ingredient with no dish and no deal', async () => {
    const h = await start('/pantry/item/tahini');
    expect(section(h, 'pantry-detail-plan').textContent).toContain('Not used in this week\'s plan.');
    expect(section(h, 'pantry-detail-deals').textContent).toContain('Not on sale at your stores this week.');
  });

  it('lists the current deals for the ingredient, each linking to its Deal Detail', async () => {
    const h = await start('/pantry/item/deal');
    const link = section(h, 'pantry-detail-deals').querySelector<HTMLAnchorElement>('li a')!;
    expect(link.textContent).toBe(withDeal.ingredient.name);
    expect(link.getAttribute('href')).toBe(`/shop/deal/${encodeURIComponent(withDeal.ingredient.id)}`);
    expect(section(h, 'pantry-detail-deals').querySelector('li')!.textContent).toMatch(/\$\d+\.\d{2}\/\w+/);
    await h.click(link);
    expect(h.path()).toBe(link.getAttribute('href'));
  });
});

describe('matching by the reviewed recipe identity', () => {
  it('finds the dish and the deal for an ingredient whose market id differs from its pantry id', async () => {
    expect(recipePantryIngredientId('yellow-white-onions')).toBe('onions-fresh');
    const h = await start('/pantry/item/onions');
    expect(section(h, 'pantry-detail-plan').textContent).not.toContain('Not used in this week');
    const deals = section(h, 'pantry-detail-deals');
    expect(deals.textContent).not.toContain('Not on sale');
    expect(deals.querySelector<HTMLAnchorElement>('li a')!.getAttribute('href')).toBe('/shop/deal/yellow-white-onions');
  });
});

describe('Remove from Pantry', () => {
  it('removes the ingredient and goes back to the list', async () => {
    const h = await start('/pantry/item/salt');
    await h.click(buttons(pane(h)).find((b) => b.textContent === 'Remove from Pantry')!);
    await h.waitUntil(() => h.path() === '/pantry');
    expect(nameLink(h, 'salt')).toBeNull();
    expect(nameLink(h, 'thighs')).not.toBeNull();
  });
});

describe('Back and leaving', () => {
  it('has a Back link to the Pantry that returns to /pantry', async () => {
    const h = await start('/pantry/item/thighs');
    const back = [...pane(h).querySelectorAll('a')].find((a) => a.textContent === 'Pantry')!;
    expect(back.getAttribute('href')).toBe('/pantry');
    await h.click(back);
    expect(h.path()).toBe('/pantry');
    expect(pane(h).textContent).toContain('Choose an ingredient');
  });

  it('leaves the item path for the Pantry tab and for another module', async () => {
    const h = await start('/pantry/item/thighs');
    await h.click([...h.container.querySelectorAll<HTMLAnchorElement>('a[href="/pantry"]')].find((a) => !pane(h).contains(a))!);
    expect(h.path()).toBe('/pantry');
    await h.click(nameLink(h, 'thighs'));
    await h.click(h.link('Plan'));
    expect(h.path()).toBe('/plan');
  });

  it('moves from one ingredient to another with a new entry each time', async () => {
    const h = await start('/pantry/item/thighs');
    await h.click(nameLink(h, 'salt'));
    expect(h.path()).toBe('/pantry/item/salt');
    expect(pane(h).querySelector('h2')!.textContent).toBe('Salt');
  });
});

describe('an ingredient that is not there', () => {
  it('treats a removed entry (a tombstone kept for sync) as not there', async () => {
    const h = await start('/pantry/item/gone');
    expect(pane(h).textContent).toContain('This ingredient is not in your Pantry');
    expect(nameLink(h, 'gone')).toBeNull();
  });

  it('says so once the Pantry has loaded', async () => {
    const h = await start('/pantry/item/no-such-entry');
    expect(pane(h).textContent).toContain('This ingredient is not in your Pantry');
  });
});

describe('accessibility', () => {
  it('has no violations on the detail', async () => {
    const h = await start('/pantry/item/thighs');
    // The page content only: in jsdom every navigation variant is displayed (no CSS), which axe would flag as duplicate landmarks.
    await expectNoA11yViolations(h.container.querySelector('main')!);
  });
});
