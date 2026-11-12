'use client';

import BarcodeCamera from '@/components/BarcodeCamera';
import { FormEvent, useEffect, useId, useRef, useState } from 'react';
import { validateBarcode } from '@/lib/barcodes/validation';
import { BarcodeAddition, prepareBarcodeAddition } from '@/lib/barcodes/confirmation';
import { activeCookingIngredients, pantryCatalog, searchPantryCatalog } from '@/lib/pantry/model';
import type { BarcodeFormat, BarcodeLookupResult, BarcodeProduct, BarcodeSuggestion } from '@/types/barcode';
import type { PantryEntry, PantryEntryInput, PantrySaveIntent } from '@/types/pantry';

interface Props {
  cameraEnabled?: boolean;
  entries: readonly PantryEntry[];
  acceptedCatalogIds: readonly string[];
  onSave: (input: PantryEntryInput, id?: string, intent?: PantrySaveIntent) => Promise<void>;
  onClose: () => void;
}
const button = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-emerald-50 disabled:opacity-50';
const field = 'mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2 text-sm';
const failures = new Set(['INVALID', 'UNSUPPORTED', 'NOT_FOUND', 'DISCONTINUED', 'SOURCE_DATE_HOLD', 'DISABLED', 'SERVICE_UNAVAILABLE', 'THROTTLED', 'OFFLINE']);
function isProduct(value: unknown): value is BarcodeProduct {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return item.source === 'USDA_FDC_BRANDED' && typeof item.fdcId === 'string' && /^[1-9][0-9]*$/.test(item.fdcId) &&
    ['description', 'originalBarcode', 'marketCountry', 'publicationDate', 'snapshotDate'].every((key) => typeof item[key] === 'string') &&
    ['brandName', 'brandOwner', 'packageLabel', 'modifiedDate', 'availableDate'].every((key) => item[key] === null || typeof item[key] === 'string');
}
function parseResponse(value: unknown): BarcodeLookupResult | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Record<string, unknown>;
  if (typeof item.status !== 'string') return null;
  if (failures.has(item.status) && typeof item.message === 'string') return value as BarcodeLookupResult;
  if (!item.barcode || typeof item.barcode !== 'object') return null;
  if (item.status === 'FOUND' && isProduct(item.product) && (item.suggestion === null ||
    (typeof item.suggestion === 'object' && item.suggestion && 'ingredientId' in item.suggestion && typeof item.suggestion.ingredientId === 'string' && 'ruleId' in item.suggestion && typeof item.suggestion.ruleId === 'string'))) return value as BarcodeLookupResult;
  if (item.status === 'AMBIGUOUS_PRODUCT' && Array.isArray(item.products) && item.products.length <= 5 && item.products.every(isProduct) && Number.isSafeInteger(item.matchCount)) return value as BarcodeLookupResult;
  return null;
}

