// @vitest-environment jsdom
// The Radar view (v2.0 M4-3c, wireframes Shop Radar and iPad Radar): Stock-Up Alerts, Hold Off, Club vs. Store, the USDA
// details sheet, and from 1024 px the selected alert's detail pane (the widths are CSS; here the structure and behavior).
// Through the in-memory router. The keyless fixture has no radar signals, so each test builds the ones it needs.
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DashboardPayload, ScoredCommodity } from '@/types/domain';
import { createDashboardHarness, keylessPayload, type DashboardHarness } from 'tests/helpers/dashboard-harness';
import { expectNoA11yViolations } from 'tests/helpers/render';

const base = keylessPayload();
const [first, second, third, fourth, ...rest] = base.commodities;
const eligible: ScoredCommodity = { ...first, arbitragePrompt: { eligible: true, label: 'Buy 2: Prep 1, Freeze 1', recommendedFreezeQty: 1, unit: 'lb', freezeCostBasis: 3, futureWeekSavings: 1.5 } };
const peak: ScoredCommodity = {
  ...fourth,
  cycleSignal: {
    status: 'CYCLE_PEAK_WAIT', badgeLabel: 'Peak', sixWeekLow: 1, sixWeekHigh: 2, sixWeekMedian: 1.5, pctVsSixWeekLow: 40,
    substitutionSuggestion: { substituteIngredientId: third.ingredient.id, substituteName: 'Substitute Pick', substitutePrice: 1, substituteStore: 'KING_SOOPERS', savingsPerUnit: 0.5, reason: 'Pork shoulder is cheaper this week' },
  },
};
const withSignals: DashboardPayload = {
  ...base,
  commodities: [eligible, second, third, peak, ...rest],
  marketRadar: {
    buyBeforeSpike: [second],
    stockUpCycleLows: [eligible, second],
    cyclePeakWaitList: [peak],
    holdOffDropping: [{ ingredient: third.ingredient, currentLocalPrice: 3.2, expectedSaleTarget: 2.4, reason: 'Wholesale is falling fast' }],
  },
};
let harness: DashboardHarness | undefined;
afterEach(async () => { await harness?.teardown(); harness = undefined; vi.restoreAllMocks(); });

async function start(payload: DashboardPayload = withSignals) {
  harness = await createDashboardHarness({ payload });
  await harness.mount();
  await harness.openShopView('Radar');
  return harness;
}
const text = (h: DashboardHarness) => h.container.textContent ?? '';
const buttons = (root: ParentNode) => [...root.querySelectorAll('button')];
const section = (h: DashboardHarness, id: string) => h.container.querySelector<HTMLElement>(`section[aria-labelledby="${id}"]`)!;
const pane = (h: DashboardHarness) => h.container.querySelector<HTMLElement>('section[aria-label="Alert detail"]')!;

describe('the sections', () => {
  it('has Stock-Up Alerts, Hold Off and Club vs. Store as headed sections', async () => {
    const h = await start();
    expect([...h.container.querySelectorAll('section[aria-labelledby] > h2')].map((el) => el.textContent))
      .toEqual(['Stock-Up Alerts', 'Hold Off', 'Club vs. Store']);
  });

  it('says so when there is nothing to show in a section', async () => {
    const h = await start(base);
    expect(section(h, 'radar-stock-up').textContent).toContain('No stock-up lows this week.');
    expect(section(h, 'radar-hold-off').textContent).toContain('Nothing is at a cycle peak this week.');
  });
});

describe('Stock-Up Alerts', () => {
  it('shows each low with its store, price and 6-week low tag', async () => {
    const h = await start();
    const cards = section(h, 'radar-stock-up').querySelectorAll('article');
    expect(cards).toHaveLength(2);
    expect(cards[0].querySelector('h3')!.textContent).toContain(first.ingredient.name);
    expect(cards[0].textContent).toContain('6-week low');
    expect(cards[0].textContent).toMatch(/\$\d+\.\d{2}\/\w+ · buy 2, freeze 1/);
    expect(cards[1].textContent).not.toContain('buy 2, freeze 1');
    expect(cards[0].textContent).toMatch(/6-week range: \$\d+\.\d{2} – \$\d+\.\d{2}/);
  });

  it('draws the six-week trend only where there is verified history', async () => {
    const h = await start();
    const trends = section(h, 'radar-stock-up').querySelectorAll('[role="img"][aria-label^="Price trend for"]');
    expect(trends.length).toBeGreaterThan(0);
    expect(trends[0].children).toHaveLength(first.priceHistory.length);
  });

  it('draws no trend when no week has a verified local price, or the comparison evidence is unavailable', async () => {
    const unverified = { ...eligible, priceHistory: eligible.priceHistory.map((point) => ({ ...point, bestLocalPrice: null })) };
    const noEvidence = { ...second, comparisonEvidence: { status: 'UNVERIFIED' } as never };
    const h = await start({
      ...withSignals,
      commodities: [unverified, noEvidence, ...withSignals.commodities.slice(2)],
      marketRadar: { ...withSignals.marketRadar, stockUpCycleLows: [unverified, noEvidence] },
    });
    expect(section(h, 'radar-stock-up').querySelectorAll('article')).toHaveLength(2);
    expect(section(h, 'radar-stock-up').querySelectorAll('[role="img"][aria-label^="Price trend for"]')).toHaveLength(0);
  });

  it('labels the fallback list Top deal, not 6-week low, when the radar has no confirmed lows', async () => {
    const h = await start({ ...withSignals, marketRadar: { ...withSignals.marketRadar, stockUpCycleLows: undefined } });
    const cards = section(h, 'radar-stock-up').querySelectorAll('article');
    expect(cards.length).toBeGreaterThan(0);
    expect(cards[0].textContent).toContain('Top deal');
    expect(section(h, 'radar-stock-up').textContent).not.toContain('6-week low');
  });

  it('sends Buy 2 / Freeze 1 to the Pantry review', async () => {
    const h = await start();
    await h.click(buttons(section(h, 'radar-stock-up')).find((b) => b.textContent === 'Buy 2 / Freeze 1')!);
    expect(h.container.textContent).toContain('Review your Pantry before stocking up.');
  });
});

