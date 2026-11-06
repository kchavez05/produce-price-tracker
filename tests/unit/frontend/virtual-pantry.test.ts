// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, Root } from 'react-dom/client';
import VirtualPantry from '@/components/VirtualPantry';
import { cookingIngredients } from '@/lib/pantry/model';
import { evaluatePantryMutation } from '@/lib/pantry/mutations';
import { PantryEntry } from '@/types/pantry';
let root: Root;
let container: HTMLDivElement;
const save = vi.fn().mockResolvedValue(undefined);
const saved: PantryEntry = { id: 'broth', displayName: 'Chicken broth', ingredientId: 'chicken-broth', available: false, quantity: 0, unit: 'cups', location: 'FRIDGE', useByDate: '2000-01-01', revision: 3, updatedAtIso: '' };
const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
async function run(action: () => void) { await act(async () => { action(); await settle(); }); }
function button(text: string) {
  const found = [...container.querySelectorAll('button')].find((item) => item.textContent?.includes(text));
  if (!found) throw new Error(`Missing button: ${text}`);
  return found;
}
async function render(entries: PantryEntry[] = [], acceptedCatalogIds = cookingIngredients.map((r) => r.id)) { await run(() => root.render(createElement(VirtualPantry, {
  entries, acceptedCatalogIds, status: 'Saved', error: null, guest: true, hasLegacyEdits: false, importDuplicates: [], guestEntries: [], conflicts: [],
  onSave: save, onDelete: vi.fn(), onRetry: vi.fn(), onResolve: vi.fn(), onImportGuest: vi.fn(), onClose: vi.fn(),
  onReviewLegacy: vi.fn().mockResolvedValue([]), onImportLegacy: vi.fn(),
}))); }
async function search(value: string) { await run(() => {
  const field = container.querySelector('input[type=search]') as HTMLInputElement;
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(field, value);
  field.dispatchEvent(new Event('input', { bubbles: true }));
}); }
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true); save.mockClear();
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await run(() => root.unmount()); container.remove(); vi.unstubAllGlobals(); });
describe('Virtual Pantry accessible controls', () => {
  it('leaves shortcuts optional and adds a catalog ingredient without quantity or price', async () => {
    await render();
    expect(save).not.toHaveBeenCalled();
    expect(container.textContent).toContain('Nothing is preselected or required.');
    await run(() => button('Add Olive oil').click());
    expect(save).toHaveBeenCalledWith({ ingredientId: 'olive-oil', displayName: 'Olive oil', available: true }, undefined);
  });
  it('re-adds a No ingredient without clearing details and exposes an explicit availability label', async () => {
    await render([saved]);
    expect(container.querySelector('[aria-label="Chicken broth availability"]')).toBeNull();
    await run(() => (container.querySelector('input[type=checkbox]') as HTMLInputElement).click());
    const availability = container.querySelector('[aria-label="Chicken broth availability"]') as HTMLSelectElement;
    availability.focus(); expect(document.activeElement).toBe(availability);
    expect(availability.value).toBe('false');
    expect(container.textContent).toContain('Use by 2000-01-01');
    await search('chicken broth');
    await run(() => button('Add Chicken broth').click());
    expect(save).toHaveBeenCalledWith({ ...saved, available: true }, saved.id);
  });
  it('can re-add an existing No identity while account readiness metadata is unavailable', async () => {
    await render([saved], []); await search('chicken broth');
    expect(button('Add Chicken broth').disabled).toBe(false);
    await run(() => button('Add Chicken broth').click());
    expect(save).toHaveBeenCalledWith({ ...saved, available: true }, saved.id);
  });
  it('adds a private custom name when search has no suitable result', async () => {
    await render(); await search('My family spice blend');
    expect(container.textContent).toContain('No matching ingredient.');
    await run(() => button('Add custom ingredient:').click());
    await run(() => container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    expect(save).toHaveBeenCalledWith({ displayName: 'My family spice blend', available: true }, undefined);
  });
  it('restores a deleted custom identity through the form using its existing ID and revision', async () => {
    const deleted: PantryEntry = { id: 'custom-blend', displayName: 'My family spice blend', available: true,
      revision: 4, updatedAtIso: '2026-10-30T00:00:00Z', deletedAtIso: '2026-10-30T00:00:00Z' };
    await render([deleted]); await search('MY  FAMILY spice blend');
    await run(() => button('Add custom ingredient:').click());
    await run(() => container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    expect(save).toHaveBeenCalledWith({ displayName: 'MY FAMILY spice blend', available: true }, deleted.id);
    const [entry, entryId] = save.mock.calls[0];
    const restored = evaluatePantryMutation([deleted], { mutationId: 'restore', entryId, expectedRevision: deleted.revision,
      operation: 'put', entry }, '2026-10-30T01:00:00Z');
    expect(restored).toMatchObject({ status: 'applied', entry: { id: deleted.id, revision: 5, available: true } });
    if (restored.status === 'applied') expect(restored.entry.deletedAtIso).toBeUndefined();
  });
  it('offers two primary lentil forms, optional red variety, and a direct specific query', async () => {
    await render(); await search('lentils');
    const primary = [...container.querySelectorAll('ul.grid > li > button')].map((b) => b.textContent);
    expect(primary).toEqual(['Add Canned lentils', 'Add Dried lentils']);
    expect(container.querySelector('summary')?.textContent).toBe('Choose a variety (optional)');
    await run(() => button('Add Dried lentils').click());
    expect(save).toHaveBeenLastCalledWith({ ingredientId: 'lentils-dried', displayName: 'Dried lentils', available: true }, undefined);
    await search('red lentils');
    expect(button('Add Dried red lentils')).toBeTruthy();
    expect(container.querySelector('summary')).toBeNull();
  });
  it('adds approved expanded ingredients after server readiness and keeps flour varieties optional', async () => {
    await render([], ['olive-oil']); await search('quinoa');
    expect(button('Add Dry quinoa').disabled).toBe(true);
    await render();
    expect(button('Add Dry quinoa').disabled).toBe(false);
    await run(() => button('Add Dry quinoa').click());
    expect(save).toHaveBeenLastCalledWith({ ingredientId: 'quinoa-dry', displayName: 'Dry quinoa', available: true }, undefined);
    await search('rice flour');
    expect(container.querySelector('summary')?.textContent).toBe('Choose a variety (optional)');
    await run(() => button('Add Brown rice flour').click());
    expect(save).toHaveBeenLastCalledWith({ ingredientId: 'brown-rice-flour', displayName: 'Brown rice flour', available: true }, undefined);
    await search('brown rice');
    expect(container.textContent).not.toContain('Add Brown rice flour');
  });
  it('waits for vegetable catalog acceptance and saves a fresh herb without optional fields', async () => {
    await render([], ['garlic-fresh']); await search('fresh coriander');
    expect(button('Add Fresh cilantro').disabled).toBe(true);
    await render();
    await run(() => button('Add Fresh cilantro').click());
    expect(save).toHaveBeenLastCalledWith({ ingredientId: 'cilantro-fresh', displayName: 'Fresh cilantro', available: true }, undefined);
    await search('peppermint');
    expect(container.textContent).not.toContain('Add Fresh spearmint');
  });
  it('keeps yogurt out of milk search and waits for acceptance before a quantity-free add', async () => {
    await render([], ['milk-whole']); await search('milk');
    expect(button('Add Whole milk (3.25%)')).toBeTruthy();
    expect(container.textContent).not.toContain('Add Plain whole-milk yogurt');
    await search('plain yogurt');
    expect(button('Add Plain whole-milk yogurt').disabled).toBe(true);
    await render();
    await run(() => button('Add Plain whole-milk yogurt').click());
    expect(save).toHaveBeenLastCalledWith({ ingredientId: 'yogurt-plain-whole-milk', displayName: 'Plain whole-milk yogurt', available: true }, undefined);
    await search('Greek yogurt');
    expect(container.textContent).not.toContain('Add Plain whole-milk yogurt');
  });
  it('prevents adding an ID before server acceptance and explains explicit No coverage', async () => {
    await render([], ['red-lentils-dried']); await search('lentils');
    expect(button('Add Dried lentils').disabled).toBe(true);
    expect(container.textContent).toContain('account’s catalog update');
    await render([{ ...saved, id: 'general', ingredientId: 'lentils-dried', displayName: 'Dried lentils' }, { ...saved, id: 'red', ingredientId: 'red-lentils-dried', displayName: 'Dried red lentils', available: true }]);
    await search(''); await run(() => (container.querySelector('input[type=checkbox]') as HTMLInputElement).click());
    expect(container.textContent).toContain('Marked No: available varieties do not cover');
  });
  it('edits an unfamiliar saved identity without clearing its ID or optional details', async () => {
    await render([{ ...saved, available: true, ingredientId: 'future-catalog-item', displayName: 'Future ingredient' }]);
    await run(() => button('Edit').click());
    await run(() => container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ ingredientId: 'future-catalog-item', displayName: 'Future ingredient', quantity: 0, useByDate: '2000-01-01' }), saved.id);
  });
  it('keeps invalid optional details recoverable with inline errors', async () => {
    await render([{ ...saved, available: true }]);
    await run(() => button('Edit').click());
    await run(() => {
      const quantity = container.querySelector('input[name=quantity]') as HTMLInputElement;
      quantity.value = '-1';
      container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    expect(save).not.toHaveBeenCalled();
    expect(container.querySelector('[role=alert]')?.textContent).toContain('nonnegative');
    expect(container.querySelector('form')).not.toBeNull();
  });
});
