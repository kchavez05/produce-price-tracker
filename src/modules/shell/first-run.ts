// v2.0 M4-2b: first-run detection for the /welcome onboarding (M4 decision 3). Pure functions over a Storage-like object, so
// the rule is tested on its own and the shell calls it once, after mount (the first render stays equal to the server render).
//
// A device is "first run" only when nothing says the user has been here: no setup-completed marker, none of the three keys
// the setup writes (ZIP, active stores, nutrition profile), and, so an existing guest who never changed those is not sent
// through setup, none of the keys that only real use creates (a guest pantry that has entries, shopping checklist, clipped coupons). The guest
// pantry key itself does not count: the app creates it on the first load, so it says nothing about use. A user who
// is signed in (the server resolved an account for this request) is never first run: their preferences come from the cloud,
// and the marker is written for them so signing out later does not start setup. Unreadable storage counts as "not first
// run": setup is never forced on someone it cannot remember.
export const SETUP_COMPLETED_KEY = 'pantrybot_setup_completed_v20';

const RETURNING_USER_KEYS = [
  SETUP_COMPLETED_KEY,
  'pantrybot_user_zip',
  'pantrybot_active_stores',
  'pantrybot_nutrition_profile_v12',
  'mead_checked_items_v03',
  'mead_clipped_coupons_v03',
] as const;

const GUEST_PANTRY_KEY = 'pantrybot_private_guest_pantry_v16';

/** True when the guest pantry on this device has at least one entry (the key alone is created empty on the first load). */
function hasGuestPantryEntries(storage: Pick<Storage, 'getItem'>): boolean {
  const raw = storage.getItem(GUEST_PANTRY_KEY);
  if (raw === null) return false;
  try {
    const parsed: unknown = JSON.parse(raw);
    const entries = (parsed as { entries?: unknown } | null)?.entries;
    return Array.isArray(entries) && entries.length > 0;
  } catch {
    return false;
  }
}

export type FirstRunDecision = 'welcome' | 'signed-in' | 'returning';

export function decideFirstRun(storage: Pick<Storage, 'getItem'>, accountId: string | null): FirstRunDecision {
  if (accountId) return 'signed-in';
  try {
    return RETURNING_USER_KEYS.some((key) => storage.getItem(key) !== null) || hasGuestPantryEntries(storage) ? 'returning' : 'welcome';
  } catch {
    return 'returning';
  }
}

export function markSetupCompleted(storage: Pick<Storage, 'setItem'>): void {
  try {
    storage.setItem(SETUP_COMPLETED_KEY, '1');
  } catch {
    // Storage unavailable: setup will not be forced either (see decideFirstRun).
  }
}
