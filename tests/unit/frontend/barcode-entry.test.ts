// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { webcrypto } from 'node:crypto';
import BarcodeEntry from '@/components/BarcodeEntry';
import type { PantryEntry } from '@/types/pantry';
import type { BarcodeLookupResult } from '@/types/barcode';
import { validateBarcode } from '@/lib/barcodes/validation';
import { expectNoA11yViolations } from 'tests/helpers/render';

let root: Root; let container: HTMLDivElement;
const camera = vi.hoisted(() => ({ capture: null as null | ((code: string, format: 'UPC_A' | 'EAN_13') => void), cleanup: vi.fn() }));
vi.mock('@/components/BarcodeCamera', async () => {
  const { useEffect } = await import('react');
  return { default: (props: { onCapture: (code: string, format: 'UPC_A' | 'EAN_13') => void }) => {
    camera.capture = props.onCapture; useEffect(() => () => camera.cleanup(), []); return null;
  } };
});
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
async function render(entries: PantryEntry[] = [], owner = 'A', acceptedCatalogIds = ['olive-oil', 'avocado-oil'], cameraEnabled = false) { await run(() => root.render(createElement(BarcodeEntry, { key: owner, cameraEnabled, entries, acceptedCatalogIds, onSave: save, onClose: close }))); }
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
  it('accepts a lookup between two and 2.5 seconds and clears its abort timer', async () => {
    await render(); await input('Printed barcode digits', code);
    vi.useFakeTimers();
    try {
      vi.mocked(fetch).mockImplementation((_url, init) => new Promise((resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
        window.setTimeout(() => resolve(Response.json(found())), 2200);
      }));
      await act(async () => { container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
      const signal = vi.mocked(fetch).mock.calls[0][1]!.signal!;
      await act(async () => { await vi.advanceTimersByTimeAsync(2200); });
      expect(container.textContent).toContain('Product: EXTRA VIRGIN OLIVE OIL');
      expect(container.textContent).not.toContain('Lookup could not connect or complete');
      expect(button('Look up product').disabled).toBe(false);
      await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
      expect(signal.aborted).toBe(false); expect(save).not.toHaveBeenCalled();
    } finally { vi.useRealTimers(); }
  });
  it('aborts a stalled lookup at 2.5 seconds and retains manual selection without writes', async () => {
    await render(); await input('Printed barcode digits', code);
    vi.useFakeTimers();
    try {
      vi.mocked(fetch).mockImplementation((_url, init) => new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
      }));
      await act(async () => { container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
      const signal = vi.mocked(fetch).mock.calls[0][1]!.signal!;
      await act(async () => { await vi.advanceTimersByTimeAsync(2499); });
      expect(signal.aborted).toBe(false);
      await act(async () => { await vi.advanceTimersByTimeAsync(1); });
      expect(signal.aborted).toBe(true);
      expect(container.textContent).toContain('Lookup could not connect or complete');
    } finally { vi.useRealTimers(); }
    await run(() => button('Choose ingredient manually').click());
    await input('Find a cooking ingredient', 'olive oil'); await run(() => button('Choose Olive oil').click());
    expect(button('Confirm addition').disabled).toBe(false); expect(save).not.toHaveBeenCalled();
  });
});

describe('capture reuses typed confirmation', () => {
  it('is default off and never mounts capture or requests lookup merely by opening', async () => {
    await render(); expect(container.textContent).not.toContain('Scan barcode'); expect(fetch).not.toHaveBeenCalled();
  });
  it('fills digits with the actual format, stops capture and requires lookup then confirmation', async () => {
    await render([existing], 'A', ['olive-oil'], true);
    await run(() => button('Scan barcode').click());
    await run(() => camera.capture!(code, 'UPC_A'));
    expect(camera.cleanup).toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled(); expect(save).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(container.querySelector('input'));
    await run(() => container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    expect(JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string)).toEqual({ barcode: code, format: 'UPC_A' });
    expect(save).not.toHaveBeenCalled(); await run(() => button('Confirm addition').click()); expect(save).toHaveBeenCalledOnce();
  });
  it('opening capture cancels an outstanding lookup; changed code and owner unmount capture', async () => {
    let resolve!: (response: Response) => void;
    vi.mocked(fetch).mockReturnValue(new Promise((done) => { resolve = done; }));
    await render([], 'A', ['olive-oil'], true); await lookup();
    const signal = vi.mocked(fetch).mock.calls[0][1]!.signal!;
    await run(() => button('Scan barcode').click()); expect(signal.aborted).toBe(true);
    await run(() => resolve(Response.json(found()))); expect(container.textContent).not.toContain('Product: EXTRA');
    camera.cleanup.mockClear(); await input('Printed barcode digits', '036000291452'); expect(camera.cleanup).toHaveBeenCalledOnce();
    await run(() => button('Scan barcode').click()); camera.cleanup.mockClear();
    await render([], 'B', ['olive-oil'], true); expect(camera.cleanup).toHaveBeenCalledOnce(); expect(save).not.toHaveBeenCalled();
  });
});

describe('shared ingress throttling', () => {
  it('recovers from a platform non-JSON 429 while honoring Retry-After and keeping manual selection', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('<html>platform rate limit</html>', { status: 429, headers: { 'Content-Type': 'text/html', 'Retry-After': '2' } }));
    await render(); await lookup();
    expect(container.textContent).toContain('Too many lookups'); expect(button('Look up product').disabled).toBe(true);
    await run(() => button('Choose ingredient manually').click());
    await input('Find a cooking ingredient', 'olive oil'); await run(() => button('Choose Olive oil').click());
    expect(save).not.toHaveBeenCalled();
    await run(() => button('Confirm addition').click()); expect(save).toHaveBeenCalledOnce();
  });
});

// v2.0 M4-4c: the barcode entry on the design tokens and primitives (wireframe Pantry Scan).
describe('markup on the design tokens', () => {
  it('has no accessibility violations at the lookup, at the review and after a failed save', async () => {
    await render([existing]);
    await expectNoA11yViolations(container);
    await lookup();
    expect(container.textContent).toContain('Product: EXTRA VIRGIN OLIVE OIL');
    await expectNoA11yViolations(container);
    save.mockRejectedValue(new Error('queue failed'));
    await run(() => button('Confirm addition').click());
    expect(container.querySelector('[role=alert]')!.textContent).toContain('queue failed');
    await expectNoA11yViolations(container);
  });

  it('makes Confirm addition the one primary action, and shows a failure as an alert', async () => {
    await render([existing]);
    expect(button('Look up product').className).not.toContain('bg-accent');
    await lookup();
    expect(button('Confirm addition').className).toContain('bg-accent');
    expect([...container.querySelectorAll('button')].filter((item) => item.className.includes('bg-accent'))).toHaveLength(1);
    expect(container.querySelector('[role=alert]')).toBeNull();
  });

  it('labels the lookup field and the other fields, and offers the matches as toggle-style chips', async () => {
    await render([existing]);
    expect(document.getElementById([...container.querySelectorAll('label')].find((item) => item.textContent === 'Printed barcode digits')!.htmlFor)).toBe(container.querySelector('input'));
    await lookup();
    await input('Find a cooking ingredient', 'olive');
    const chip = button('Choose Olive oil');
    expect(chip.className).toContain('min-h-touch');
    expect(container.querySelector('section')!.getAttribute('aria-labelledby')).toBeTruthy();
  });
});
