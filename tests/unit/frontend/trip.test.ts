// @vitest-environment jsdom
// The Trip view (v2.0 M4-3b, wireframes Shop Trip, Empty Trip and the iPad Trip boards): the Best Plan card and the choice of plan,
// the list grouped by store with a checkbox row for each and "Show N more", the row's Details, Coupons to Clip, the actions, the
// and the staples (the empty state is in trip-empty.test.ts). The state and handlers are the Shop's (see dashboard-shop.test.ts); this file is the markup and
// the behavior that the redesign added. Through the in-memory router.
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DashboardPayload } from '@/types/domain';
import { TRIP_STORE_LIMIT } from '@/modules/shop/TripItems';
import { createDashboardHarness, keylessPayload, type DashboardHarness } from 'tests/helpers/dashboard-harness';
import { expectNoA11yViolations } from 'tests/helpers/render';

// Every offer becomes a digital coupon, so the coupon section has something in it (as dashboard-shop.test.ts does).
const payload: DashboardPayload = JSON.parse(JSON.stringify(keylessPayload(), (key, value) => (key === 'dealType' && value === 'EVERYDAY_LOW' ? 'DIGITAL_COUPON' : value)));
let harness: DashboardHarness | undefined;
afterEach(async () => { await harness?.teardown(); harness = undefined; vi.restoreAllMocks(); });

async function start(options: { payload?: DashboardPayload } = {}) {
  harness = await createDashboardHarness({ payload: options.payload ?? payload });
  await harness.mount();
  await harness.openShopView('Trip');
  return harness;
}
const text = (h: DashboardHarness) => h.container.textContent ?? '';
const buttons = (h: DashboardHarness) => [...h.container.querySelectorAll('button')];
const rows = (h: DashboardHarness) => h.container.querySelectorAll('section[aria-label] li input[type="checkbox"][id^="trip-"]');
const storeSections = (h: DashboardHarness) => [...h.container.querySelectorAll<HTMLElement>('#trip-list ~ div > section')];
const planChips = (h: DashboardHarness) => [...h.container.querySelectorAll<HTMLButtonElement>('[role="group"][aria-label="Plan"] button')];

/** What the rows of a store add up to: the subtotal the store shows. */
const owedIn = (section: HTMLElement) => [...section.querySelectorAll('li')]
  .reduce((sum, li) => sum + Number(li.querySelector('div > span:last-child')!.textContent!.replace('$', '')), 0);

describe('the Best Plan card', () => {
  it('says what the plan is and what it costs, with one chip per plan', async () => {
    const h = await start();
    const plan = h.container.querySelector('section[aria-labelledby="trip-plan"]')!;
    expect(plan.querySelector('h2')!.textContent).toBe('Best plan');
    expect(plan.textContent).toMatch(/with the best split · saves \$\d+\.\d{2} vs regular shelf prices/);
    expect(planChips(h).length).toBeGreaterThan(2);
    expect(planChips(h)[0].getAttribute('aria-pressed')).toBe('true');
    expect(planChips(h).slice(1).every((chip) => chip.getAttribute('aria-pressed') === 'false')).toBe(true);
  });

  it('follows the chosen plan, and a one-store plan puts every item in that store', async () => {
    const h = await start();
    const chip = planChips(h).find((c) => c.textContent?.includes('lowest 1-stop'))!;
    await h.click(chip);
    const chosen = planChips(h).find((c) => c.getAttribute('aria-pressed') === 'true')!;
    expect(chosen.textContent).toContain('lowest 1-stop');
    expect(storeSections(h)).toHaveLength(1);
    await h.click(planChips(h)[0]);
    expect(planChips(h)[0].getAttribute('aria-pressed')).toBe('true');
  });
});

