// @vitest-environment jsdom
// The two sheets behind Settings' Account section (v2.0 M4-6b): Sync Status and the delete confirmation. They take their data and actions
// as props, so these tests drive each state directly; the wiring to the real sync, export and delete calls is in account-actions.test.ts.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement, type ComponentProps, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { DeleteAccountSheet, SyncStatusSheet } from '@/modules/settings/AccountSheets';
import { expectNoA11yViolations } from 'tests/helpers/render';

vi.mock('@/modules/shell/AppLink', () => ({
  default: ({ to, children, className }: { to: { module: string }; children?: ReactNode; className?: string }) =>
    createElement('a', { href: `/${to.module}`, className }, children),
}));

let root: Root;
let container: HTMLDivElement;
async function run(action: () => unknown) { await act(async () => { await action(); }); }
const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]')!;
const button = (label: string) => [...dialog().querySelectorAll('button')].find((b) => b.textContent === label)!;
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await run(() => root.unmount()); container.remove(); vi.unstubAllGlobals(); vi.useRealTimers(); });

const onClose = vi.fn();
const onSyncNow = vi.fn(async () => undefined);
async function renderSync(overrides: Partial<ComponentProps<typeof SyncStatusSheet>> = {}) {
  await run(() => root.render(createElement(SyncStatusSheet, {
    open: true, onClose, syncStatus: 'SYNCED', storageMode: 'SUPABASE_RLS', lastSyncedIso: null, currentZip: '80542', storeCount: 3,
    pantryItemCount: 2, preferencesSummary: 'Any, 0 dietary rules, cookware: Any', onSyncNow, ...overrides,
  })));
}

