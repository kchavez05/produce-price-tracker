'use client';

import BarcodeEntry from '@/components/BarcodeEntry';
import { Banner, Button, Card, Chip, EmptyState, SegmentedControl, TextField } from '@/components/ui';
import SpeechPantryEntry from '@/components/SpeechPantryEntry';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import PantryEntryForm from '@/modules/pantry/PantryEntryForm';
import { cookingCatalogVariants } from '@/lib/pantry/catalog-search';
import { normalizePantryName, pantryIdentity, searchPantryCatalog, cookingIngredients, activeCookingIngredients, cookingCompatibility, pantryCatalog } from '@/lib/pantry/model';
import { PantryEntry, PantryEntryInput, PantryMutation, PantryMutationResult, PantryOwner, PantrySaveIntent } from '@/types/pantry';

interface Props {
  owner?: PantryOwner | null;
  speechConfigured?: boolean;
  onAiSignIn?: () => void;
  barcodeEnabled?: boolean;
  cameraEnabled?: boolean;
  entries: readonly PantryEntry[];
  acceptedCatalogIds: readonly string[];
  status: 'Loading' | 'Saved' | 'Pending sync' | 'Couldn’t sync — Retry';
  error: string | null;
  guest: boolean;
  hasLegacyEdits: boolean;
  importDuplicates: readonly string[];
  guestEntries: readonly PantryEntry[];
  conflicts: readonly { mutation: PantryMutation; conflict?: Extract<PantryMutationResult, { status: 'conflict' }> }[];
  onSave: (input: PantryEntryInput, id?: string, intent?: PantrySaveIntent) => Promise<void>;
  onDelete: (entry: PantryEntry) => Promise<void>;
  onRetry: () => Promise<void>;
  onResolve: (mutationId: string, choice: 'mine' | 'remote') => Promise<void>;
  onImportGuest: () => Promise<void>;
  onReviewLegacy: () => Promise<readonly PantryEntry[]>;
  onImportLegacy: () => Promise<void>;
  /** An entry's name as it is shown in the list (the adapter makes it a link to the ingredient detail). */
  renderEntryName?: (entry: PantryEntry, name: ReactNode) => ReactNode;
  selectedId?: string | null;
}
// v2.0 M4-4a (wireframes Pantry and Pantry Empty): the Pantry list. Search is the first control; the optional Scan and Voice entries
// stay where they were (their screens are M4-4c); a banner says nothing here is required; chips filter the list (All, Have, Out);
// each ingredient has a Yes/No toggle (a radio group) and its name links to the ingredient detail (M4-4b: editing and removing moved
// there; a new custom ingredient is still added here, with the shared PantryEntryForm). The
// first visit is the empty state with the staple shortcuts. Every handler, the sync status, the conflict and import panels and
// their wording are unchanged: only the markup moved onto the design tokens. The list now opens on All, as the wireframe does
// (it used to hide ingredients marked No behind a checkbox).
export default function VirtualPantry(props: Props) {
  const [speechOpen, setSpeechOpen] = useState(false);
  const speechTrigger = useRef<HTMLButtonElement>(null);
  const [barcodeOpen, setBarcodeOpen] = useState(false);
  const barcodeTrigger = useRef<HTMLButtonElement>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'HAVE' | 'OUT'>('ALL');
  const [editing, setEditing] = useState<PantryEntryInput | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState(false);
  const [legacyPreview, setLegacyPreview] = useState<readonly PantryEntry[] | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); heading.current?.scrollIntoView?.({ block: 'start' }); }, []);
  const accepts = (id: string) => props.acceptedCatalogIds.includes(id) || props.entries.some((entry) => entry.ingredientId === id);
  const results = searchPantryCatalog(query).slice(0, 12);
  const customResults = props.entries.filter((entry) => !entry.deletedAtIso && !entry.ingredientId && normalizePantryName(entry.displayName).includes(normalizePantryName(query)));
  const shown = props.entries.filter((entry) => !entry.deletedAtIso && (filter === 'ALL' || (filter === 'HAVE' ? entry.available : !entry.available)) && (!query.trim() || normalizePantryName(entry.displayName).includes(normalizePantryName(query))));
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
  return <section aria-labelledby="virtual-pantry-title" className="space-y-3">
    <h2 ref={heading} tabIndex={-1} id="virtual-pantry-title" className="sr-only">Virtual Pantry</h2>

    <TextField label="Search ingredients or enter a custom name" type="search" value={query} maxLength={120} onChange={(event) => setQuery(event.target.value)} placeholder="Try lentils, garlic, or rice" />

    <div className="flex flex-wrap items-start gap-2">
      <div>
        <Button ref={speechTrigger} variant="secondary" disabled={props.status==='Loading'} onClick={()=>{
          if(!props.owner?.startsWith('account:')){props.onAiSignIn?.();return;}setSpeechOpen(true);
        }}>{props.owner?.startsWith('account:')?'Speak pantry ingredients (experimental)':'Sign in for experimental speech entry'}</Button>
      </div>
      {props.barcodeEnabled && props.owner ? <div>
        <Button ref={barcodeTrigger} variant="secondary" onClick={() => setBarcodeOpen(true)} disabled={props.status === 'Loading'}>Enter barcode</Button>
      </div> : null}
    </div>
    {speechOpen && props.owner?.startsWith('account:') ? <SpeechPantryEntry key={props.owner} owner={props.owner}
      configured={props.speechConfigured===true} entries={props.entries} acceptedCatalogIds={props.acceptedCatalogIds} onSave={props.onSave}
      onClose={()=>{setSpeechOpen(false);speechTrigger.current?.focus();}}/>:null}
    {props.barcodeEnabled && props.owner && barcodeOpen ? <BarcodeEntry cameraEnabled={props.cameraEnabled} key={props.owner} entries={props.entries} acceptedCatalogIds={props.acceptedCatalogIds} onSave={props.onSave}
      onClose={() => { setBarcodeOpen(false); barcodeTrigger.current?.focus(); }} /> : null}

    <Banner>Optional. Tell PantryBot what you already have and Shop and Plan skip it. Nothing here is required.</Banner>

    <div className="flex flex-wrap items-center gap-3 text-sm" role="status" aria-live="polite">
      <strong className="text-ink">{props.hasLegacyEdits && props.status === 'Saved' ? 'Older edits need review' : props.status}</strong>
      {props.guest && <span className="text-muted">Saved on this device. Sign in for cross-device recovery.</span>}
      {props.status === 'Couldn’t sync — Retry' && <Button variant="secondary" onClick={() => void perform(props.onRetry)}>Retry sync</Button>}
    </div>
    {props.error && <Banner tone="error">{props.error} Pending edits remain on this device.</Banner>}
    {formError && <Banner tone="error">{formError}</Banner>}
    {notice && <Banner>{notice}</Banner>}
    {props.importDuplicates.length > 0 && <Banner>Account entries kept for: {props.importDuplicates.join(', ')}. You can edit or re-add them in this pantry.</Banner>}
    {(props.guest || props.hasLegacyEdits) && <Card className="space-y-2 text-sm">
      <Button variant="secondary" onClick={() => void perform(async () => setLegacyPreview(await props.onReviewLegacy()))}>{props.guest ? 'Review older local inventory' : 'Review pending edits from an older app version'}</Button>
      {legacyPreview && <div className="space-y-2 rounded-control bg-chip p-3"><p>{props.guest ? 'Confirm these are your guest records before importing. Existing entries keep their details. Nothing will be uploaded to an account.' : 'These older edits have no entry revisions. Confirm to queue them for review; existing entries will require a conflict choice before they change. Original purchase details are preserved in a private recovery copy.'}</p>
        <ul className="max-h-40 list-inside list-disc overflow-auto">{legacyPreview.map((entry) => <li key={entry.id}>{entry.displayName}: {entry.deletedAtIso ? 'Delete' : entry.available ? 'Yes' : 'No'}</li>)}</ul>
        {legacyPreview.length === 0 && <p>No older local inventory was found.</p>}
        <div className="flex flex-wrap gap-2"><Button variant="secondary" disabled={busy} onClick={() => void perform(async () => { await props.onImportLegacy(); setLegacyPreview(null); setNotice(props.guest ? 'Older guest inventory imported on this device.' : 'Older edits queued. Review any conflicts below before retrying.'); })}>{props.guest ? 'Confirm local import' : 'Confirm older edits'}</Button><Button variant="quiet" onClick={() => setLegacyPreview(null)}>Cancel</Button></div>
      </div>}
    </Card>}

    {props.conflicts.filter((item) => item.conflict).map(({ mutation, conflict }) => <Banner key={mutation.mutationId} tone="warning" title={`Resolve a pantry change: ${mutation.operation === 'put' ? mutation.entry.displayName : conflict?.current?.displayName}`}>
      <p>{conflict?.reason === 'identity' ? 'This ingredient already has an entry. Its details have been preserved.' : conflict?.current?.deletedAtIso ? 'This entry was deleted elsewhere. Choose whether to keep that deletion or restore your edit.' : 'This entry changed elsewhere. Choose the current value or your edit.'}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => void perform(() => props.onResolve(mutation.mutationId, 'remote'))}>Use current value</Button>
        {conflict?.reason === 'revision' && <Button variant="secondary" onClick={() => void perform(() => props.onResolve(mutation.mutationId, 'mine'))}>Keep my edit</Button>}
      </div>
    </Banner>)}

    {!props.guest && guestItems.length > 0 && <Card className="space-y-2 text-sm">
      {!importPreview ? <Button variant="secondary" onClick={() => setImportPreview(true)}>Review guest pantry import ({guestItems.length})</Button> : <>
        <h3 className="font-semibold text-ink">Import this device’s guest pantry?</h3>
        <p>Existing account entries and their details take precedence. {duplicates.length} duplicate{duplicates.length === 1 ? '' : 's'} will be kept as recorded in this account.</p>
        <ul className="max-h-40 list-inside list-disc overflow-auto">{guestItems.map((entry) => <li key={entry.id}>{entry.displayName}: {entry.available ? 'Yes' : 'No'}{duplicates.includes(entry) ? ' — account entry kept' : ''}</li>)}</ul>
        <div className="flex flex-wrap gap-2"><Button variant="secondary" disabled={busy} onClick={() => void perform(async () => { await props.onImportGuest(); setImportPreview(false); setNotice('Import queued. Existing account entries are preserved, including any added while you reviewed.'); })}>Confirm import</Button><Button variant="quiet" onClick={() => setImportPreview(false)}>Cancel</Button></div>
      </>}
    </Card>}

    {query.trim() && <div className="space-y-2">
      {results.length === 0 && customResults.length === 0 && <p className="text-sm text-muted">No matching ingredient. Add your own name below.</p>}
      <ul className="grid gap-2 sm:grid-cols-2">{results.map((ingredient) => <li key={ingredient.id}>
        <Button variant="secondary" disabled={busy || !accepts(ingredient.id)} className="w-full justify-start text-left" onClick={() => void perform(() => add({ ingredientId: ingredient.id, displayName: ingredient.name, available: true }))}>Add {ingredient.name}</Button>
        {!accepts(ingredient.id) && <p className="text-xs text-muted">Available after your account’s catalog update. Reconnect to retry.</p>}
        {cookingCatalogVariants(activeCookingIngredients, ingredient.id).length > 0 && <details className="mt-1 text-sm"><summary className="flex min-h-touch cursor-pointer items-center text-accent">Choose a variety (optional)</summary>
          <ul className="mt-1 space-y-1">{cookingCatalogVariants(activeCookingIngredients, ingredient.id).map((variant) => <li key={variant.id}><Button variant="secondary" disabled={busy || !accepts(variant.id)} onClick={() => void perform(() => add({ ingredientId: variant.id, displayName: variant.name, available: true }))}>Add {variant.name}</Button></li>)}</ul>
        </details>}
      </li>)}
        {customResults.map((entry) => <li key={entry.id}><Button variant="secondary" disabled={busy} className="w-full justify-start text-left" onClick={() => void perform(() => add(entry))}>Add {entry.displayName} (custom)</Button></li>)}</ul>
      <Button variant="secondary" onClick={() => { setEditing({ displayName: query.trim(), available: true }); setFormError(null); }}>Add custom ingredient: {query.trim()}</Button>
    </div>}

    {!props.entries.some((entry) => !entry.deletedAtIso) && !query.trim() && <EmptyState
      title="Your Pantry Is Empty"
      description="That's fine. Pantry is optional. Add what you have and Shop and Plan will skip it."
      action={<div className="space-y-2">
        <h3 className="text-sm font-bold uppercase tracking-wide text-muted">Common Staples</h3>
        <div className="flex flex-wrap justify-center gap-2">{['olive-oil', 'salt', 'black-beans-canned', 'basmati-rice-dry'].map((id) => {
          const ingredient = cookingIngredients.find((item) => item.id === id)!;
          return <Chip disabled={busy} key={id} onClick={() => void perform(() => add({ ingredientId: id, displayName: ingredient.name, available: true }))}>Add {ingredient.name}</Chip>;
        })}</div>
        <p className="text-sm text-muted">These are shortcuts. Nothing is preselected or required.</p>
      </div>}
    />}

    {props.entries.some((entry) => !entry.deletedAtIso) && <div role="group" aria-label="Show" className="flex gap-2">
      {([['ALL', 'All'], ['HAVE', 'Have'], ['OUT', 'Out']] as const).map(([value, label]) => <Chip key={value} selected={filter === value} onClick={() => setFilter(value)}>{label}</Chip>)}
    </div>}
    {shown.length > 0 && <Card padding="none"><ul className="divide-y divide-border">{shown.map((entry) => <li key={entry.id} aria-current={entry.id === props.selectedId ? 'true' : undefined} className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 ${entry.id === props.selectedId ? 'wide:bg-chip' : ''}`}>
      <div className="min-w-0"><p className="break-words font-semibold text-ink">{props.renderEntryName ? props.renderEntryName(entry, entry.displayName) : entry.displayName}</p>
        <p className="text-xs text-muted">{entry.location ? `${entry.location.toLowerCase()} · ` : ''}{entry.quantity !== undefined ? `${entry.quantity} ${entry.unit ?? ''} · ` : ''}{entry.useByDate ? `Use by ${entry.useByDate}` : ''}</p>
        {entry.ingredientId && cookingCompatibility.some((edge) => edge.to === entry.ingredientId && !entry.available && props.entries.some((other) => other.ingredientId === edge.from && other.available && !other.deletedAtIso)) && <p className="text-xs text-warning">Marked No: available varieties do not cover recipes requiring {entry.displayName}. Change this entry explicitly if you have it.</p>}
        {entry.ingredientId && !pantryCatalog.has(entry.ingredientId) && <p className="text-xs text-muted">Saved catalog ingredient. Your details are preserved; recipe matching needs a newer catalog.</p>}
        {!entry.ingredientId && <p className="text-xs text-muted">Custom ingredient. Choose a catalog match in its details to use it in recipe matching.</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl label={`${entry.displayName} availability`} value={String(entry.available) as 'true' | 'false'}
          options={[{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]}
          onChange={(value) => { if (!busy) void perform(() => props.onSave({ ...entry, available: value === 'true' }, entry.id)); }} />
      </div>
    </li>)}</ul></Card>}
    {shown.length === 0 && props.entries.length > 0 && <p className="py-3 text-sm text-muted">No ingredients match this view. Clear search or choose All.</p>}

    {editing && <Card as="section" aria-label="Add custom ingredient">
      <h3 className="mb-3 font-semibold text-ink">Add custom ingredient</h3>
      <PantryEntryForm entry={editing} entries={props.entries} acceptedCatalogIds={props.acceptedCatalogIds} onSave={props.onSave}
        onSaved={() => setEditing(null)} onCancel={() => setEditing(null)} showAvailable saveLabel="Save ingredient" autoFocus />
    </Card>}
  </section>;
}
