'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { cookingCatalogVariants } from '@/lib/pantry/catalog-search';
import { normalizePantryName, pantryIdentity, searchPantryCatalog, validatePantryEntry, cookingIngredients, activeCookingIngredients, cookingCompatibility, pantryCatalog } from '@/lib/pantry/model';
import { PantryEntry, PantryEntryInput, PantryMutation, PantryMutationResult } from '@/types/pantry';

interface Props {
  entries: readonly PantryEntry[];
  acceptedCatalogIds: readonly string[];
  status: 'Loading' | 'Saved' | 'Pending sync' | 'Couldn’t sync — Retry';
  error: string | null;
  guest: boolean;
  hasLegacyEdits: boolean;
  importDuplicates: readonly string[];
  guestEntries: readonly PantryEntry[];
  conflicts: readonly { mutation: PantryMutation; conflict?: Extract<PantryMutationResult, { status: 'conflict' }> }[];
  onSave: (input: PantryEntryInput, id?: string) => Promise<void>;
  onDelete: (entry: PantryEntry) => Promise<void>;
  onRetry: () => Promise<void>;
  onResolve: (mutationId: string, choice: 'mine' | 'remote') => Promise<void>;
  onImportGuest: () => Promise<void>;
  onReviewLegacy: () => Promise<readonly PantryEntry[]>;
  onImportLegacy: () => Promise<void>;
  onClose: () => void;
}
const button = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-emerald-50 disabled:opacity-50';

