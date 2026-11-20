'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Banner, Button, Select, TextField } from '@/components/ui';
import { pantryIdentity, validatePantryEntry, cookingIngredients, activeCookingIngredients, pantryCatalog } from '@/lib/pantry/model';
import type { PantryEntry, PantryEntryInput } from '@/types/pantry';

// v2.0 M4-4b: the ingredient form, moved out of VirtualPantry so the ingredient detail (editing an entry) and the list's custom
// add (a new entry) use the same one. The validation, the identity rules and the save call are VirtualPantry's `submit` and
// `perform`, unchanged: the same FormData fields, the same `validatePantryEntry`, the same error text. In the detail the Yes/No
// answer is its own control above, so the form carries the current answer with the entry (`showAvailable` false); a new custom
// ingredient still asks for it here.
interface Props {
  entry: PantryEntry | PantryEntryInput;
  entries: readonly PantryEntry[];
  acceptedCatalogIds: readonly string[];
  onSave: (input: PantryEntryInput, id?: string) => Promise<void>;
  /** Called after a successful save (the list closes the form; the detail stays). */
  onSaved: () => void;
  onCancel?: () => void;
  showAvailable: boolean;
  saveLabel: string;
  autoFocus?: boolean;
}

export default function PantryEntryForm({ entry, entries, acceptedCatalogIds, onSave, onSaved, onCancel, showAvailable, saveLabel, autoFocus = false }: Props) {
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const editor = useRef<HTMLFormElement>(null);
  useEffect(() => { if (autoFocus) editor.current?.querySelector<HTMLInputElement>('[name=displayName]')?.focus(); }, [autoFocus]);

  async function perform(action: () => Promise<void>) {
    setFormError(null); setBusy(true);
    try { await action(); } catch (error) { setFormError(error instanceof Error ? error.message : 'Could not save. Please retry.'); }
    finally { setBusy(false); }
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const ingredientId = String(fields.get('ingredientId') || '');
    const catalog = cookingIngredients.find((ingredient) => ingredient.id === ingredientId);
    const quantity = String(fields.get('quantity') || '').trim();
    const retainedId = entry.ingredientId === ingredientId ? ingredientId : undefined;
    const input = validatePantryEntry({
      displayName: catalog?.name ?? fields.get('displayName'), available: showAvailable ? fields.get('available') === 'true' : entry.available,
      ...(ingredientId ? { ingredientId } : {}),
      ...(fields.get('location') ? { location: fields.get('location') } : {}),
      ...(quantity ? { quantity: Number(quantity) } : {}),
      ...(fields.get('unit') ? { unit: fields.get('unit') } : {}),
      ...(fields.get('useByDate') ? { useByDate: fields.get('useByDate') } : {}),
    }, Boolean(retainedId));
    if (!input.ok) { setFormError(Object.values(input.errors).join(' ')); return; }
    const entryId = 'id' in entry ? entry.id
      : entries.find((current) => pantryIdentity(current) === pantryIdentity(input.value))?.id;
    void perform(async () => { await onSave(input.value, entryId); onSaved(); });
  }

  return (
    <form ref={editor} key={'id' in entry ? entry.id : 'new'} onSubmit={submit} className="space-y-3">
      {formError && <Banner tone="error">{formError}</Banner>}
      <TextField label="Ingredient name" name="displayName" required maxLength={120} defaultValue={entry.displayName} />
      {showAvailable && <Select label="Available" name="available" defaultValue={String(entry.available)}><option value="true">Yes</option><option value="false">No</option></Select>}
      <details open={!showAvailable}><summary className="flex min-h-touch cursor-pointer items-center text-sm font-semibold text-accent">Optional details and catalog match</summary>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <Select label="Storage location" name="location" defaultValue={entry.location ?? ''}><option value="">Unspecified</option><option value="PANTRY">Pantry</option><option value="FRIDGE">Fridge</option><option value="FREEZER">Freezer</option></Select>
          <TextField label="Quantity" name="quantity" type="number" min="0" step="any" defaultValue={entry.quantity ?? ''} />
          <TextField label="Unit" name="unit" maxLength={40} defaultValue={entry.unit ?? ''} placeholder="cans, bags, g, lb" />
          <TextField label="Use-by date" name="useByDate" type="date" defaultValue={entry.useByDate ?? ''} />
          <Select label="Catalog ingredient" name="ingredientId" defaultValue={entry.ingredientId ?? ''} className="sm:col-span-2"><option value="">Custom name — no recipe match</option>{entry.ingredientId && !pantryCatalog.has(entry.ingredientId) && <option value={entry.ingredientId}>{entry.displayName} (saved ingredient)</option>}{cookingIngredients.filter((ingredient) => ingredient.id === entry.ingredientId || activeCookingIngredients.some((active) => active.id === ingredient.id) && ingredient.lifecycle !== 'retired' && acceptedCatalogIds.includes(ingredient.id)).map((ingredient) => <option key={ingredient.id} value={ingredient.id}>{ingredient.name}</option>)}</Select>
        </div><p className="mt-2 text-xs text-muted">Quantity and dates are context; they never change Yes/No. A date does not certify food safety.</p>
      </details>
      <div className="flex flex-wrap gap-2"><Button type="submit" variant="primary" disabled={busy}>{saveLabel}</Button>{onCancel && <Button variant="quiet" onClick={onCancel}>Cancel</Button>}</div>
    </form>
  );
}
