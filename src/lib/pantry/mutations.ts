import { PantryEntry, PantryMutation, PantryMutationResult } from '@/types/pantry';
import { pantryIdentity, validatePantryEntry } from './model';

export class PantryError extends Error {
  constructor(public code: string, public status: number, message: string) { super(message); }
}

export function validatePantryMutation(input: unknown, allowUnrecognizedCatalogId = false): PantryMutation {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new PantryError('invalid_mutation', 400, 'Enter a pantry mutation.');
  const raw = input as Record<string, unknown>;
  if (typeof raw.mutationId !== 'string' || !raw.mutationId.trim() || raw.mutationId.length > 128 ||
      typeof raw.entryId !== 'string' || !raw.entryId.trim() || raw.entryId.length > 1024 ||
      !Number.isSafeInteger(raw.expectedRevision) || (raw.expectedRevision as number) < 0 || (raw.expectedRevision as number) >= Number.MAX_SAFE_INTEGER) {
    throw new PantryError('invalid_mutation', 400, 'A mutation ID, entry ID, and nonnegative expected revision are required.');
  }
  const base = { mutationId: raw.mutationId, entryId: raw.entryId, expectedRevision: raw.expectedRevision as number };
  if (raw.operation === 'delete') return { ...base, operation: 'delete' };
  if (raw.operation !== 'put') throw new PantryError('invalid_mutation', 400, 'Choose put or delete.');
  const validated = validatePantryEntry(raw.entry, allowUnrecognizedCatalogId);
  if (!validated.ok) throw new PantryError('invalid_entry', 400, JSON.stringify(validated.errors));
  return { ...base, operation: 'put', entry: validated.value };
}

/** The store must execute this transition and its acknowledgment in one transaction. */
export function evaluatePantryMutation(entries: readonly PantryEntry[], mutation: PantryMutation, nowIso: string): PantryMutationResult {
  const current = entries.find((entry) => entry.id === mutation.entryId) ?? null;
  if ((current?.revision ?? 0) !== mutation.expectedRevision || (!current && mutation.operation === 'delete')) {
    return { status: 'conflict', mutationId: mutation.mutationId, reason: 'revision', current };
  }
  if (mutation.operation === 'put') {
    const duplicate = entries.find((entry) => entry.id !== mutation.entryId && pantryIdentity(entry) === pantryIdentity(mutation.entry));
    if (duplicate) return { status: 'conflict', mutationId: mutation.mutationId, reason: 'identity', current: duplicate };
  }
  const revision = mutation.expectedRevision + 1;
  const entry: PantryEntry = mutation.operation === 'put'
    ? { ...mutation.entry, id: mutation.entryId, revision, updatedAtIso: nowIso }
    : { ...current!, revision, updatedAtIso: nowIso, deletedAtIso: nowIso };
  return { status: 'applied', mutationId: mutation.mutationId, entry };
}

export function mutationFingerprint(mutation: PantryMutation): string {
  // validatePantryMutation emits a stable whitelist/order for retry comparison.
  return JSON.stringify(validatePantryMutation(mutation, true));
}
