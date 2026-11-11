// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { webcrypto } from 'node:crypto';
import BarcodeEntry from '@/components/BarcodeEntry';
import type { PantryEntry } from '@/types/pantry';
import type { BarcodeLookupResult } from '@/types/barcode';
import { validateBarcode } from '@/lib/barcodes/validation';

let root: Root; let container: HTMLDivElement;
const save = vi.fn().mockResolvedValue(undefined); const close = vi.fn();
const code = '011110118134';
const found = (): BarcodeLookupResult => {
  const validation = validateBarcode(code); if (!validation.ok) throw new Error('fixture');
  return { status: 'FOUND', barcode: validation.barcode, product: { source: 'USDA_FDC_BRANDED', fdcId: '2533402', originalBarcode: code,
    description: 'EXTRA VIRGIN OLIVE OIL', brandName: 'KROGER', brandOwner: 'The Kroger Co.', packageLabel: '16.9 FL OZ/500 mL',
    marketCountry: 'United States', publicationDate: '2023-04-27', modifiedDate: '2023-04-01', availableDate: '2023-04-27', snapshotDate: '2026-10-29', sourceUrl: 'https://fdc.nal.usda.gov/food-details/2533402/branded' },
    suggestion: { ingredientId: 'olive-oil', ruleId: 'barcode-map-v1-fdc-2533402' } };
};
const existing: PantryEntry = { id: 'oil', ingredientId: 'olive-oil', displayName: 'Olive oil', available: false, quantity: 0, unit: 'tbsp', location: 'FRIDGE', useByDate: '2000-01-01', revision: 7, updatedAtIso: '' };
const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
async function run(action: () => unknown) { await act(async () => { await action(); await settle(); }); }
async function render(entries: PantryEntry[] = [], owner = 'A', acceptedCatalogIds = ['olive-oil', 'avocado-oil']) { await run(() => root.render(createElement(BarcodeEntry, { key: owner, entries, acceptedCatalogIds, onSave: save, onClose: close }))); }
function button(label: string) { const found = [...container.querySelectorAll('button')].find((item) => item.textContent === label); if (!found) throw new Error(`Missing ${label}`); return found; }
async function input(label: string, value: string) { await run(() => { const field = [...container.querySelectorAll('label')].find((item) => item.textContent === label)!; const element = document.getElementById(field.htmlFor) as HTMLInputElement;
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(element, value); element.dispatchEvent(new Event('input', { bubbles: true })); }); }
async function lookup() { await input('Printed barcode digits', code); await run(() => container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))); }
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true); vi.stubGlobal('crypto', webcrypto);
  Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
  vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => Response.json(found())));
  save.mockReset().mockResolvedValue(undefined); close.mockReset();
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await run(() => root.unmount()); container.remove(); vi.unstubAllGlobals(); });

