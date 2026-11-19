// @vitest-environment jsdom
// Characterization tests for the Shop view state and its handlers (v2.0 M3 Phase B.1b, #701): the checklist and
// coupon toggles with their localStorage writes, the copy-to-notes and print actions with their timers, and the
// state kept across tab switches (owner decision 1). They pin develop's behavior so moving the state into a hook
// cannot silently change it.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import type { DashboardPayload } from '@/types/domain';
import { createDashboardHarness, keylessPayload, type DashboardHarness } from 'tests/helpers/dashboard-harness';

// The keyless fixture has no digital coupons, so every offer becomes one to exercise the clipped-coupon state.
const payload: DashboardPayload = JSON.parse(JSON.stringify(keylessPayload(), (key, value) => (key === 'dealType' && value === 'EVERYDAY_LOW' ? 'DIGITAL_COUPON' : value)));
let harness: DashboardHarness | undefined;
afterEach(async () => { await harness?.teardown(); harness = undefined; vi.restoreAllMocks(); });

const LIST = 'Trip';
const RADAR = 'Radar';
const CHECKED_KEY = 'mead_checked_items_v03';
const CLIPPED_KEY = 'mead_clipped_coupons_v03';
const checklistToggles = (h: DashboardHarness) => [...h.container.querySelectorAll<HTMLButtonElement>('button.mt-0\\.5.text-emerald-600')];
const coupons = (h: DashboardHarness) =>
  [...h.container.querySelectorAll<HTMLElement>('div[class*="cursor-pointer"][class*="rounded-xl"][class*="border-"]')]
    .filter((el) => el.className.includes('border-amber-200') || el.className.includes('border-emerald-300'));
const stored = (key: string) => JSON.parse(localStorage.getItem(key) ?? '{}') as Record<string, boolean>;

async function start(strictMode = false) {
  harness = await createDashboardHarness({ payload, strictMode });
  await harness.mount();
  await harness.openShopView('Trip');
  return harness;
}

describe('checklist and coupon toggles', () => {
  for (const strictMode of [false, true]) {
    it(`toggles a checklist item and persists it, once per click${strictMode ? ' (StrictMode)' : ''}`, async () => {
      const h = await start(strictMode);
      const first = checklistToggles(h)[0];
      const setItem = vi.spyOn(Storage.prototype, 'setItem');
      await h.click(first);
      const checkedWrites = setItem.mock.calls.filter(([key]) => key === CHECKED_KEY);
      expect(Object.values(stored(CHECKED_KEY))).toEqual([true]);
      const key = Object.keys(stored(CHECKED_KEY))[0];
      await h.click(checklistToggles(h)[0]);
      expect(stored(CHECKED_KEY)[key]).toBe(false);
      expect(checkedWrites.length).toBeGreaterThan(0);
    });

    it(`clips and unclips a coupon and persists it${strictMode ? ' (StrictMode)' : ''}`, async () => {
      const h = await start(strictMode);
      const before = coupons(h);
      expect(before.length).toBeGreaterThan(0);
      expect(before[0].className).toContain('border-amber-200');
      await h.click(before[0]);
      expect(Object.values(stored(CLIPPED_KEY))).toEqual([true]);
      expect(coupons(h)[0].className).toContain('border-emerald-300');
      await h.click(coupons(h)[0]);
      expect(Object.values(stored(CLIPPED_KEY))).toEqual([false]);
      expect(coupons(h)[0].className).toContain('border-amber-200');
    });
  }

  it('still toggles when storage is unreadable or full', async () => {
    const h = await start();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    const before = h.html();
    await h.click(checklistToggles(h)[0]);
    await h.click(coupons(h)[0]);
    expect(h.html()).not.toBe(before);
    expect(coupons(h)[0].className).toContain('border-emerald-300');
  });

  it('keeps the checklist and clipped coupons across tab switches', async () => {
    const h = await start();
    await h.click(checklistToggles(h)[1]);
    await h.click(coupons(h)[0]);
    const html = h.html();
    await h.openShopView('Radar');
    await h.openShopView('Trip');
    expect(h.html()).toBe(html);
  });
});

/**
 * Capture the timers with the given delays instead of scheduling them, so a late real timer cannot fire after the test
 * environment is torn down (the print timer calls window.print()); every other timer runs normally. The test fires the
 * captured callback itself.
 */
function captureTimers(delays: number[]) {
  const real = globalThis.setTimeout;
  const captured: Array<{ handler: () => void; delay: number }> = [];
  vi.spyOn(globalThis, 'setTimeout').mockImplementation(((handler: () => void, delay?: number, ...args: unknown[]) => {
    if (delay !== undefined && delays.includes(delay)) {
      captured.push({ handler, delay });
      return 0 as unknown as ReturnType<typeof setTimeout>;
    }
    return real(handler, delay, ...args);
  }) as typeof setTimeout);
  return (delay: number) => captured.find((entry) => entry.delay === delay)?.handler;
}

describe('copy to notes and print', () => {
  it('copies the formatted list with the checked items, shows the copied state, and clears it after 3 seconds', async () => {
    const writeText = vi.fn();
    const h = await start();
    Object.assign(navigator, { clipboard: { writeText } });
    const timer = captureTimers([3000]);
    await h.click(h.button('Export to Notes / Keep'));
    expect(writeText).toHaveBeenCalledTimes(1);
    const unchecked = writeText.mock.calls[0][0] as string;
    expect(unchecked).toContain('80542');
    expect(h.container.textContent).toContain('Copied for Apple Notes / Keep!');
    // The copied flag is Shop state: it survives a tab switch until the timer fires.
    await h.openShopView('Radar');
    await h.openShopView('Trip');
    expect(h.container.textContent).toContain('Copied for Apple Notes / Keep!');
    const clear = timer(3000);
    expect(clear).toBeDefined();
    await act(async () => { clear!(); });
    expect(h.container.textContent).not.toContain('Copied for Apple Notes / Keep!');
    await h.click(checklistToggles(h)[0]);
    await h.click(h.button('Export to Notes / Keep'));
    expect(writeText).toHaveBeenCalledTimes(2);
    expect(writeText.mock.calls[1][0]).not.toBe(unchecked);
  });

  it('opens the slip and prints after 150 ms, and keeps the slip open across tab switches', async () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    const h = await start();
    const timer = captureTimers([150]);
    await h.click(h.button('Print Checklist'));
    expect(h.container.textContent).toContain('Hide Printable Slip');
    expect(print).not.toHaveBeenCalled();
    const printNow = timer(150);
    expect(printNow).toBeDefined();
    await act(async () => { printNow!(); });
    expect(print).toHaveBeenCalledTimes(1);
    await h.openShopView('Radar');
    await h.openShopView('Trip');
    expect(h.container.textContent).toContain('Hide Printable Slip');
    await h.click(h.button('Hide Printable Slip'));
    expect(h.container.textContent).toContain('Preview Printable Slip');
  });
});
