'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Banner, Button, EmptyState, SegmentedControl } from '@/components/ui';
import PantryEntryForm from '@/modules/pantry/PantryEntryForm';
import type { PantryEntry, PantryEntryInput } from '@/types/pantry';

// v2.0 M4-4b (wireframe Pantry Detail): one ingredient in full. "Do I have this?" is a Yes/No answer that saves at once; below it are
// the optional details (the shared ingredient form), what this week's plan uses it for, the current deals for it, and Remove from
// Pantry. The plan and deals are read-only and come from data the app already has (the adapter derives them); the form, the save
// and the delete are the Pantry's own, unchanged. Presentational: the adapter (PantryDrawer) wires it to the contexts.
export interface PantryDeal { id: string; name: string; offer: string }

interface Props {
  entry: PantryEntry | null;
  loading: boolean;
  entries: readonly PantryEntry[];
  acceptedCatalogIds: readonly string[];
  usedIn: readonly string[];
  deals: readonly PantryDeal[];
  onSave: (input: PantryEntryInput, id?: string) => Promise<void>;
  onDelete: (entry: PantryEntry) => Promise<void>;
  /** After the entry is removed (the adapter goes back to the list). */
  onRemoved: () => void;
  /** The Back link (shown below 1024 px). */
  back: ReactNode;
  /** The link to a deal's own screen. */
  dealLink: (deal: PantryDeal, children: ReactNode) => ReactNode;
}

export default function PantryDetail({ entry, loading, entries, acceptedCatalogIds, usedIn, deals, onSave, onDelete, onRemoved, back, dealLink }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const entryId = entry?.id;
  useEffect(() => { heading.current?.focus(); }, [entryId]);

  async function perform(action: () => Promise<void>, done?: string) {
    setError(null); setNotice(null); setBusy(true);
    try { await action(); if (done) setNotice(done); } catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not save. Please retry.'); }
    finally { setBusy(false); }
  }

  if (!entry) {
    return (
      <div>
        {back}
        {loading
          ? <p role="status" className="py-6 text-sm text-muted">Loading your Pantry…</p>
          : <EmptyState title="This ingredient is not in your Pantry" description="It may have been removed, or the link is old. Go back to your Pantry to see what is there." />}
      </div>
    );
  }
  return (
    <article aria-label={`${entry.displayName}, Ingredient Detail`} className="space-y-4">
      {back}
      <h2 ref={heading} tabIndex={-1} className="text-xl font-bold text-ink">{entry.displayName}</h2>
      {error && <Banner tone="error">{error}</Banner>}
      {notice && <Banner>{notice}</Banner>}

      <div className="flex items-center justify-between gap-3">
        <span className="text-base text-ink">Do I have this?</span>
        <SegmentedControl label={`Do I have ${entry.displayName}?`} value={String(entry.available) as 'true' | 'false'}
          options={[{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]}
          onChange={(value) => { if (!busy) void perform(() => onSave({ ...entry, available: value === 'true' }, entry.id)); }} />
      </div>

      <section aria-labelledby="pantry-detail-details" className="space-y-2">
        <h3 id="pantry-detail-details" className="text-sm font-bold uppercase tracking-wide text-muted">Optional details</h3>
        <PantryEntryForm entry={entry} entries={entries} acceptedCatalogIds={acceptedCatalogIds} onSave={onSave}
          onSaved={() => setNotice('Details saved.')} showAvailable={false} saveLabel="Save details" />
      </section>

      <section aria-labelledby="pantry-detail-plan" className="space-y-2">
        <h3 id="pantry-detail-plan" className="text-sm font-bold uppercase tracking-wide text-muted">Used in this week&apos;s plan</h3>
        {usedIn.length > 0
          ? <p className="rounded-card bg-surface p-4 text-sm text-ink shadow-card">{usedIn.join(', ')}</p>
          : <p className="text-sm text-muted">Not used in this week&apos;s plan.</p>}
      </section>

      <section aria-labelledby="pantry-detail-deals" className="space-y-2">
        <h3 id="pantry-detail-deals" className="text-sm font-bold uppercase tracking-wide text-muted">Current deals</h3>
        {deals.length > 0
          ? <ul className="divide-y divide-border rounded-card bg-surface shadow-card">{deals.map((deal) => (
            <li key={deal.id} className="flex items-center justify-between gap-3 px-4 py-1 text-sm">
              {dealLink(deal, deal.name)}<span className="text-muted">{deal.offer}</span>
            </li>))}</ul>
          : <p className="rounded-card bg-surface p-4 text-sm text-muted shadow-card">Not on sale at your stores this week.</p>}
      </section>

      <Button variant="destructive" disabled={busy} onClick={() => void perform(async () => { await onDelete(entry); onRemoved(); })}>Remove from Pantry</Button>
    </article>
  );
}
