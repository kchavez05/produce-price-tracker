import { describe, expect, it } from 'vitest';
import { SETUP_COMPLETED_KEY, decideFirstRun, markSetupCompleted } from '@/modules/shell/first-run';

// First-run detection (v2.0 M4-2b, M4 decision 3): a device is first run only when nothing says the user has been here. The
// rule is a pure function so the returning-user spike (existing guests, signed-in users on a new device, unreadable storage)
// is pinned without a browser.
function storage(entries: Record<string, string> = {}) {
  const map = new Map(Object.entries(entries));
  return { getItem: (key: string) => map.get(key) ?? null, setItem: (key: string, value: string) => { map.set(key, value); }, map };
}

describe('decideFirstRun', () => {
  it('sends an empty device with no account to the welcome setup', () => {
    expect(decideFirstRun(storage(), null)).toBe('welcome');
  });

  it.each([
    SETUP_COMPLETED_KEY,
    'pantrybot_user_zip',
    'pantrybot_active_stores',
    'pantrybot_nutrition_profile_v12',
    'mead_checked_items_v03',
    'mead_clipped_coupons_v03',
  ])('treats a device with %s as a returning user', (key) => {
    expect(decideFirstRun(storage({ [key]: 'x' }), null)).toBe('returning');
  });

  it('treats a guest pantry with entries as a returning user, but not the empty one the app creates on the first load', () => {
    const key = 'pantrybot_private_guest_pantry_v16';
    expect(decideFirstRun(storage({ [key]: JSON.stringify({ owner: 'guest:private', entries: [{ id: 'a' }] }) }), null)).toBe('returning');
    expect(decideFirstRun(storage({ [key]: JSON.stringify({ owner: 'guest:private', entries: [] }) }), null)).toBe('welcome');
    expect(decideFirstRun(storage({ [key]: 'not json' }), null)).toBe('welcome');
    expect(decideFirstRun(storage({ [key]: 'null' }), null)).toBe('welcome');
  });

  it('does not send a signed-in user to setup, even on a new device with empty storage', () => {
    expect(decideFirstRun(storage(), 'alice')).toBe('signed-in');
  });

  it('prefers the account over stored keys', () => {
    expect(decideFirstRun(storage({ pantrybot_user_zip: '80202' }), 'alice')).toBe('signed-in');
  });

  it('never forces setup on a device whose storage cannot be read', () => {
    const broken = { getItem: () => { throw new Error('denied'); } };
    expect(decideFirstRun(broken, null)).toBe('returning');
  });

  it('is not triggered by data the app does not write for a returning user (theme)', () => {
    expect(decideFirstRun(storage({ 'pantrybot-theme': 'dark' }), null)).toBe('welcome');
  });
});

describe('markSetupCompleted', () => {
  it('writes the one new key, so the device is returning afterwards', () => {
    const device = storage();
    markSetupCompleted(device);
    expect(device.map.get(SETUP_COMPLETED_KEY)).toBe('1');
    expect(decideFirstRun(device, null)).toBe('returning');
  });

  it('survives storage that refuses writes', () => {
    expect(() => markSetupCompleted({ setItem: () => { throw new Error('quota'); } })).not.toThrow();
  });
});
