import { FreezerItem, UserPreferences } from '@/types/domain';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
function isFreezerItem(value: unknown): value is FreezerItem {
  if (!isRecord(value)) return false;
  const text = ['id', 'canonicalIngredientId', 'ingredientName', 'category', 'store', 'storeBanner', 'purchasedAtIso'];
  const numbers = ['quantityLbOrDoz', 'purchasePricePerUnit', 'regularPricePerUnit', 'totalCostBasis', 'estimatedSavings'];
  return text.every((key) => typeof value[key] === 'string') &&
    numbers.every((key) => typeof value[key] === 'number' && Number.isFinite(value[key])) &&
    (value.unit === 'lb' || value.unit === 'doz') &&
    (value.notes === undefined || typeof value.notes === 'string');
}

/** Read-only recovery of owner-scoped older caches; never an active sync input. */
export function parseGuestFreezer(raw: string | null): FreezerItem[] {
  try {
    const value: unknown = JSON.parse(raw || '[]');
    return Array.isArray(value) ? value.filter(isFreezerItem) : [];
  } catch { return []; }
}
export function hasLegacyInventoryFields(value: unknown): boolean {
  return isRecord(value) && (Object.hasOwn(value, 'freezerItems') ||
    isRecord(value.preferences) && Object.hasOwn(value.preferences, 'onHandIngredientIds'));
}

/** Keep valid older queue records intact until the Pantry bridge reviews them. */
export function validLegacyQueueFields(value: Record<string, unknown>): boolean {
  return value.freezerItems === undefined || Array.isArray(value.freezerItems) && value.freezerItems.every(isFreezerItem);
}
export function withoutLegacyOnHand<T extends Partial<UserPreferences>>(preferences: T): Omit<T, 'onHandIngredientIds'> {
  const { onHandIngredientIds: _legacy, ...current } = preferences;
  return current;
}
export function clearLegacyInventoryCache(storage: Pick<Storage, 'removeItem'>, accountId?: string): void {
  storage.removeItem('pantrybot_virtual_freezer_v12');
  storage.removeItem('mead_on_hand_ids_v04');
  if (accountId) storage.removeItem(`pantrybot_virtual_freezer_v14:${accountId}`);
}