describe('Sync Status sheet', () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([
    ['IDLE', 'All changes synced.'],
    ['SYNCED', 'All changes synced.'],
    ['SYNCING', 'Syncing now.'],
    ['OFFLINE_QUEUED', 'Offline. Your changes are queued on this device and will sync when you are back online.'],
    ['ERROR', 'The last sync failed. Your changes stay on this device and are retried. Try Sync Now.'],
  ] as const)('says what %s means', async (status, copy) => {
    await renderSync({ syncStatus: status });
    expect(dialog().querySelector('[role=status]')!.textContent).toBe(copy);
  });

  it('says where the data lives for a cloud account and for a local one', async () => {
    await renderSync({ storageMode: 'SUPABASE_RLS' });
    expect(dialog().textContent).toContain('Stored in your private cloud account, isolated to you by row-level security.');
    await renderSync({ storageMode: 'SQLITE_LOCAL_FALLBACK' });
    expect(dialog().textContent).toContain('Stored in this server’s local database, isolated to your account.');
  });

  it('shows the last synced time, or that the session is active when there is none', async () => {
    await renderSync({ lastSyncedIso: null });
    expect(dialog().textContent).toContain('Session active');
    await renderSync({ lastSyncedIso: '2026-11-17T12:00:00.000Z' });
    expect(dialog().textContent).toContain('Last synced: ');
    expect(dialog().textContent).not.toContain('Session active');
  });

  it('runs Sync Now, which is unavailable while a sync is under way', async () => {
    await renderSync();
    await run(() => button('Sync Now').click());
    expect(onSyncNow).toHaveBeenCalledTimes(1);
    await renderSync({ syncStatus: 'SYNCING' });
    expect((button('Sync Now') as HTMLButtonElement).disabled).toBe(true);
  });

  it('lists what syncs and links to the Pantry', async () => {
    await renderSync();
    const list = dialog().querySelector('section[aria-label="What syncs"]')!;
    expect(list.textContent).toBe('What syncsHome ZIP80542My Stores3 chainsVirtual Pantry2 ingredientsMeal prepAny, 0 dietary rules, cookware: Any');
    expect([...dialog().querySelectorAll('a')].map((a) => a.getAttribute('href'))).toEqual(['/pantry']);
  });

  it('closes from its close button and is not there when closed', async () => {
    await renderSync();
    await run(() => dialog().querySelector<HTMLButtonElement>('button[aria-label="Close sync status"]')!.click());
    expect(onClose).toHaveBeenCalledTimes(1);
    await renderSync({ open: false });
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it('has no accessibility violations', async () => {
    await renderSync();
    await expectNoA11yViolations(dialog());
  });
});

const onDelete = vi.fn(async () => true);
const onExport = vi.fn(async () => true);
async function renderDelete(overrides: Partial<ComponentProps<typeof DeleteAccountSheet>> = {}) {
  await run(() => root.render(createElement(DeleteAccountSheet, { open: true, onClose, authLoading: false, onExport, onDelete, ...overrides })));
}

describe('Delete account sheet', () => {
  beforeEach(() => vi.clearAllMocks());

  it('asks before anything is sent, and says it cannot be undone', async () => {
    await renderDelete();
    expect(dialog().querySelector('h2')!.textContent).toBe('Permanently wipe account?');
    expect(dialog().textContent).toContain('It cannot be undone.');
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('deletes on the explicit button and closes when it worked', async () => {
    await renderDelete();
    await run(() => button('Yes, Purge All').click());
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('stays open with an error and no close when the delete did not work, and clears the error on retry', async () => {
    onDelete.mockResolvedValueOnce(false);
    await renderDelete();
    await run(() => button('Yes, Purge All').click());
    expect(onClose).not.toHaveBeenCalled();
    expect(dialog().querySelector('[role=alert]')!.textContent).toContain('Your account was not deleted');
    await run(() => button('Yes, Purge All').click());
    expect(onDelete).toHaveBeenCalledTimes(2);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('hides an earlier error while a retry is under way', async () => {
    onDelete.mockResolvedValueOnce(false);
    let release!: (ok: boolean) => void;
    onDelete.mockImplementationOnce(() => new Promise<boolean>((resolve) => { release = resolve; }));
    await renderDelete();
    await run(() => button('Yes, Purge All').click());
    expect(dialog().querySelector('[role=alert]')).not.toBeNull();
    await run(() => { button('Yes, Purge All').click(); });
    expect(dialog().querySelector('[role=alert]')).toBeNull();
    await run(() => release(true));
  });

  it('cannot be confirmed while a sign-in or delete is under way', async () => {
    await renderDelete({ authLoading: true });
    expect((button('Yes, Purge All') as HTMLButtonElement).disabled).toBe(true);
  });

  it('cancels from Cancel and from its close button without deleting, forgetting an earlier error', async () => {
    onDelete.mockResolvedValueOnce(false);
    await renderDelete();
    await run(() => button('Yes, Purge All').click());
    await run(() => button('Cancel').click());
    expect(onClose).toHaveBeenCalledTimes(1);
    await run(() => dialog().querySelector<HTMLButtonElement>('button[aria-label="Close delete account"]')!.click());
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(dialog().querySelector('[role=alert]')).toBeNull();
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('offers the export first, and confirms a download for a few seconds', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    await renderDelete();
    expect(button('Export My Grocery Data')).toBeDefined();
    await run(() => button('Export My Grocery Data').click());
    expect(onExport).toHaveBeenCalledTimes(1);
    expect(button('Downloaded .JSON!')).toBeDefined();
    await run(() => { vi.advanceTimersByTime(3500); });
    expect(button('Export My Grocery Data')).toBeDefined();
  });

  it('shows no download confirmation when the export did not work', async () => {
    onExport.mockResolvedValueOnce(false);
    await renderDelete();
    await run(() => button('Export My Grocery Data').click());
    expect(dialog().textContent).not.toContain('Downloaded');
  });

  it('has no accessibility violations, with and without the error', async () => {
    onDelete.mockResolvedValueOnce(false);
    await renderDelete();
    await expectNoA11yViolations(dialog());
    await run(() => button('Yes, Purge All').click());
    await expectNoA11yViolations(dialog());
  });
});