describe('typed barcode review and confirmation', () => {
  it('shows source/product separately and never writes before confirmation; No details survive', async () => {
    await render([existing]); await lookup();
    expect(container.textContent).toContain('Product: EXTRA VIRGIN OLIVE OIL');
    expect(container.textContent).toContain('Suggested cooking ingredient: Olive oil');
    expect(container.textContent).toContain('Current entry: No');
    expect(container.textContent).toContain('Only confirmation changes No to Yes');
    expect(container.textContent).toContain('Retained quantity: 0 tbsp');
    expect(save).not.toHaveBeenCalled();
    await run(() => button('Confirm addition').click());
    expect(save).toHaveBeenCalledOnce();
    expect(save.mock.calls[0]).toMatchObject([{ ingredientId: 'olive-oil', displayName: 'Olive oil', available: true, quantity: 0, unit: 'tbsp', location: 'FRIDGE', useByDate: '2000-01-01' }, 'oil', { expectedRevision: 7 }]);
    expect(JSON.stringify(save.mock.calls)).not.toContain('500 mL');
  });
  it('cancels a review without writes and invalidates an older lookup when the code changes', async () => {
    let resolve!: (response: Response) => void;
    vi.mocked(fetch).mockReturnValue(new Promise((done) => { resolve = done; }));
    await render(); await lookup();
    await input('Printed barcode digits', '036000291452');
    await run(() => resolve(Response.json(found())));
    expect(container.textContent).not.toContain('Product: EXTRA');
    expect(save).not.toHaveBeenCalled();
    await run(() => button('Cancel').click()); expect(close).toHaveBeenCalledOnce(); expect(save).not.toHaveBeenCalled();
  });
  it('discards a pending result on owner change', async () => {
    let resolve!: (response: Response) => void;
    vi.mocked(fetch).mockReturnValue(new Promise((done) => { resolve = done; }));
    await render([], 'A'); await lookup(); await render([], 'B');
    await run(() => resolve(Response.json(found())));
    expect(container.textContent).not.toContain('Product: EXTRA'); expect(save).not.toHaveBeenCalled();
  });
  it('corrects the proposed identity and requires a separate explicit confirmation', async () => {
    await render(); await lookup(); await input('Find a cooking ingredient', 'avocado oil');
    await run(() => button('Choose Avocado oil').click());
    expect(save).not.toHaveBeenCalled();
    await run(() => button('Confirm addition').click()); expect(save.mock.calls[0][0].ingredientId).toBe('avocado-oil');
  });
  it('keeps a custom selection private without an ingredient ID or package quantity', async () => {
    await render(); await lookup(); await input('Private custom ingredient name', 'Family oil mixture');
    await run(() => button('Use private custom ingredient').click()); await run(() => button('Confirm addition').click());
    expect(save.mock.calls[0][0]).toEqual({ displayName: 'Family oil mixture', available: true });
  });
  it('retains the same operation for retry and blocks double confirmation', async () => {
    save.mockRejectedValueOnce(new Error('storage unavailable'));
    await render([existing]); await lookup();
    await run(() => { button('Confirm addition').click(); button('Confirm addition').click(); });
    expect(save).toHaveBeenCalledOnce(); const first = save.mock.calls[0];
    await run(() => button('Retry confirmation').click()); expect(save).toHaveBeenCalledTimes(2);
    expect(save.mock.calls[1]).toEqual(first);
  });
  it('retains the reviewed revision when inventory changes before confirmation', async () => {
    await render([existing]); await lookup(); await render([{ ...existing, revision: 8, available: true }]);
    expect(container.textContent).toContain('Changed since review');
    await run(() => button('Confirm addition').click()); expect(save.mock.calls[0][2].expectedRevision).toBe(7);
  });
  it('keeps missing/offline lookup recoverable through manual ingredient selection', async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json({ status: 'NOT_FOUND', message: 'No US product in this snapshot.' }));
    await render(); await lookup(); await run(() => button('Choose ingredient manually').click());
    await input('Find a cooking ingredient', 'olive oil'); await run(() => button('Choose Olive oil').click());
    expect(save).not.toHaveBeenCalled(); await run(() => button('Confirm addition').click()); expect(save).toHaveBeenCalledOnce();
  });
  it('requires manual selection when the suggested ID is not accepted for the current owner', async () => {
    await render([], 'A', []); await lookup();
    expect(container.textContent).not.toContain('Suggested cooking ingredient');
    expect(container.textContent).toContain('Choose an ingredient before confirming.');
    expect(save).not.toHaveBeenCalled();
  });
  it('honors throttling retry time', async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json({ status: 'THROTTLED', message: 'Wait briefly.' }, { status: 429, headers: { 'Retry-After': '30' } }));
    await render(); await lookup(); expect(button('Look up product').disabled).toBe(true);
    expect(save).not.toHaveBeenCalled();
    await run(() => container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    expect(fetch).toHaveBeenCalledOnce();
  });
});
