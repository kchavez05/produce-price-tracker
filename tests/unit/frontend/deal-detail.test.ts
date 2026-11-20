// @vitest-environment jsdom
// Deal Detail (v2.0 M4-3a, wireframes Shop Deal Detail and iPad Shop): a path of its own, /shop/deal/<ingredient id>, that is a
// screen with a Back link below 1024 px and the pane beside the list from 1024 px (the widths are CSS; here the structure and the
// behavior). Through the in-memory router.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { dealIdOfPath, pathOf } from '@/modules/shell/navigation';
import { createDashboardHarness, keylessPayload, type DashboardHarness } from 'tests/helpers/dashboard-harness';
import { expectNoA11yViolations } from 'tests/helpers/render';

const payload = keylessPayload();
const deal = payload.commodities[0];
const dealPath = `/shop/deal/${encodeURIComponent(deal.ingredient.id)}`;
let harness: DashboardHarness | undefined;
afterEach(async () => { await harness?.teardown(); harness = undefined; vi.restoreAllMocks(); });

async function start(initialPath = '/shop') {
  harness = await createDashboardHarness({ payload });
  await harness.mount({ initialPath });
  return harness;
}
const text = (h: DashboardHarness) => h.container.textContent ?? '';
const pane = (h: DashboardHarness) => h.container.querySelector<HTMLElement>('section[aria-label="Deal detail"]')!;
const buttons = (root: ParentNode) => [...root.querySelectorAll('button')];
const cardLink = (h: DashboardHarness, id = deal.ingredient.id) => h.container.querySelector<HTMLAnchorElement>(`article h3 a[href="/shop/deal/${encodeURIComponent(id)}"]`)!;

describe('the path', () => {
  it('names a deal by its ingredient id, and reads it back', () => {
    expect(pathOf({ module: 'shop', view: 'BOARD', deal: 'a b/c' })).toBe('/shop/deal/a%20b%2Fc');
    expect(dealIdOfPath('/shop/deal/a%20b%2Fc')).toBe('a b/c');
    expect(pathOf({ module: 'shop', view: 'BOARD' })).toBe('/shop');
  });

  it('is not a deal path for anything else, including a bad escape or no id', () => {
    for (const path of ['/shop', '/shop/deal', '/shop/deal/', '/plan', '/pantry/deal/x', '/shop/deal/%E0%A4%A']) expect(dealIdOfPath(path)).toBeNull();
  });
});

describe('opening a deal', () => {
  it('goes to its path from the card name and shows the deal in full', async () => {
    const h = await start();
    expect(pane(h).textContent).toContain('Choose a deal');
    await h.click(cardLink(h));
    expect(h.path()).toBe(dealPath);
    expect(h.pushes).toEqual([dealPath]);
    const view = pane(h).querySelector('article')!;
    expect(view.querySelector('h2')!.textContent).toBe(deal.ingredient.name);
    expect(view.textContent).toMatch(/\$\d+\.\d{2}/);
    expect(view.textContent).toMatch(/Value \d+\/100/);
    expect(view.textContent).toContain('USDA wholesale');
    expect(text(h)).not.toContain('Choose a deal');
  });

  it('opens straight from the path (a link or a reload)', async () => {
    const h = await start(dealPath);
    expect(pane(h).querySelector('h2')!.textContent).toBe(deal.ingredient.name);
    expect(h.container.querySelector('h1')!.textContent).toBe('Shop');
  });

  it('shows a deal from a later page in the list when opened from its path', async () => {
    const h = await start();
    await h.click(h.button('Show 12 more'));
    const later = [...h.container.querySelectorAll<HTMLAnchorElement>('article h3 a')][15];
    const path = later.getAttribute('href')!;
    await h.teardown();
    const reopened = await start(path);
    expect(reopened.container.querySelectorAll('article h3 a[aria-current="page"]')).toHaveLength(1);
    expect(reopened.container.querySelectorAll('article')).toHaveLength(24 + 1);
  });

  it('marks the selected deal in the list', async () => {
    const h = await start(dealPath);
    expect(cardLink(h).getAttribute('aria-current')).toBe('page');
    expect(h.container.querySelectorAll('article h3 a[aria-current="page"]')).toHaveLength(1);
  });

  it('keeps showing a deal that the category filter hides from the list', async () => {
    const h = await start(dealPath);
    const other = payload.commodities.find((c) => c.ingredient.category !== deal.ingredient.category)!;
    await h.click(h.button(other.ingredient.category === 'PRODUCE' ? 'Produce' : other.ingredient.category === 'PROTEIN' ? 'Meat' : 'Dairy'));
    expect(cardLink(h, deal.ingredient.id)).toBeNull();
    expect(pane(h).querySelector('h2')!.textContent).toBe(deal.ingredient.name);
  });
});

describe('Back and leaving', () => {
  it('has a Back link to Deals that returns to /shop', async () => {
    const h = await start(dealPath);
    const back = [...pane(h).querySelectorAll('a')].find((a) => a.textContent === 'Deals')!;
    expect(back.getAttribute('href')).toBe('/shop');
    await h.click(back);
    expect(h.path()).toBe('/shop');
    expect(pane(h).textContent).toContain('Choose a deal');
  });

  it('leaves the deal path for the Trip view, so the Trip shows', async () => {
    const h = await start(dealPath);
    await h.openShopView('Trip');
    expect(h.path()).toBe('/shop');
    expect(text(h)).toContain('Deduplicated 3-Dish Shopping List');
  });

  it('leaves the deal path for another module', async () => {
    const h = await start(dealPath);
    await h.click(h.link('Plan'));
    expect(h.path()).toBe('/plan');
  });

  it('moves from one deal to another with a new entry each time', async () => {
    const h = await start(dealPath);
    const second = payload.commodities[1];
    await h.click(cardLink(h, second.ingredient.id));
    expect(h.path()).toBe(`/shop/deal/${encodeURIComponent(second.ingredient.id)}`);
    expect(pane(h).querySelector('h2')!.textContent).toBe(second.ingredient.name);
  });
});

describe('a deal that is not there', () => {
  it('says so and offers the way back', async () => {
    const h = await start('/shop/deal/no-such-deal');
    expect(pane(h).textContent).toContain('This deal is not available');
    const show = [...pane(h).querySelectorAll('a')].find((a) => a.textContent === 'Show Deals')!;
    await h.click(show);
    expect(h.path()).toBe('/shop');
  });
});

describe('actions on the detail', () => {
  it('pins and marks Have it, and the list card shows the same state', async () => {
    // The first deals in the keyless fixture are grouped deals, where Have it opens the Pantry; the third is a specific ingredient.
    const specific = payload.commodities[2].ingredient;
    const h = await start(`/shop/deal/${encodeURIComponent(specific.id)}`);
    const inPane = () => pane(h);
    await h.click(buttons(inPane()).find((b) => b.textContent === 'Pin to Prep')!);
    expect(h.state().pinnedIds).toEqual([specific.id]);
    expect(buttons(inPane()).some((b) => b.textContent === 'Pinned')).toBe(true);
    expect(buttons(cardLink(h, specific.id).closest('article')!).some((b) => b.textContent === 'Pinned')).toBe(true);
    const have = () => buttons(inPane()).find((b) => b.getAttribute('aria-pressed') !== null)!;
    expect(have().getAttribute('aria-pressed')).toBe('false');
    await h.click(have());
    expect(have().getAttribute('aria-pressed')).toBe('true');
  });

  it('has no accessibility violations', async () => {
    const h = await start(dealPath);
    await expectNoA11yViolations(h.container.querySelector('main')!);
  });
});
