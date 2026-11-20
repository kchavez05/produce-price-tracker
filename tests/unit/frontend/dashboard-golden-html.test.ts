// @vitest-environment jsdom
// DOM-equivalence guard for the v2.0 M3 dashboard split (#701, plan decision 8).
// Any diff during Phase A means the markup changed and is a failure to explain or fix, never to
// regenerate. Goldens are deleted or replaced when Phase B restructures the page on purpose.
import { afterEach, describe, it } from 'vitest';
import {
  aliceSync, createDashboardHarness, keylessPayload, type DashboardHarness, type FetchHandler,
} from 'tests/helpers/dashboard-harness';
import { expectGolden } from 'tests/helpers/golden';
import type { DashboardPayload, UserSyncPayload, WeeklySyncCronResult } from '@/types/domain';

const payload: DashboardPayload = keylessPayload();
let harness: DashboardHarness | undefined;
afterEach(async () => { await harness?.teardown(); harness = undefined; });

async function start(options: { sync?: UserSyncPayload; onFetch?: FetchHandler; accountId?: string } = {}) {
  harness = await createDashboardHarness({ payload, sync: options.sync, onFetch: options.onFetch });
  await harness.mount(options.accountId ? { initialAccountId: options.accountId } : {});
  return harness;
}
const cloudAccount: UserSyncPayload = { ...aliceSync, profile: { ...aliceSync.profile!, isCloudBacked: true } };
const digest = {
  ok: true, cycle: 'preview_digest', executedAtIso: '2026-11-17T12:00:00.000Z', syncedOffersCount: 0,
  refreshStatus: 'estimates_only', auditStorage: 'preview', dataSources: { flippLive: false, krogerLive: false, usdaLive: false },
  smartPushNotifications: [{ id: 'push-1', triggerType: 'FRIDAY_PREP_DIGEST', scheduledWindowLabel: 'Friday 4 PM', title: 'Weekend prep digest',
    subtitle: 'Three dishes', body: 'Your weekend trio is ready.', deepLinkPath: '/', badgeText: 'Digest', priority: 'normal' }],
  fridayWeekendDigest: { generatedAtIso: '2026-11-17T12:00:00.000Z', adCycleLabel: 'This week', zipCode: '80542', topValueCommodities: [],
    splurgeAlerts: [], recommendedWeekendTrio: [], markdownDigest: '# Weekend digest' },
  recentSyncRuns: [],
} as unknown as WeeklySyncCronResult;
const checklistToggle = (h: DashboardHarness) => {
  const found = h.container.querySelector<HTMLButtonElement>('button.mt-0\\.5.text-emerald-600');
  if (!found) throw new Error('Missing checklist toggle');
  return found;
};

describe('dashboard golden HTML (guest, keyless)', () => {
  it('1 board', async () => {
    const h = await start();
    expectGolden('01-guest-board', h.html());
  });
  it('2 meal plan without an AI plan', async () => {
    const h = await start();
    await h.click(h.link('Plan'));
    expectGolden('02-guest-meal-plan', h.html());
  });
  it('6 radar', async () => {
    const h = await start();
    await h.openShopView('Radar');
    expectGolden('06-guest-radar', h.html());
  });
  it('3 meal plan with a generated AI plan and an expanded dish', async () => {
    const h = await start({ sync: cloudAccount, accountId: 'alice', onFetch: (input) => (input === '/api/ai-meal-plan'
      ? Response.json({ dishes: payload.allRankedDishes.slice(0, 3), message: 'Updated 3-dish meal-prep plan.' }) : undefined) });
    await h.click(h.link('Plan'));
    await h.click(h.button('Remix 3-dish plan with AI'));
    await h.waitUntil(() => h.container.textContent?.includes('Updated 3-dish meal-prep plan.') === true);
    expectGolden('03-meal-plan-ai-plan', h.html());
  });
  it('4 shopping list, split trip', async () => {
    const h = await start();
    await h.openShopView('Trip');
    expectGolden('04-guest-shopping-split', h.html());
  });
  it('5 shopping list, single-store trip with one checked item', async () => {
    const h = await start();
    await h.openShopView('Trip');
    // The ranked single-store cards start with their rank, "#1", "#2"...
    await h.click([...h.container.querySelectorAll('button')].find((b) => b.textContent?.startsWith('#1'))!);
    await h.click(checklistToggle(h));
    expectGolden('05-guest-shopping-single-store-checked', h.html());
  });
  it('7 pantry panel open', async () => {
    const h = await start();
    await h.click(h.link('Pantry'));
    await h.waitUntil(() => Boolean(h.container.querySelector('#virtual-pantry-title')));
    await h.waitUntil(() => h.container.querySelector('section[aria-labelledby="virtual-pantry-title"] [role="status"]') !== null);
    expectGolden('07-guest-pantry-open', h.html());
  });
  it('8a ZIP modal with an error', async () => {
    const h = await start();
    await h.click(h.buttonByTitle('Click to change your ZIP code'));
    const input = h.container.querySelector<HTMLInputElement>('input[placeholder^="e.g. 80542"]')!;
    await h.type(input, '');
    await h.click(h.button('Update Location')); // an empty entry is rejected
    await h.waitUntil(() => h.container.textContent?.includes('Please enter a valid 5-digit US ZIP code.') === true);
    expectGolden('08a-zip-modal-error', h.html());
  });
  it('8b stores modal', async () => {
    const h = await start();
    await h.click(h.buttonByTitle('Customize which grocery stores you shop at'));
    expectGolden('08b-stores-modal', h.html());
  });
  it('8c alerts modal with a digest', async () => {
    const h = await start({ onFetch: (input) => (input.startsWith('/api/cron/weekly-sync?') ? Response.json(digest) : undefined) });
    await h.click(h.buttonByTitle('Preview Smart Push Notifications & Friday Weekend Meal-Prep Digest'));
    await h.waitUntil(() => h.container.textContent?.includes('Weekend prep digest') === true);
    expectGolden('08c-alerts-modal-digest', h.html());
  });
  it('8d account modal (on Settings)', async () => {
    const h = await start();
    await h.openAccountDialog();
    expectGolden('08d-account-modal', h.html());
  });
  it('9 print slip open', async () => {
    const h = await start();
    await h.openShopView('Trip');
    await h.click(h.button('Preview Printable Slip'));
    expectGolden('09-print-slip-open', h.html());
  });
  it('11 settings, guest', async () => {
    const h = await start();
    await h.click(h.link('Account and settings'));
    expectGolden('11-settings-guest', h.html());
  });
  it('12 settings, signed in', async () => {
    const h = await start({ sync: aliceSync, accountId: 'alice' });
    await h.settle();
    await h.click(h.link('Account and settings'));
    expectGolden('12-settings-signed-in', h.html());
  });
  it('10 signed-in board', async () => {
    const h = await start({ sync: aliceSync, accountId: 'alice' });
    await h.settle();
    expectGolden('10-signed-in-board', h.html());
  });
});
