// @vitest-environment jsdom
// The Plan home (v2.0 M4-5a, wireframes Plan and Plan Preferences): the servings stepper, the preferences summary chip and its sheet,
// the Pantry hint, the cost summary, the three dish cards with View dish and Save, the browse-all list and the AI request card.
// Through the in-memory router; the preferences, plan and pantry hooks are the real ones.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { guestPantryKey } from '@/lib/pantry/client-cache';
import { createDashboardHarness, keylessPayload, type DashboardHarness } from 'tests/helpers/dashboard-harness';
import { expectNoA11yViolations } from 'tests/helpers/render';

const payload = keylessPayload();
let harness: DashboardHarness | undefined;
afterEach(async () => { await harness?.teardown(); harness = undefined; vi.restoreAllMocks(); });

async function start(storage?: Record<string, string>) {
  harness = await createDashboardHarness({ payload, storage });
  await harness.mount({ initialPath: '/plan' });
  return harness;
}
const text = (h: DashboardHarness) => h.container.textContent ?? '';
const cards = (h: DashboardHarness) => [...h.container.querySelectorAll<HTMLElement>('article[aria-label]')];
const chip = (label: string) => [...document.querySelectorAll<HTMLButtonElement>('[role="dialog"] button')].find((b) => b.textContent === label)!;
const prefsChip = (h: DashboardHarness) => [...h.container.querySelectorAll('button')].find((b) => b.textContent?.includes('Edit preferences'))!;

describe('the top of the Plan', () => {
  it('keeps the plan heading for assistive technology, with the total meals', async () => {
    const h = await start();
    const heading = h.container.querySelector('#plan-title')!;
    expect(heading.tagName).toBe('H2');
    expect(heading.className).toContain('sr-only');
    expect(heading.textContent).toMatch(/^Your 3-Dish Weekend Meal Prep Plan \(\d+ Total Meals\)$/);
  });

  it('has a servings stepper of 4, 6 and 8, on 6 to begin with, that changes the plan\'s servings', async () => {
    const h = await start();
    const group = h.container.querySelector('[role="radiogroup"][aria-label="Servings per dish"]')!;
    expect([...group.querySelectorAll('span')].map((span) => span.textContent)).toEqual(['4', '6', '8']);
    expect(h.servingsRadio(6).checked).toBe(true);
    const before = h.requests.filter((r) => r.url.startsWith('/api/dashboard?')).length;
    await h.click(h.servingsRadio(8));
    expect(h.servingsRadio(8).checked).toBe(true);
    expect(h.servingsRadio(6).checked).toBe(false);
    await h.waitUntil(() => h.requests.filter((r) => r.url.startsWith('/api/dashboard?')).length > before);
    expect(new URL(h.requests.filter((r) => r.url.startsWith('/api/dashboard?')).at(-1)!.url, 'http://x').searchParams.get('servings')).toBe('8');
  });

  it('shows the cost summary with the numbers and the notes the old header had', async () => {
    const h = await start();
    const summary = h.container.querySelector('section[aria-label="Cost summary"]')!;
    expect(summary.textContent).toMatch(/Additional \/ Serving\$\d/);
    expect(summary.textContent).toContain('Estimated additional grocery cost');
    expect(summary.textContent).toContain('purchase prices only');
    expect(summary.textContent).toContain('Planning cycle:');
    expect(summary.textContent).toContain('Staple estimates allocate recipe use; package checkout totals may differ.');
    expect(summary.querySelector('a')!.getAttribute('href')).toBe('/shop');
  });
});

describe('the preferences chip and sheet', () => {
  it('summarises the preferences in the chip, and opens them in a sheet', async () => {
    const h = await start();
    expect(prefsChip(h).textContent).toBe('Any macros · No restrictionsEdit preferences');
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    await h.click(prefsChip(h));
    const dialog = document.querySelector('[role="dialog"]')!;
    expect(dialog.textContent).toContain('Preferences');
    expect([...dialog.querySelectorAll('h3')].map((el) => el.textContent)).toEqual(['Macro Goal', 'Dietary Rules', 'Cookware']);
    expect(dialog.textContent).toContain('Changes apply to your next suggestions. Saved on this device until you sign in.');
  });

  it('chooses one macro goal, any number of dietary rules and one vessel, each shown as pressed, and the chip follows', async () => {
    const h = await start();
    await h.openPlanPreferences();
    expect(chip('All Macros').getAttribute('aria-pressed')).toBe('true');
    await h.click(chip('High-Protein (40g+)'));
    expect(chip('High-Protein (40g+)').getAttribute('aria-pressed')).toBe('true');
    expect(chip('All Macros').getAttribute('aria-pressed')).toBe('false');
    await h.click(chip('Gluten-Free'));
    await h.click(chip('Nut-Free'));
    expect(['Gluten-Free', 'Nut-Free', 'Dairy-Free'].map((label) => chip(label).getAttribute('aria-pressed'))).toEqual(['true', 'true', 'false']);
    await h.click(chip('Dutch Oven'));
    expect(chip('Dutch Oven').getAttribute('aria-pressed')).toBe('true');
    await h.click(chip('Skillet'));
    expect(chip('Dutch Oven').getAttribute('aria-pressed')).toBe('false');
    expect(chip('Skillet').getAttribute('aria-pressed')).toBe('true');
    expect(prefsChip(h).textContent).toBe('High-Protein (40g+) · Gluten-Free, Nut-Free · SkilletEdit preferences');
  });

  it('offers Clear Profile Filters only while a preference is set, and Done closes the sheet', async () => {
    const h = await start();
    await h.openPlanPreferences();
    expect([...document.querySelectorAll('[role="dialog"] button')].some((b) => b.textContent === 'Clear Profile Filters')).toBe(false);
    await h.click(chip('Balanced'));
    await h.click(chip('Clear Profile Filters'));
    expect(chip('All Macros').getAttribute('aria-pressed')).toBe('true');
    expect([...document.querySelectorAll('[role="dialog"] button')].some((b) => b.textContent === 'Clear Profile Filters')).toBe(false);
    expect(prefsChip(h).textContent).toBe('Any macros · No restrictionsEdit preferences');
    await h.click(chip('Done'));
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });
});