export default function BarcodeEntry({ cameraEnabled = false, entries, acceptedCatalogIds, onSave, onClose }: Props) {
  const id = useId();
  const codeField = useRef<HTMLInputElement>(null);
  const searchField = useRef<HTMLInputElement>(null);
  const generation = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const saving = useRef(false);
  const operation = useRef<BarcodeAddition | null>(null);
  const [code, setCode] = useState('');
  const [format, setFormat] = useState<BarcodeFormat>('MANUAL');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BarcodeLookupResult | null>(null);
  const [product, setProduct] = useState<BarcodeProduct | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [proposed, setProposed] = useState(false);
  const [retryUntil, setRetryUntil] = useState(0);
  const [selection, setSelection] = useState<BarcodeAddition | null>(null);
  const [query, setQuery] = useState('');
  const [customName, setCustomName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const accepts = (ingredientId: string) => activeCookingIngredients.some((item) => item.id === ingredientId) &&
    (acceptedCatalogIds.includes(ingredientId) || entries.some((entry) => entry.ingredientId === ingredientId));
  const matches = query.trim() ? searchPantryCatalog(query).filter((item) => accepts(item.id)).slice(0, 12) : [];
  useEffect(() => {
    mounted.current = true; codeField.current?.focus();
    return () => { mounted.current = false; controller.current?.abort(); };
  }, []);
  useEffect(() => { if (reviewing && !confirmed) searchField.current?.focus(); }, [reviewing, confirmed]);
  useEffect(() => {
    if (!retryUntil) return;
    const timer = window.setTimeout(() => setRetryUntil(0), Math.max(0, retryUntil - Date.now()));
    return () => window.clearTimeout(timer);
  }, [retryUntil]);
  function invalidate() { setCameraOpen(false); generation.current++; controller.current?.abort(); controller.current = null; setLoading(false); }
  function reset() { invalidate(); operation.current = null; setLocked(false); setConfirmed(false); setResult(null); setProduct(null); setSelection(null); setReviewing(false); setQuery(''); setCustomName(''); setError(null); }
  function choose(input: PantryEntryInput, suggestion = false) {
    if (locked) return;
    try { setSelection(prepareBarcodeAddition(entries, input)); setProposed(suggestion); setError(null); } catch (failure) { setError(failure instanceof Error ? failure.message : 'Choose an ingredient.'); }
  }
  function beginReview(next: BarcodeProduct | null, suggestion: BarcodeSuggestion | null = null) {
    setProduct(next); setReviewing(true); setSelection(null); setQuery(''); setCustomName(next?.description ?? '');
    if (suggestion && accepts(suggestion.ingredientId)) {
      const ingredient = pantryCatalog.get(suggestion.ingredientId);
      if (ingredient) choose({ ingredientId: ingredient.id, displayName: ingredient.name, available: true }, true);
    }
  }
  async function lookup(event: FormEvent) {
    event.preventDefault(); if (locked || retryUntil > Date.now()) return;
    setCameraOpen(false); reset();
    const validation = validateBarcode(code, format);
    if (!validation.ok) { setResult({ status: validation.status, message: validation.message }); return; }
    if (typeof navigator !== 'undefined' && !navigator.onLine) { setResult({ status: 'OFFLINE', message: 'Product lookup needs a connection. Choose an ingredient manually.' }); return; }
    const active = ++generation.current;
    const request = new AbortController(); controller.current = request; setLoading(true);
    const timeout = window.setTimeout(() => request.abort(), 2500);
    try {
      const response = await fetch('/api/pantry/barcode-lookup', { method: 'POST', cache: 'no-store', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' }, signal: request.signal, body: JSON.stringify({ barcode: code, format }) });
      if (response.status === 429 && mounted.current && generation.current === active) {
        const seconds = Number(response.headers.get('Retry-After') || 60);
        setRetryUntil(Date.now() + (Number.isFinite(seconds) ? Math.min(3600, Math.max(1, seconds)) : 60) * 1000);
        setResult({ status: 'THROTTLED', message: 'Too many lookups. Wait briefly or choose an ingredient manually.' });
        void response.body?.cancel().catch(() => {});
        return;
      }
      const raw = await response.text();
      const next = raw.length <= 16384 ? parseResponse(JSON.parse(raw)) : null;
      if (!next || (!response.ok && (next.status === 'FOUND' || next.status === 'AMBIGUOUS_PRODUCT')) ||
        ((next.status === 'FOUND' || next.status === 'AMBIGUOUS_PRODUCT') && (next.barcode.key !== validation.barcode.key || next.barcode.original !== code))) throw new Error('Invalid lookup response');
      if (!mounted.current || generation.current !== active) return;
      setResult(next);
      if (next.status === 'FOUND') beginReview(next.product, next.suggestion);
    } catch {
      if (mounted.current && generation.current === active) setResult({ status: navigator.onLine ? 'SERVICE_UNAVAILABLE' : 'OFFLINE', message: 'Lookup could not connect or complete. Choose an ingredient manually or retry.' });
    } finally {
      window.clearTimeout(timeout);
      if (mounted.current && generation.current === active) { setLoading(false); controller.current = null; }
    }
  }
  async function confirm() {
    if (saving.current || !selection) return;
    const addition = operation.current ?? selection;
    operation.current = addition; saving.current = true; setLocked(true); setBusy(true); setError(null);
    try {
      await onSave(addition.input, addition.entryId, addition.intent);
      if (mounted.current) setConfirmed(true);
    } catch (failure) { if (mounted.current) setError(failure instanceof Error ? failure.message : 'Could not save. Retry this confirmation or check pantry sync.'); }
    finally { saving.current = false; if (mounted.current) setBusy(false); }
  }
  const changed = selection && entries.some((entry) => entry.id === selection.entryId && entry.revision !== selection.intent.expectedRevision);
  return <section aria-labelledby={`${id}-title`} className="mt-4 rounded-xl border border-sky-200 bg-sky-50/50 p-4" onKeyDown={(event) => { if (event.key === 'Escape') { invalidate(); onClose(); } }}>
    <div className="flex items-center justify-between gap-3"><h3 id={`${id}-title`} className="font-bold">Enter barcode</h3><button type="button" className={button} onClick={() => { invalidate(); onClose(); }}>{locked ? 'Close review' : 'Cancel'}</button></div>
    <p className="mt-2 text-sm">Look up a packaged product, then review and confirm a cooking ingredient. Nothing is added by lookup.</p>
    {cameraEnabled && !locked ? <button type="button" className={`${button} mt-3`} onClick={() => { reset(); setCameraOpen(true); }}>Scan barcode</button> : null}
    {cameraEnabled && cameraOpen && !locked ? <BarcodeCamera onTyped={() => { setCameraOpen(false); codeField.current?.focus(); }} onCapture={(digits, capturedFormat) => {
      reset(); setCode(digits); setFormat(capturedFormat); setCameraOpen(false); codeField.current?.focus();
    }} /> : null}
    <form className="mt-3" onSubmit={(event) => void lookup(event)} noValidate>
      <label htmlFor={`${id}-code`} className="text-sm font-semibold">Printed barcode digits</label>
      <input ref={codeField} id={`${id}-code`} className={field} inputMode="numeric" autoComplete="off" maxLength={64} value={code} disabled={locked}
        onChange={(event) => { setCameraOpen(false); reset(); setFormat('MANUAL'); setCode(event.target.value); }} />
      <button type="submit" className={`${button} mt-2`} disabled={loading || locked || retryUntil > Date.now()}>Look up product</button>
    </form>
    <div role="status" aria-live="polite" className="mt-3 text-sm">{loading ? 'Looking up the product…' : confirmed ? 'Ingredient marked Yes. The pantry status above shows saved or pending sync.' : result?.status === 'FOUND' ? 'Product found. Review the product and cooking ingredient before confirming.' : null}</div>
    {result && result.status !== 'FOUND' && result.status !== 'AMBIGUOUS_PRODUCT' ? <p className="mt-2 text-sm" role="status">{result.message}</p> : null}
    {result?.status === 'AMBIGUOUS_PRODUCT' && !reviewing ? <div className="mt-3 text-sm"><p>Multiple source records share the latest date. Choose a product record to review, or choose an ingredient manually.</p>
      <ul className="mt-2 space-y-2">{result.products.map((item) => <li key={item.fdcId}><button type="button" className={button} onClick={() => beginReview(item)}>{item.description} — {item.brandName || item.brandOwner || 'Brand not supplied'} ({item.packageLabel || 'Package not supplied'})</button></li>)}</ul></div> : null}
    {result && !loading && !reviewing && !locked ? <button type="button" className={`${button} mt-3`} onClick={() => beginReview(null)}>Choose ingredient manually</button> : null}
    {reviewing && !confirmed ? <div className="mt-4 space-y-3">
      {product ? <div className="break-words rounded-lg bg-white p-3 text-sm"><h4 className="font-semibold">Product: {product.description}</h4>
        <p>Brand: {product.brandName || product.brandOwner || 'Not supplied'}</p><p>Package: {product.packageLabel || 'Not supplied'}</p><p>Market: {product.marketCountry}</p>
        <p>USDA FoodData Central — snapshot {product.snapshotDate}; published {product.publicationDate}{product.modifiedDate ? `; modified ${product.modifiedDate}` : ''}.</p>
        <p>Last-known source information; package size does not set your inventory amount.</p>
        <a className="underline" href={`https://fdc.nal.usda.gov/food-details/${product.fdcId}/branded`} target="_blank" rel="noopener noreferrer">View USDA source record</a></div> : <p className="text-sm">No product identity is assumed. Choose a cooking ingredient or a private custom name.</p>}
      <div><label htmlFor={`${id}-search`} className="text-sm font-semibold">Find a cooking ingredient</label>
        <input ref={searchField} id={`${id}-search`} type="search" className={field} disabled={locked} value={query} onChange={(event) => setQuery(event.target.value)} />
        <ul className="mt-2 flex flex-wrap gap-2">{matches.map((item) => <li key={item.id}><button type="button" className={button} disabled={locked} onClick={() => choose({ ingredientId: item.id, displayName: item.name, available: true })}>Choose {item.name}</button></li>)}</ul></div>
      <div><label htmlFor={`${id}-custom`} className="text-sm font-semibold">Private custom ingredient name</label>
        <input id={`${id}-custom`} className={field} value={customName} disabled={locked} onChange={(event) => setCustomName(event.target.value)} />
        <button type="button" className={`${button} mt-2`} disabled={locked || !customName.trim()} onClick={() => choose({ displayName: customName, available: true })}>Use private custom ingredient</button>
        <p className="mt-1 text-xs">A custom entry does not establish a recipe match.</p></div>
      {selection ? <div className="rounded-lg border border-emerald-200 bg-white p-3 text-sm"><h4 className="font-bold">{proposed ? 'Suggested' : 'Selected'} cooking ingredient: {selection.input.displayName}</h4>
        <p>Current entry: {selection.priorAvailability}. {selection.priorAvailability === 'No' ? 'Only confirmation changes No to Yes.' : selection.priorAvailability === 'Deleted' ? 'Confirmation restores this entry.' : 'Existing optional details are preserved.'}</p>
        {selection.input.quantity !== undefined ? <p>Retained quantity: {selection.input.quantity} {selection.input.unit}</p> : null}
        {selection.input.useByDate ? <p>Retained use-by date: {selection.input.useByDate}</p> : null}
        {changed && !locked ? <p>Changed since review. Confirming uses the reviewed revision and may require conflict resolution.</p> : null}
        <button type="button" className={`${button} mt-3`} disabled={busy} onClick={() => void confirm()}>{busy ? 'Confirming…' : locked ? 'Retry confirmation' : 'Confirm addition'}</button></div> : <p className="text-sm">Choose an ingredient before confirming.</p>}
    </div> : null}
    {error ? <p role="alert" className="mt-3 text-sm font-semibold text-red-800">{error}</p> : null}
    {confirmed ? <button type="button" className={`${button} mt-3`} onClick={() => { reset(); setCode(''); codeField.current?.focus(); }}>Enter another barcode</button> : null}
  </section>;
}
