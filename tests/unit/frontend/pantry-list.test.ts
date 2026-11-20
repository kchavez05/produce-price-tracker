// @vitest-environment jsdom
// The Pantry list (v2.0 M4-4a, wireframes Pantry and Pantry Empty): the optional banner, the All, Have and Out chips, a Yes/No
// radio group per ingredient, the empty state with staple shortcuts, and the views that match nothing. The sync, conflict and
// import behavior is covered where it was (virtual-pantry.test.ts and the sync regression tests).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import VirtualPantry from '@/modules/pantry/VirtualPantry';
import { cookingIngredients } from '@/lib/pantry/model';
import { expectNoA11yViolations } from 'tests/helpers/render';
import type { PantryEntry } from '@/types/pantry';

let root: Root;
let container: HTMLDivElement;
const save = vi.fn().mockResolvedValue(undefined);
const entry = (id: string, displayName: string, ingredientId: string, available: boolean): PantryEntry =>
  ({ id, displayName, ingredientId, available, revision: 1, updatedAtIso: '' });
const oil = entry('oil', 'Olive oil', 'olive-oil', true);
const salt = entry('salt', 'Salt', 'salt', true);
const rice = entry('rice', 'Dry basmati rice', 'basmati-rice-dry', false);
const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
async function run(action: () => void) { await act(async () => { action(); await settle(); }); }
async function render(entries: PantryEntry[] = []) {
  await run(() => root.render(createElement(VirtualPantry, {
    entries, acceptedCatalogIds: cookingIngredients.map((ingredient) => ingredient.id), status: 'Saved', error: null, guest: true, hasLegacyEdits: false,
    importDuplicates: [], guestEntries: [], conflicts: [],
    onSave: save, onDelete: vi.fn(), onRetry: vi.fn(), onResolve: vi.fn(), onImportGuest: vi.fn(),
    onReviewLegacy: vi.fn().mockResolvedValue([]), onImportLegacy: vi.fn(),
  })));
}
const chip = (label: string) => [...container.querySelectorAll<HTMLButtonElement>('[role="group"][aria-label="Show"] button')].find((b) => b.textContent === label)!;
const names = () => [...container.querySelectorAll('li p.font-semibold')].map((el) => el.textContent);
const group = (name: string) => container.querySelector<HTMLElement>(`[role=radiogroup][aria-label="${name} availability"]`)!;
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true); save.mockClear();
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await run(() => root.unmount()); container.remove(); vi.unstubAllGlobals(); });

describe('the frame', () => {
  it('says that nothing is required, and has a labelled search', async () => {
    await render([oil]);
    expect(container.querySelector('[role=status]')!.textContent).toContain('Nothing here is required.');
    expect(container.querySelector('input[type=search]')!.id).toBeTruthy();
    expect(container.querySelector('label[for="' + container.querySelector('input[type=search]')!.id + '"]')!.textContent).toBe('Search ingredients or enter a custom name');
  });

  it('keeps Virtual Pantry as the focused heading, visible to assistive technology only', async () => {
    await render([oil]);
    const heading = container.querySelector<HTMLElement>('#virtual-pantry-title')!;
    expect(heading.tagName).toBe('H2');
    expect(heading.textContent).toBe('Virtual Pantry');
    expect(heading.className).toContain('sr-only');
    expect(document.activeElement).toBe(heading);
  });
});

describe('the filter chips', () => {
  it('opens on All, showing ingredients marked Yes and No', async () => {
    await render([oil, rice, salt]);
    expect(chip('All').getAttribute('aria-pressed')).toBe('true');
    expect(names()).toEqual(['Olive oil', 'Dry basmati rice', 'Salt']);
  });

  it('shows only what is marked Yes on Have and only what is marked No on Out', async () => {
    await render([oil, rice, salt]);
    await run(() => chip('Have').click());
    expect(chip('Have').getAttribute('aria-pressed')).toBe('true');
    expect(chip('All').getAttribute('aria-pressed')).toBe('false');
    expect(names()).toEqual(['Olive oil', 'Salt']);
    await run(() => chip('Out').click());
    expect(names()).toEqual(['Dry basmati rice']);
    await run(() => chip('All').click());
    expect(names()).toHaveLength(3);
  });

  it('says so when a view has nothing in it', async () => {
    await render([oil, salt]);
    await run(() => chip('Out').click());
    expect(names()).toEqual([]);
    expect(container.textContent).toContain('No ingredients match this view. Clear search or choose All.');
  });

  it('is not shown before there is anything in the Pantry', async () => {
    await render([]);
    expect(container.querySelector('[role="group"][aria-label="Show"]')).toBeNull();
  });
});

describe('Yes and No', () => {
  it('is a labelled radio group per ingredient, with the current answer chosen', async () => {
    await render([oil, rice]);
    expect([...group('Olive oil').querySelectorAll<HTMLInputElement>('input')].map((input) => [input.value, input.checked])).toEqual([['true', true], ['false', false]]);
    expect(group('Dry basmati rice').querySelector<HTMLInputElement>('input:checked')!.value).toBe('false');
    expect([...group('Olive oil').querySelectorAll('span')].map((span) => span.textContent)).toEqual(['Yes', 'No']);
  });

  it('saves the other answer for that ingredient, keeping its details', async () => {
    await render([oil, rice]);
    await run(() => group('Olive oil').querySelector<HTMLInputElement>('input[value="false"]')!.click());
    expect(save).toHaveBeenCalledWith({ ...oil, available: false }, 'oil');
    await run(() => group('Dry basmati rice').querySelector<HTMLInputElement>('input[value="true"]')!.click());
    expect(save).toHaveBeenLastCalledWith({ ...rice, available: true }, 'rice');
  });
});

describe('the empty Pantry', () => {
  it('says that is fine and offers the staples as optional shortcuts', async () => {
    await render([]);
    expect(container.querySelector('h2:not(#virtual-pantry-title)')!.textContent).toBe('Your Pantry Is Empty');
    expect(container.textContent).toContain("That's fine. Pantry is optional.");
    expect([...container.querySelectorAll('button')].filter((b) => /^Add /.test(b.textContent ?? '')).map((b) => b.textContent))
      .toEqual(['Add Olive oil', 'Add Salt', 'Add Canned black beans', 'Add Dry basmati rice']);
    expect(container.textContent).toContain('Nothing is preselected or required.');
    expect(save).not.toHaveBeenCalled();
  });

  it('is gone once the Pantry has an ingredient, or while searching', async () => {
    await render([oil]);
    expect(container.textContent).not.toContain('Your Pantry Is Empty');
    await render([]);
    await run(() => {
      const field = container.querySelector('input[type=search]') as HTMLInputElement;
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(field, 'salt');
      field.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(container.textContent).not.toContain('Your Pantry Is Empty');
  });
});

describe('accessibility', () => {
  it('has no violations with ingredients, and with an empty Pantry', async () => {
    await render([oil, rice]);
    await expectNoA11yViolations(container);
    await render([]);
    await expectNoA11yViolations(container);
  });
});