describe('the list by store', () => {
  it('groups the items by store, each with its count and subtotal, and a checkbox for each item', async () => {
    const h = await start();
    const sections = storeSections(h);
    expect(sections.length).toBeGreaterThan(0);
    let total = 0;
    for (const section of sections) {
      const heading = section.querySelector('h3')!;
      const boxes = section.querySelectorAll('li input[type="checkbox"]');
      expect(section.getAttribute('aria-label')).toBe(heading.textContent);
      expect(section.textContent).toContain(`${boxes.length} ${boxes.length === 1 ? 'item' : 'items'}`);
      total += boxes.length;
      expect(section.querySelector('p')!.textContent).toContain(`$${owedIn(section).toFixed(2)}`);
    }
    expect(total).toBe(rows(h).length);
    expect(h.container.querySelector('#trip-list')!.textContent).toContain('ingredients to buy');
  });

  it('shows the first few of a long store and the rest on Show N more, and back on Show fewer', async () => {
    const h = await start();
    await h.click(planChips(h).find((c) => c.textContent?.includes('lowest 1-stop'))!);
    const section = () => storeSections(h)[0];
    const total = Number(section().textContent!.match(/(\d+) items?/)![1]);
    expect(total).toBeGreaterThan(TRIP_STORE_LIMIT);
    expect(section().querySelectorAll('li input[type="checkbox"]')).toHaveLength(TRIP_STORE_LIMIT);
    const more = buttons(h).find((b) => b.textContent === `Show ${total - TRIP_STORE_LIMIT} more`)!;
    expect(more.getAttribute('aria-expanded')).toBe('false');
    await h.click(more);
    expect(section().querySelectorAll('li input[type="checkbox"]')).toHaveLength(total);
    await h.click(buttons(h).find((b) => b.textContent === 'Show fewer')!);
    expect(section().querySelectorAll('li input[type="checkbox"]')).toHaveLength(TRIP_STORE_LIMIT);
  });

  it('takes an ingredient off the list when it is marked Have it, as the shopping list leaves owned ingredients out', async () => {
    const h = await start();
    const before = rows(h).length;
    // The first row's ingredient is a specific one (a grouped deal would open the Pantry instead).
    await h.click(h.container.querySelector<HTMLButtonElement>('section[aria-label] li details button[aria-pressed]')!);
    expect(h.path()).toBe('/shop');
    expect(rows(h).length).toBe(before - 1);
  });

  it('strikes a checked item and keeps the box and its label together', async () => {
    const h = await start();
    const box = h.container.querySelector<HTMLInputElement>('input[id^="trip-"]')!;
    const label = h.container.querySelector<HTMLLabelElement>(`label[for="${box.id}"]`)!;
    expect(label.className).not.toContain('line-through');
    await h.click(box);
    expect(box.checked).toBe(true);
    expect(h.container.querySelector(`label[for="${box.id}"]`)!.className).toContain('line-through');
  });

  it('holds the dishes, the curbside links and Have it behind each item\'s Details', async () => {
    const h = await start();
    const row = h.container.querySelector('section[aria-label] li')!;
    const details = row.querySelector('details')!;
    expect(details.open).toBe(false);
    expect(details.querySelector('summary')!.textContent).toContain('Details');
    expect(details.textContent).toContain('Used in:');
    expect(details.textContent).toContain('Order curbside');
    expect(details.querySelectorAll('a[target="_blank"][rel~="noopener"]').length).toBeGreaterThan(0);
    expect(details.querySelector('button[aria-pressed]')!.textContent).toBe('Have it');
  });
});

describe('coupons, actions and staples', () => {
  it('has Coupons to Clip as a closed disclosure with a count, and a Clip toggle for each', async () => {
    const h = await start();
    const section = h.container.querySelector('section[aria-label="Coupons to clip"]')!;
    const details = section.querySelector('details')!;
    expect(details.open).toBe(false);
    expect(details.querySelector('summary')!.textContent).toMatch(/^Coupons to Clip \(\d+\)Review$/);
    const toggles = [...section.querySelectorAll<HTMLButtonElement>('button[aria-pressed]')];
    expect(toggles.length).toBeGreaterThan(0);
    expect(toggles[0].textContent).toContain('Clip');
    await h.click(toggles[0]);
    expect(section.querySelector<HTMLButtonElement>('button[aria-pressed]')!.getAttribute('aria-pressed')).toBe('true');
    expect(section.querySelector('button[aria-pressed]')!.textContent).toContain('Clipped');
  });

  it('is absent when no offer is a digital coupon', async () => {
    const h = await start({ payload: keylessPayload() });
    expect(h.container.querySelector('section[aria-label="Coupons to clip"]')).toBeNull();
  });

  it('has Export to Notes as the one primary action beside Print Slip and Preview Slip', async () => {
    const h = await start();
    const export_ = h.button('Export to Notes');
    expect(export_.className).toContain('bg-accent');
    expect(h.button('Print Slip').className).not.toContain('bg-accent');
    expect(h.button('Preview Slip').getAttribute('aria-expanded')).toBe('false');
    await h.click(h.button('Preview Slip'));
    expect(h.button('Hide Slip').getAttribute('aria-expanded')).toBe('true');
    expect(text(h)).toContain('In-Store & Curbside Slip');
  });

  it('lists the staples as toggle chips that can be checked', async () => {
    const h = await start();
    const staples = h.container.querySelector('section[aria-labelledby="trip-staples"]')!;
    const chips = [...staples.querySelectorAll<HTMLButtonElement>('button[aria-pressed]')];
    expect(chips.length).toBeGreaterThan(0);
    expect(chips[0].getAttribute('aria-pressed')).toBe('false');
    await h.click(chips[0]);
    expect(staples.querySelector('button[aria-pressed]')!.getAttribute('aria-pressed')).toBe('true');
  });
});

describe('accessibility', () => {
  it('has no violations on the Trip', async () => {
    const h = await start();
    // The page content only: in jsdom every navigation variant is displayed (no CSS), which axe would flag as duplicate landmarks.
    await expectNoA11yViolations(h.container.querySelector('main')!);
  });
});
