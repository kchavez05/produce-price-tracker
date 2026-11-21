'use client';

import { useState } from 'react';
import { Button, Select, Sheet, TextField } from '@/components/ui';
import { ALL_STORE_CHAINS } from '@/data/store-registry';
import type { explorerCatalog } from '@/lib/explorer/catalog';

// v2.0 M4-7b (wireframes Data Explorer and Data Explorer filters): below 760 px the inline filter bar gives way to a summary row. The
// ingredient shows with a Change button (a sheet with the search and the list), a line says the ZIP, dates and store in force, and a
// Filters button opens a sheet with the ZIP, From, Through and Store. The sheet stages its values and applies them together (Apply),
// Reset puts the defaults back in the sheet, and closing it applies nothing. The filters, the URL parameters and the data requests are
// the inline bar's: Apply is one `navigate` with the same keys.
type Catalog = ReturnType<typeof explorerCatalog>;

export interface FilterValues { zip: string; start: string; end: string; stores: string }

const DEFAULT_ZIP = '80542';
const DEFAULT_WINDOW_DAYS = 41;

/** The first day of the default window: 41 days before `today`, as the page computes it when no start is given. */
export function defaultStart(today: string): string {
  const date = new Date(`${today}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - DEFAULT_WINDOW_DAYS);
  return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : today;
}

export function storeSummary(stores: string): string {
  if (!stores) return 'All observed stores';
  if (stores.includes(',')) return 'Selected stores';
  return stores.replaceAll('_', ' ');
}

function shortDate(iso: string, today: string): string {
  const date = new Date(`${iso}T12:00:00Z`);
  if (!Number.isFinite(date.getTime())) return iso;
  const sameYear = iso.slice(0, 4) === today.slice(0, 4);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }), timeZone: 'UTC' });
}

export function filterSummary(values: FilterValues, today: string): string {
  return `ZIP ${values.zip} · ${shortDate(values.start, today)}–${shortDate(values.end, today)} · ${storeSummary(values.stores)}`;
}

function validate(values: FilterValues): { zip?: string; end?: string; start?: string } {
  const errors: { zip?: string; end?: string; start?: string } = {};
  if (!/^\d{5}$/.test(values.zip)) errors.zip = 'Enter a five digit ZIP code.';
  if (!values.start) errors.start = 'Choose a start date.';
  if (!values.end) errors.end = 'Choose an end date.';
  else if (values.start && values.end < values.start) errors.end = 'Through must be on or after From.';
  return errors;
}

function FiltersForm({ initial, today, onApply, onDone }: { initial: FilterValues; today: string; onApply: (values: FilterValues) => void; onDone: () => void }) {
  const [draft, setDraft] = useState(initial);
  const [tried, setTried] = useState(false);
  const errors = tried ? validate(draft) : {};
  const set = (patch: Partial<FilterValues>) => setDraft((current) => ({ ...current, ...patch }));
  function apply() {
    if (Object.keys(validate(draft)).length > 0) { setTried(true); return; }
    onApply(draft);
    onDone();
  }
  return (
    <div className="space-y-4">
      <TextField
        label="Market ZIP"
        inputMode="numeric"
        maxLength={5}
        value={draft.zip}
        error={errors.zip}
        onChange={(event) => set({ zip: event.target.value })}
      />
      <div className="grid grid-cols-2 gap-3">
        <TextField label="From" type="date" value={draft.start} error={errors.start} onChange={(event) => set({ start: event.target.value })} />
        <TextField label="Through" type="date" value={draft.end} max={today} error={errors.end} onChange={(event) => set({ end: event.target.value })} />
      </div>
      <Select label="Store" value={draft.stores} onChange={(event) => set({ stores: event.target.value })}>
        <option value="">All observed stores</option>
        {ALL_STORE_CHAINS.map((chain) => <option key={chain} value={chain}>{chain.replaceAll('_', ' ')}</option>)}
        {initial.stores.includes(',') ? <option value={initial.stores}>Selected stores</option> : null}
      </Select>
      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={() => { setDraft({ zip: DEFAULT_ZIP, start: defaultStart(today), end: today, stores: '' }); setTried(false); }}>Reset</Button>
        <Button variant="primary" className="flex-1" onClick={apply}>Apply</Button>
      </div>
    </div>
  );
}

function IngredientList({ catalog, current, onPick }: { catalog: Catalog; current: string; onPick: (id: string) => void }) {
  const [query, setQuery] = useState('');
  const matches = catalog.filter((item) => item.id === current || `${item.name} ${item.keywords.join(' ')}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="space-y-3">
      <TextField label="Find an ingredient or variety" type="search" value={query} onChange={(event) => setQuery(event.target.value)} />
      <ul aria-label="Ingredients" className="divide-y divide-border">
        {matches.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              aria-current={item.id === current ? 'true' : undefined}
              onClick={() => onPick(item.id)}
              className="flex min-h-touch w-full items-center justify-between gap-3 py-2 text-left text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              <span>{item.name}</span>
              {item.id === current ? <span className="text-sm font-semibold text-accent">Selected</span> : null}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface CompactFiltersProps {
  catalog: Catalog;
  ingredient: string;
  ingredientName: string;
  values: FilterValues;
  today: string;
  onApply: (values: FilterValues) => void;
  onIngredient: (id: string) => void;
}

export default function CompactFilters({ catalog, ingredient, ingredientName, values, today, onApply, onIngredient }: CompactFiltersProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [ingredientOpen, setIngredientOpen] = useState(false);
  return (
    <section aria-label="Filters" className="ex-compact">
      <div className="ex-compact-row">
        <div className="min-w-0">
          <span className="ex-eyebrow">Ingredient</span>
          <p className="ex-compact-name">{ingredientName}</p>
        </div>
        <button type="button" className="ex-button" onClick={() => setIngredientOpen(true)}>Change</button>
      </div>
      <div className="ex-compact-row">
        <p className="ex-note">{filterSummary(values, today)}</p>
        <button type="button" className="ex-button" onClick={() => setFiltersOpen(true)}>Filters</button>
      </div>
      <Sheet open={ingredientOpen} onClose={() => setIngredientOpen(false)} title="Ingredient" closeLabel="Close ingredient list">
        <IngredientList catalog={catalog} current={ingredient} onPick={(id) => { setIngredientOpen(false); onIngredient(id); }} />
      </Sheet>
      <Sheet open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filters" closeLabel="Close filters">
        <FiltersForm initial={values} today={today} onApply={onApply} onDone={() => setFiltersOpen(false)} />
      </Sheet>
    </section>
  );
}