describe('Hold Off', () => {
  it('shows the cycle peak with its reason and pins the swap', async () => {
    const h = await start();
    const card = section(h, 'radar-hold-off').querySelector('article')!;
    expect(card.textContent).toContain('Cycle peak');
    expect(card.textContent).toContain('is high this week');
    expect(card.textContent).toContain('Pork shoulder is cheaper this week');
    await h.click(buttons(card).find((b) => b.textContent === 'Pin swap')!);
    expect(h.state().pinnedIds).toEqual([third.ingredient.id]);
  });

  it('says the historical comparison is unavailable when the evidence is', async () => {
    const h = await start({ ...withSignals, marketRadar: { ...withSignals.marketRadar, cyclePeakWaitList: [{ ...peak, comparisonEvidence: { status: 'UNVERIFIED' } as never }] } });
    expect(section(h, 'radar-hold-off').textContent).toContain('Historical comparison unavailable');
  });
});

describe('Club vs. Store', () => {
  it('has a row for each food with a club comparison, with the store, Costco and Sam\'s prices and the verdict', async () => {
    const h = await start();
    const expected = withSignals.commodities.slice(0, 12).filter((c) => c.clubBenchmark);
    const rows = section(h, 'radar-club').querySelectorAll('li');
    expect(rows).toHaveLength(expected.length);
    const club = expected[0].clubBenchmark!;
    expect(rows[0].textContent).toContain(expected[0].ingredient.name);
    expect(rows[0].textContent).toContain(`Costco $${club.costcoPricePerUnit.toFixed(2)}`);
    expect(rows[0].textContent).toContain(`Sam's $${club.samsClubPricePerUnit.toFixed(2)}`);
    expect(rows[0].textContent).toContain(club.verdictLabel);
  });
});

describe('the USDA details', () => {
  it('opens a sheet with the wholesale movers and the data status, and closes it', async () => {
    const h = await start();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    await h.click(buttons(h.container.querySelector('main section[aria-labelledby="radar-club"] ~ div')!).find((b) => b.textContent === 'Details')!);
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]')!;
    expect(dialog.textContent).toContain('USDA Movers and Data Status');
    expect(dialog.textContent).toContain('Buy now and freeze');
    expect(dialog.textContent).toContain('Wholesale is falling fast');
    expect(dialog.textContent).toContain('Market history');
    await h.click(dialog.querySelector<HTMLElement>('button[aria-label="Close"]')!);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });
});

describe('opening and selecting an alert', () => {
  it('links the name to Deal Detail below 1024 px', async () => {
    const h = await start();
    const link = section(h, 'radar-stock-up').querySelector<HTMLAnchorElement>('article h3 a')!;
    expect(link.getAttribute('href')).toBe(`/shop/deal/${encodeURIComponent(first.ingredient.id)}`);
    await h.click(link);
    expect(h.path()).toBe(`/shop/deal/${encodeURIComponent(first.ingredient.id)}`);
  });

  it('shows the first alert in the pane from 1024 px, and the one chosen after that', async () => {
    const h = await start();
    expect(pane(h).querySelector('h2')!.textContent).toBe(first.ingredient.name);
    const choose = (name: string) => buttons(section(h, 'radar-stock-up')).find((b) => b.textContent === name)!;
    expect(choose(first.ingredient.name).getAttribute('aria-pressed')).toBe('true');
    await h.click(choose(second.ingredient.name));
    expect(pane(h).querySelector('h2')!.textContent).toBe(second.ingredient.name);
    expect(choose(second.ingredient.name).getAttribute('aria-pressed')).toBe('true');
    expect(choose(first.ingredient.name).getAttribute('aria-pressed')).toBe('false');
    expect(h.path()).toBe('/shop');
  });

  it('shows a Hold Off alert in the pane too', async () => {
    const h = await start();
    await h.click(buttons(section(h, 'radar-hold-off')).find((b) => b.textContent === peak.ingredient.name)!);
    expect(pane(h).querySelector('h2')!.textContent).toBe(peak.ingredient.name);
  });

  it('has nothing to show in the pane when there are no alerts', async () => {
    const h = await start(base);
    expect(pane(h).textContent).toContain('Nothing to show yet.');
  });
});

describe('accessibility', () => {
  it('has no violations on the Radar', async () => {
    const h = await start();
    // The page content only: in jsdom every navigation variant is displayed (no CSS), which axe would flag as duplicate landmarks.
    await expectNoA11yViolations(h.container.querySelector('main')!);
  });
});