export default function VirtualPantry(props: Props) {
  const [query, setQuery] = useState('');
  const [showNo, setShowNo] = useState(false);
  const [editing, setEditing] = useState<PantryEntry | PantryEntryInput | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState(false);
  const [legacyPreview, setLegacyPreview] = useState<readonly PantryEntry[] | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const editor = useRef<HTMLFormElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); heading.current?.scrollIntoView?.({ block: 'start' }); }, []);
  useEffect(() => { if (editing) editor.current?.querySelector<HTMLInputElement>('[name=displayName]')?.focus(); }, [editing]);
  const results = searchPantryCatalog(query).slice(0, 12);
  const customResults = props.entries.filter((entry) => !entry.deletedAtIso && !entry.ingredientId && normalizePantryName(entry.displayName).includes(normalizePantryName(query)));
  const shown = props.entries.filter((entry) => !entry.deletedAtIso && (showNo || entry.available) && (!query.trim() || normalizePantryName(entry.displayName).includes(normalizePantryName(query))));
  const guestItems = props.guestEntries.filter((entry) => !entry.deletedAtIso);
  const duplicates = guestItems.filter((entry) => props.entries.some((current) => pantryIdentity(current) === pantryIdentity(entry)));

  async function perform(action: () => Promise<void>) {
    setFormError(null); setNotice(null); setBusy(true);
    try { await action(); } catch (error) { setFormError(error instanceof Error ? error.message : 'Could not save. Please retry.'); }
    finally { setBusy(false); }
  }
  async function add(input: PantryEntryInput) {
    const existing = props.entries.find((entry) => pantryIdentity(entry) === pantryIdentity(input));
    await props.onSave({ ...(existing ?? input), available: true }, existing?.id);
    setQuery(''); setNotice(`${input.displayName} marked Yes.`);
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const fields = new FormData(event.currentTarget);
    const ingredientId = String(fields.get('ingredientId') || '');
    const catalog = cookingIngredients.find((ingredient) => ingredient.id === ingredientId);
    const quantity = String(fields.get('quantity') || '').trim();
    const retainedId = editing.ingredientId === ingredientId ? ingredientId : undefined;
    const input = validatePantryEntry({
      displayName: catalog?.name ?? fields.get('displayName'), available: fields.get('available') === 'true',
      ...(ingredientId ? { ingredientId } : {}),
      ...(fields.get('location') ? { location: fields.get('location') } : {}),
      ...(quantity ? { quantity: Number(quantity) } : {}),
      ...(fields.get('unit') ? { unit: fields.get('unit') } : {}),
      ...(fields.get('useByDate') ? { useByDate: fields.get('useByDate') } : {}),
    }, Boolean(retainedId));
    if (!input.ok) { setFormError(Object.values(input.errors).join(' ')); return; }
    void perform(async () => { await props.onSave(input.value, 'id' in editing ? editing.id : undefined); setEditing(null); });
  }

  return <section aria-labelledby="virtual-pantry-title" className="mt-3 rounded-xl border border-emerald-300 bg-white p-4 text-slate-800 shadow-lg">
    <div className="flex items-start justify-between gap-3">
      <div><h2 ref={heading} tabIndex={-1} id="virtual-pantry-title" className="text-lg font-bold">Virtual Pantry</h2>
        <p className="mt-1 text-sm">Do I have this? Mark ingredients Yes or No. Recipes and purchase suggestions leave your inventory unchanged.</p></div>
      <button className={button} onClick={props.onClose} aria-label="Close Virtual Pantry">Close</button>
    </div>
    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm" role="status" aria-live="polite">
      <strong>{props.status}</strong>
      {props.guest && <span>Saved on this device. Sign in for cross-device recovery.</span>}
      {props.status === 'Couldn’t sync — Retry' && <button className={button} onClick={() => void perform(props.onRetry)}>Retry sync</button>}
    </div>
    {props.error && <p role="alert" className="mt-2 text-sm text-red-800">{props.error} Pending edits remain on this device.</p>}
    {formError && <p role="alert" className="mt-2 text-sm text-red-800">{formError}</p>}
    {notice && <p role="status" className="mt-2 text-sm text-emerald-800">{notice}</p>}
    {props.importDuplicates.length > 0 && <p role="status" className="mt-2 text-sm text-sky-900">Account entries kept for: {props.importDuplicates.join(', ')}. You can edit or re-add them in this pantry.</p>}
    {(props.guest || props.hasLegacyEdits) && <div className="mt-3 text-sm">
      <button className={button} onClick={() => void perform(async () => setLegacyPreview(await props.onReviewLegacy()))}>{props.guest ? 'Review older local inventory' : 'Review pending edits from an older app version'}</button>
      {legacyPreview && <div className="mt-2 rounded-lg border border-slate-200 p-3"><p>{props.guest ? 'Confirm these are your guest records before importing. Existing entries keep their details. Nothing will be uploaded to an account.' : 'These older edits have no entry revisions. Confirm to queue them for review; existing entries will require a conflict choice before they change. Original purchase details are preserved in a private recovery copy.'}</p>
        <ul className="my-2 max-h-40 list-inside list-disc overflow-auto">{legacyPreview.map((entry) => <li key={entry.id}>{entry.displayName}: {entry.deletedAtIso ? 'Delete' : entry.available ? 'Yes' : 'No'}</li>)}</ul>
        {legacyPreview.length === 0 && <p>No older local inventory was found.</p>}
        <div className="mt-2 flex gap-2"><button className={button} disabled={busy} onClick={() => void perform(async () => { await props.onImportLegacy(); setLegacyPreview(null); setNotice(props.guest ? 'Older guest inventory imported on this device.' : 'Older edits queued. Review any conflicts below before retrying.'); })}>{props.guest ? 'Confirm local import' : 'Confirm older edits'}</button><button className={button} onClick={() => setLegacyPreview(null)}>Cancel</button></div>
      </div>}
    </div>}

    {props.conflicts.filter((item) => item.conflict).map(({ mutation, conflict }) => <div key={mutation.mutationId} className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm">
      <p className="font-semibold">Resolve a pantry change: {mutation.operation === 'put' ? mutation.entry.displayName : conflict?.current?.displayName}</p>
      <p>{conflict?.reason === 'identity' ? 'This ingredient already has an entry. Its details have been preserved.' : conflict?.current?.deletedAtIso ? 'This entry was deleted elsewhere. Choose whether to keep that deletion or restore your edit.' : 'This entry changed elsewhere. Choose the current value or your edit.'}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button className={button} onClick={() => void perform(() => props.onResolve(mutation.mutationId, 'remote'))}>Use current value</button>
        {conflict?.reason === 'revision' && <button className={button} onClick={() => void perform(() => props.onResolve(mutation.mutationId, 'mine'))}>Keep my edit</button>}
      </div>
    </div>)}

    {!props.guest && guestItems.length > 0 && <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm">
      {!importPreview ? <button className={button} onClick={() => setImportPreview(true)}>Review guest pantry import ({guestItems.length})</button> : <>
        <h3 className="font-semibold">Import this device’s guest pantry?</h3>
        <p>Existing account entries and their details take precedence. {duplicates.length} duplicate{duplicates.length === 1 ? '' : 's'} will be kept as recorded in this account.</p>
        <ul className="my-2 max-h-40 list-inside list-disc overflow-auto">{guestItems.map((entry) => <li key={entry.id}>{entry.displayName}: {entry.available ? 'Yes' : 'No'}{duplicates.includes(entry) ? ' — account entry kept' : ''}</li>)}</ul>
        <div className="flex gap-2"><button className={button} disabled={busy} onClick={() => void perform(async () => { await props.onImportGuest(); setImportPreview(false); setNotice('Import queued. Existing account entries are preserved, including any added while you reviewed.'); })}>Confirm import</button><button className={button} onClick={() => setImportPreview(false)}>Cancel</button></div>
      </>}
    </div>}

    <label className="mt-4 block text-sm font-semibold">Search ingredients or enter a custom name
      <input type="search" value={query} maxLength={120} onChange={(event) => setQuery(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 p-2 font-normal" placeholder="Try lentils, garlic, or rice" />
    </label>
    {query.trim() && <div className="mt-2 space-y-2">
      {results.length === 0 && customResults.length === 0 && <p className="text-sm">No matching ingredient. Add your own name below.</p>}
      <ul className="grid gap-2 sm:grid-cols-2">{results.map((ingredient) => <li key={ingredient.id}>
        <button disabled={busy || !props.acceptedCatalogIds.includes(ingredient.id)} className={`${button} w-full text-left`} onClick={() => void perform(() => add({ ingredientId: ingredient.id, displayName: ingredient.name, available: true }))}>Add {ingredient.name}</button>
        {!props.acceptedCatalogIds.includes(ingredient.id) && <p className="text-xs text-slate-600">Available after your account’s catalog update. Reconnect to retry.</p>}
        {cookingCatalogVariants(activeCookingIngredients, ingredient.id).length > 0 && <details className="mt-1 text-sm"><summary className="cursor-pointer">Choose a variety (optional)</summary>
          <ul className="mt-1 space-y-1">{cookingCatalogVariants(activeCookingIngredients, ingredient.id).map((variant) => <li key={variant.id}><button className={button} disabled={busy || !props.acceptedCatalogIds.includes(variant.id)} onClick={() => void perform(() => add({ ingredientId: variant.id, displayName: variant.name, available: true }))}>Add {variant.name}</button></li>)}</ul>
        </details>}
      </li>)}
        {customResults.map((entry) => <li key={entry.id}><button disabled={busy} className={`${button} w-full text-left`} onClick={() => void perform(() => add(entry))}>Add {entry.displayName} (custom)</button></li>)}</ul>
      <button className={button} onClick={() => { setEditing({ displayName: query.trim(), available: true }); setFormError(null); }}>Add custom ingredient: {query.trim()}</button>
    </div>}
    {!props.entries.some((entry) => !entry.deletedAtIso) && !query.trim() && <div className="mt-3 text-sm">
      <p>Your pantry is empty. Search above, add a custom ingredient, or use an optional shortcut:</p>
      <div className="mt-2 flex flex-wrap gap-2">{['olive-oil', 'salt', 'black-beans-canned', 'basmati-rice-dry'].map((id) => {
        const ingredient = cookingIngredients.find((item) => item.id === id)!;
        return <button className={button} disabled={busy} key={id} onClick={() => void perform(() => add({ ingredientId: id, displayName: ingredient.name, available: true }))}>Add {ingredient.name}</button>;
      })}</div><p className="mt-1 text-slate-600">These are shortcuts. Nothing is preselected or required.</p>
    </div>}
    <label className="my-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={showNo} onChange={(event) => setShowNo(event.target.checked)} />Also show ingredients marked No</label>
    <ul className="divide-y divide-slate-200">{shown.map((entry) => <li key={entry.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="min-w-0"><p className="break-words font-semibold">{entry.displayName}</p>
        <p className="text-xs text-slate-600">{entry.location ? `${entry.location.toLowerCase()} · ` : ''}{entry.quantity !== undefined ? `${entry.quantity} ${entry.unit ?? ''} · ` : ''}{entry.useByDate ? `Use by ${entry.useByDate}` : ''}</p>
        {entry.ingredientId && cookingCompatibility.some((edge) => edge.to === entry.ingredientId && !entry.available && props.entries.some((other) => other.ingredientId === edge.from && other.available && !other.deletedAtIso)) && <p className="text-xs text-amber-800">Marked No: available varieties do not cover recipes requiring {entry.displayName}. Change this entry explicitly if you have it.</p>}
        {entry.ingredientId && !pantryCatalog.has(entry.ingredientId) && <p className="text-xs text-slate-600">Saved catalog ingredient. Your details are preserved; recipe matching needs a newer catalog.</p>}
        {!entry.ingredientId && <p className="text-xs text-slate-600">Custom ingredient. Choose a catalog match in Edit to use it in recipe matching.</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm">Available
          <select aria-label={`${entry.displayName} availability`} className="ml-2 rounded-lg border border-slate-300 p-2" value={String(entry.available)} disabled={busy} onChange={(event) => void perform(() => props.onSave({ ...entry, available: event.target.value === 'true' }, entry.id))}><option value="true">Yes</option><option value="false">No</option></select>
        </label>
        <button className={button} onClick={() => { setEditing(entry); setFormError(null); }}>Edit <span className="sr-only">{entry.displayName}</span></button>
        <button className={button} disabled={busy} onClick={() => void perform(() => props.onDelete(entry))}>Delete <span className="sr-only">{entry.displayName}</span></button>
      </div>
    </li>)}</ul>
    {shown.length === 0 && props.entries.length > 0 && <p className="py-3 text-sm">No ingredients match this view. Clear search or show ingredients marked No.</p>}

    {editing && <form ref={editor} key={'id' in editing ? editing.id : 'new'} onSubmit={submit} className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
      <h3 className="font-semibold">{'id' in editing ? 'Edit ingredient' : 'Add custom ingredient'}</h3>
      <label className="mt-2 block text-sm">Ingredient name<input name="displayName" required maxLength={120} defaultValue={editing.displayName} className="mt-1 block w-full rounded-lg border border-slate-300 p-2" /></label>
      <label className="mt-2 block text-sm">Available<select name="available" defaultValue={String(editing.available)} className="ml-2 rounded-lg border border-slate-300 p-2"><option value="true">Yes</option><option value="false">No</option></select></label>
      <details className="mt-3"><summary className="cursor-pointer text-sm font-semibold">Optional details and catalog match</summary>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">Storage location<select name="location" defaultValue={editing.location ?? ''} className="mt-1 block w-full rounded-lg border border-slate-300 p-2"><option value="">Unspecified</option><option value="PANTRY">Pantry</option><option value="FRIDGE">Fridge</option><option value="FREEZER">Freezer</option></select></label>
          <label className="text-sm">Quantity<input name="quantity" type="number" min="0" step="any" defaultValue={editing.quantity ?? ''} className="mt-1 block w-full rounded-lg border border-slate-300 p-2" /></label>
          <label className="text-sm">Unit<input name="unit" maxLength={40} defaultValue={editing.unit ?? ''} placeholder="cans, bags, g, lb" className="mt-1 block w-full rounded-lg border border-slate-300 p-2" /></label>
          <label className="text-sm">Use-by date<input name="useByDate" type="date" defaultValue={editing.useByDate ?? ''} className="mt-1 block w-full rounded-lg border border-slate-300 p-2" /></label>
          <label className="text-sm sm:col-span-2">Catalog ingredient<select name="ingredientId" defaultValue={editing.ingredientId ?? ''} className="mt-1 block w-full rounded-lg border border-slate-300 p-2"><option value="">Custom name — no recipe match</option>{editing.ingredientId && !pantryCatalog.has(editing.ingredientId) && <option value={editing.ingredientId}>{editing.displayName} (saved ingredient)</option>}{cookingIngredients.filter((ingredient) => ingredient.id === editing.ingredientId || activeCookingIngredients.some((active) => active.id === ingredient.id) && ingredient.lifecycle !== 'retired' && props.acceptedCatalogIds.includes(ingredient.id)).map((ingredient) => <option key={ingredient.id} value={ingredient.id}>{ingredient.name}</option>)}</select></label>
        </div><p className="mt-2 text-xs text-slate-600">Quantity and dates are context; they never change Yes/No. A date does not certify food safety.</p>
      </details>
      <div className="mt-3 flex gap-2"><button type="submit" disabled={busy} className={button}>Save ingredient</button><button type="button" className={button} onClick={() => setEditing(null)}>Cancel</button></div>
    </form>}
  </section>;
}