describe('the Pantry hint', () => {
  const hint = (h: DashboardHarness) => [...h.container.querySelectorAll('[role=status]')].find((el) => el.textContent?.includes('Mark what you have in Pantry'));
  const owned = { owner: 'guest:test', entries: [{ id: 'oil', displayName: 'Olive oil', ingredientId: 'olive-oil', available: true, revision: 1, updatedAtIso: '' }],
    legacyMigrationVersion: 1, needsCatalogMatch: [], legacySource: { owner: 'guest:test', freezerItems: [], onHandIngredientIds: [] } };

  it('shows while nothing is marked in the Pantry, and can be hidden', async () => {
    const h = await start();
    expect(hint(h)).toBeDefined();
    await h.click(h.button('Hide hint'));
    expect(hint(h)).toBeUndefined();
  });

  it('is not shown once something is marked in the Pantry', async () => {
    const h = await start({ [guestPantryKey]: JSON.stringify(owned) });
    await h.waitUntil(() => !hint(h));
    expect(hint(h)).toBeUndefined();
  });
});

describe('the dish cards', () => {
  it('are three, each with its cost per serving as a tag and a line of protein, calories and time', async () => {
    const h = await start();
    expect(cards(h).filter((card) => card.querySelector('h3'))).toHaveLength(3);
    const first = cards(h)[0];
    expect(first.querySelector('h3')!.textContent).toBeTruthy();
    expect(first.textContent).toMatch(/\$\d+\.\d{2}\/srv/);
    expect(first.textContent).toMatch(/\d+g protein · \d+ kcal · \d+g carbs · \d+g fat/);
    expect(first.textContent).toMatch(/\d+m prep · \d+m cook/);
  });

  it('link View dish to the dish\'s own screen, with no in-place expansion', async () => {
    const h = await start();
    const links = [...h.container.querySelectorAll<HTMLAnchorElement>('article a')].filter((a) => a.textContent === 'View dish');
    expect(links).toHaveLength(3);
    for (const link of links) expect(link.getAttribute('href')).toMatch(/^\/plan\/dish\//);
    expect(h.container.querySelector('button[aria-expanded][aria-controls]')).toBeNull();
    expect(text(h)).not.toContain('Low-Effort Batch Cooking Steps:');
  });

  it('offer Save as a toggle that reads Save until the recipe is saved (saving itself is covered with a signed-in account)', async () => {
    const h = await start();
    for (const card of cards(h).filter((candidate) => candidate.querySelector('h3'))) {
      const save = [...card.querySelectorAll('button')].find((b) => b.getAttribute('aria-pressed') !== null)!;
      expect(save.textContent).toBe('Save');
      expect(save.getAttribute('aria-pressed')).toBe('false');
    }
  });

  it('make View dish the one primary action of each card', async () => {
    const h = await start();
    for (const card of cards(h).filter((candidate) => candidate.querySelector('h3'))) {
      const primary = [...card.querySelectorAll('a, button')].filter((el) => el.className.includes('bg-accent')).map((el) => el.textContent);
      expect(primary).toEqual(['View dish']);
    }
  });
});

describe('browsing all the dishes', () => {
  it('shows the full list on demand, with the count, and promotes a dish', async () => {
    const h = await start();
    const total = payload.allRankedDishes.length;
    const toggle = () => h.button(`Show All ${total} Dishes`);
    await h.click(toggle());
    expect(h.button('Hide Full Matrix').getAttribute('aria-expanded')).toBe('true');
    const rows = h.container.querySelectorAll('section[aria-labelledby="plan-blueprints"] li');
    expect(rows).toHaveLength(total);
    expect(rows[0].textContent).toMatch(/\$\d+\.\d{2}\/serving • Batch: \$\d/);
    await h.click([...h.container.querySelectorAll('button')].filter((b) => b.textContent === 'Promote to Top 3')[0]);
    expect(cards(h).filter((card) => card.querySelector('h3'))).toHaveLength(3);
  });
});

describe('the AI request card', () => {
  it('has the request field and the standard-suggestions action, with no AI call until asked', async () => {
    const h = await start();
    const card = h.container.querySelector('section[aria-label="AI meal plan"]')!;
    expect(card.querySelector('input[aria-label="Optional AI meal-plan request"]')).not.toBeNull();
    expect([...card.querySelectorAll('button')].map((b) => b.textContent)).toEqual(['Sign in to access AI', 'Use standard suggestions']);
    expect(card.textContent).toContain('Manual pantry entry and standard suggestions are always available.');
    expect(h.requests.some((r) => r.url.includes('/api/ai'))).toBe(false);
  });
});

describe('accessibility', () => {
  it('has no violations on the Plan, with the preferences sheet closed and open', async () => {
    const h = await start();
    // The page content only: in jsdom every navigation variant is displayed (no CSS), which axe would flag as duplicate landmarks.
    await expectNoA11yViolations(h.container.querySelector('main')!);
    await h.openPlanPreferences();
    await expectNoA11yViolations(document.querySelector('[role="dialog"]')!);
  });
});
