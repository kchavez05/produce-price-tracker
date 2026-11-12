import { pantryIdentity, validatePantryEntry } from '@/lib/pantry/model';
import type { PantryEntry, PantryEntryInput, PantrySaveIntent } from '@/types/pantry';

export interface BarcodeAddition {
  input: PantryEntryInput;
  entryId: string;
  intent: PantrySaveIntent;
  priorAvailability: 'Yes' | 'No' | 'Deleted' | 'New';
}
/** Capture the reviewed revision/details once; confirmation never silently rebases. */
export function prepareBarcodeAddition(entries: readonly PantryEntry[], input: PantryEntryInput, makeId = () => crypto.randomUUID()): BarcodeAddition {
  const validated = validatePantryEntry(input);
  if (!validated.ok) throw new Error(Object.values(validated.errors).join(' '));
  const existing = entries.find((entry) => pantryIdentity(entry) === pantryIdentity(validated.value));
  const preserved: PantryEntryInput = existing ? { displayName: existing.displayName, available: true,
    ...(existing.ingredientId ? { ingredientId: existing.ingredientId } : {}),
    ...(existing.quantity !== undefined ? { quantity: existing.quantity } : {}),
    ...(existing.unit !== undefined ? { unit: existing.unit } : {}),
    ...(existing.location !== undefined ? { location: existing.location } : {}),
    ...(existing.useByDate !== undefined ? { useByDate: existing.useByDate } : {}) } : { ...validated.value, available: true };
  return { input: preserved, entryId: existing?.id ?? makeId(),
    intent: { mutationId: makeId(), expectedRevision: existing?.revision ?? 0 },
    priorAvailability: !existing ? 'New' : existing.deletedAtIso ? 'Deleted' : existing.available ? 'Yes' : 'No' };
}
