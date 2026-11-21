// @vitest-environment jsdom
// The Data Explorer's filters (v2.0 M4-7). The inline filter bar applies each change at once through the URL (one router.push per change);
// these tests pin that behavior first, then the mobile summary row and Filters sheet (M4-7b) that stage the same four filters and apply
// them together. The filter logic and the URL parameters are the same for both.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import DataExplorer from '@/components/explorer/DataExplorer';
import { explorerCatalog } from '@/lib/explorer/catalog';

const push = vi.fn();
let search = '';
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: () => undefined }),
  useSearchParams: () => new URLSearchParams(search),
}));

let root: Root;
let container: HTMLDivElement;
const catalog = explorerCatalog();
async function run(action: () => unknown) { await act(async () => { await action(); }); }
async function mount(query = '') {
  search = query;
  await run(() => root.render(createElement(DataExplorer, { catalog, today: '2026-11-20' })));
}
const lastPush = () => String(push.mock.calls.at(-1)![0]);
const pushedParams = () => new URLSearchParams(lastPush().split('?')[1]);
function setValue(element: HTMLInputElement | HTMLSelectElement, value: string) {
  const proto = element instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(element, value);
  element.dispatchEvent(new Event(element instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }));
}
const inlineFilters = () => container.querySelector<HTMLElement>('.ex-filters')!;
const labelled = (scope: ParentNode, text: string) => {
  const label = [...scope.querySelectorAll('label')].find((l) => l.textContent?.trim().startsWith(text))!;
  return label.querySelector<HTMLInputElement | HTMLSelectElement>('input:not([type=search]), select')!;
};

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('fetch', vi.fn(() => new Promise(() => undefined))); // the data requests stay pending: only the controls are under test
  vi.clearAllMocks();
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await run(() => root.unmount()); container.remove(); vi.unstubAllGlobals(); });

describe('the inline filter bar (from 760 px)', () => {
  it('shows the four filters with the URL values and the defaults', async () => {
    await mount('ingredient=ground-turkey&zip=80301&start=2026-11-01&end=2026-11-13&stores=SAFEWAY');
    const bar = inlineFilters();
    expect(labelled(bar, 'Market ZIP').value).toBe('80301');
    expect((labelled(bar, 'From') as HTMLInputElement).value).toBe('2026-11-01');
    expect((labelled(bar, 'Through') as HTMLInputElement).value).toBe('2026-11-13');
    expect(labelled(bar, 'Store').value).toBe('SAFEWAY');
    expect(bar.querySelector<HTMLSelectElement>('select[aria-label="Ingredient"]')!.value).toBe('ground-turkey');
  });

  it('applies the ingredient at once and clears the version and variety', async () => {
    await mount('version=v1&variety=x');
    await run(() => setValue(inlineFilters().querySelector<HTMLSelectElement>('select[aria-label="Ingredient"]')!, 'ground-turkey'));
    expect(push).toHaveBeenCalledTimes(1);
    expect(pushedParams().get('ingredient')).toBe('ground-turkey');
    expect(pushedParams().has('version')).toBe(false);
    expect(pushedParams().has('variety')).toBe(false);
  });

  it('applies From, Through and Store at once, one push each', async () => {
    await mount();
    await run(() => setValue(labelled(inlineFilters(), 'From'), '2026-10-01'));
    expect(pushedParams().get('start')).toBe('2026-10-01');
    await run(() => setValue(labelled(inlineFilters(), 'Through'), '2026-11-10'));
    expect(pushedParams().get('end')).toBe('2026-11-10');
    await run(() => setValue(labelled(inlineFilters(), 'Store'), 'SAFEWAY'));
    expect(pushedParams().get('stores')).toBe('SAFEWAY');
    expect(push).toHaveBeenCalledTimes(3);
  });

  it('applies the ZIP when the field loses focus with a new value, and not when it is unchanged', async () => {
    await mount('zip=80542');
    const zip = labelled(inlineFilters(), 'Market ZIP') as HTMLInputElement;
    await run(() => zip.dispatchEvent(new FocusEvent('focusout', { bubbles: true })));
    expect(push).not.toHaveBeenCalled();
    await run(() => { zip.focus(); setValue(zip, '80301'); zip.blur(); });
    expect(pushedParams().get('zip')).toBe('80301');
  });

  it('keeps the other parameters, such as the tab, when a filter changes, and drops the page and snapshot', async () => {
    await mount('tab=raw&page=3&snapshot=s1&asof=a1&mode=demo');
    await run(() => setValue(labelled(inlineFilters(), 'From'), '2026-10-01'));
    const params = pushedParams();
    expect(params.get('tab')).toBe('raw');
    expect(params.get('mode')).toBe('demo');
    expect(params.has('page')).toBe(false);
    expect(params.has('snapshot')).toBe(false);
    expect(params.has('asof')).toBe(false);
  });
});

// ---- M4-7b: the summary row and the Filters sheet (below 760 px) ----
import { expectNoA11yViolations } from 'tests/helpers/render';

const compact = () => container.querySelector<HTMLElement>('section.ex-compact')!;
const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]');
const inDialog = (label: string) => [...dialog()!.querySelectorAll('button')].find((b) => b.textContent === label)!;
const field = (label: string) => {
  const found = [...dialog()!.querySelectorAll('label')].find((l) => l.textContent === label)!;
  return dialog()!.querySelector<HTMLInputElement | HTMLSelectElement>(`#${found.htmlFor}`)!;
};
const summaryRowButton = (label: string) => [...compact().querySelectorAll('button')].find((b) => b.textContent === label)!;

describe('the summary row', () => {
  it('shows the ingredient and the defaults in force, with Change and Filters', async () => {
    await mount();
    expect(compact().querySelector('.ex-compact-name')!.textContent).toBe('Yellow or White Cooking Onions');
    expect(compact().querySelector('.ex-note')!.textContent).toBe('ZIP 80542 · Oct 10–Nov 20 · All observed stores');
    expect(summaryRowButton('Change')).toBeDefined();
    expect(summaryRowButton('Filters')).toBeDefined();
    expect(compact().getAttribute('aria-label')).toBe('Filters');
  });

  it('says the ZIP, dates and store from the URL: a store by name, several as "Selected stores", and the year when it is not this one', async () => {
    await mount('ingredient=ground-turkey&zip=80301&start=2026-11-01&end=2026-11-13&stores=SAFEWAY');
    expect(compact().querySelector('.ex-compact-name')!.textContent).toBe(catalog.find((i) => i.id === 'ground-turkey')!.name);
    expect(compact().querySelector('.ex-note')!.textContent).toBe('ZIP 80301 · Nov 1–Nov 13 · SAFEWAY');
    await mount('stores=SAFEWAY,KING_SOOPERS&start=2025-12-30&end=2026-01-05');
    expect(compact().querySelector('.ex-note')!.textContent).toBe('ZIP 80542 · Dec 30, 2025–Jan 5 · Selected stores');
  });
});

describe('the Ingredient sheet', () => {
  it('lists the catalog, marks the current ingredient and closes without applying anything', async () => {
    await mount('ingredient=ground-turkey');
    await run(() => summaryRowButton('Change').click());
    expect(dialog()!.querySelector('h2')!.textContent).toBe('Ingredient');
    const items = [...dialog()!.querySelectorAll('ul[aria-label="Ingredients"] button')];
    expect(items).toHaveLength(catalog.length);
    expect(items.filter((b) => b.getAttribute('aria-current') === 'true').map((b) => b.textContent)).toEqual([`${catalog.find((i) => i.id === 'ground-turkey')!.name}Selected`]);
    await run(() => dialog()!.querySelector<HTMLButtonElement>('button[aria-label="Close ingredient list"]')!.click());
    expect(dialog()).toBeNull();
    expect(push).not.toHaveBeenCalled();
  });

  it('narrows the list by the search, by name or keyword, but keeps the current ingredient', async () => {
    await mount('ingredient=ground-turkey');
    await run(() => summaryRowButton('Change').click());
    await run(() => setValue(field('Find an ingredient or variety') as HTMLInputElement, 'onion'));
    const names = [...dialog()!.querySelectorAll('ul[aria-label="Ingredients"] button')].map((b) => b.textContent);
    expect(names.some((name) => name!.includes('Onions'))).toBe(true);
    expect(names.length).toBeLessThan(catalog.length);
    expect(names.some((name) => name!.includes(catalog.find((i) => i.id === 'ground-turkey')!.name))).toBe(true);
  });

  it('picks an ingredient with one push that clears the version and variety, and closes', async () => {
    await mount('version=v1&variety=x&tab=raw');
    await run(() => summaryRowButton('Change').click());
    const pick = [...dialog()!.querySelectorAll('ul[aria-label="Ingredients"] button')].find((b) => b.textContent === catalog.find((i) => i.id === 'ground-turkey')!.name)!;
    await run(() => (pick as HTMLButtonElement).click());
    expect(push).toHaveBeenCalledTimes(1);
    expect(pushedParams().get('ingredient')).toBe('ground-turkey');
    expect(pushedParams().has('version')).toBe(false);
    expect(pushedParams().has('variety')).toBe(false);
    expect(pushedParams().get('tab')).toBe('raw');
    expect(dialog()).toBeNull();
  });
});

describe('the Filters sheet', () => {
  const open = async (query = 'zip=80301&start=2026-11-01&end=2026-11-13&stores=SAFEWAY') => { await mount(query); await run(() => summaryRowButton('Filters').click()); };

  it('opens with the filters in force, titled Filters', async () => {
    await open();
    expect(dialog()!.querySelector('h2')!.textContent).toBe('Filters');
    expect((field('Market ZIP') as HTMLInputElement).value).toBe('80301');
    expect((field('From') as HTMLInputElement).value).toBe('2026-11-01');
    expect((field('Through') as HTMLInputElement).value).toBe('2026-11-13');
    expect((field('Store') as HTMLSelectElement).value).toBe('SAFEWAY');
  });

  it('stages edits and applies the four filters together in one push, then closes', async () => {
    await open();
    await run(() => setValue(field('Market ZIP') as HTMLInputElement, '80524'));
    await run(() => setValue(field('From') as HTMLInputElement, '2026-10-01'));
    await run(() => setValue(field('Through') as HTMLInputElement, '2026-11-10'));
    await run(() => setValue(field('Store') as HTMLSelectElement, 'KING_SOOPERS'));
    expect(push).not.toHaveBeenCalled();
    await run(() => inDialog('Apply').click());
    expect(push).toHaveBeenCalledTimes(1);
    const params = pushedParams();
    expect([params.get('zip'), params.get('start'), params.get('end'), params.get('stores')]).toEqual(['80524', '2026-10-01', '2026-11-10', 'KING_SOOPERS']);
    expect(dialog()).toBeNull();
  });

  it('drops the store from the URL when All observed stores is chosen, and keeps the tab and drops the page', async () => {
    await open('tab=raw&page=2&stores=SAFEWAY');
    await run(() => setValue(field('Store') as HTMLSelectElement, ''));
    await run(() => inDialog('Apply').click());
    expect(pushedParams().has('stores')).toBe(false);
    expect(pushedParams().get('tab')).toBe('raw');
    expect(pushedParams().has('page')).toBe(false);
  });

  it('applies nothing when it is closed, and forgets the edits next time', async () => {
    await open();
    await run(() => setValue(field('Market ZIP') as HTMLInputElement, '80524'));
    await run(() => dialog()!.querySelector<HTMLButtonElement>('button[aria-label="Close filters"]')!.click());
    expect(dialog()).toBeNull();
    expect(push).not.toHaveBeenCalled();
    await run(() => summaryRowButton('Filters').click());
    expect((field('Market ZIP') as HTMLInputElement).value).toBe('80301');
  });

  it('puts the defaults in the sheet on Reset, and applies them only on Apply', async () => {
    await open();
    await run(() => inDialog('Reset').click());
    expect((field('Market ZIP') as HTMLInputElement).value).toBe('80542');
    expect((field('From') as HTMLInputElement).value).toBe('2026-10-10');
    expect((field('Through') as HTMLInputElement).value).toBe('2026-11-20');
    expect((field('Store') as HTMLSelectElement).value).toBe('');
    expect(push).not.toHaveBeenCalled();
    await run(() => inDialog('Apply').click());
    const params = pushedParams();
    expect([params.get('zip'), params.get('start'), params.get('end'), params.has('stores')]).toEqual(['80542', '2026-10-10', '2026-11-20', false]);
  });

  it('refuses a ZIP that is not five digits: it says so, stays open and pushes nothing', async () => {
    await open();
    await run(() => setValue(field('Market ZIP') as HTMLInputElement, '803'));
    await run(() => inDialog('Apply').click());
    expect(push).not.toHaveBeenCalled();
    expect(dialog()).not.toBeNull();
    expect(dialog()!.textContent).toContain('Enter a five digit ZIP code.');
    expect(field('Market ZIP').getAttribute('aria-invalid')).toBe('true');
    await run(() => setValue(field('Market ZIP') as HTMLInputElement, '80524'));
    await run(() => inDialog('Apply').click());
    expect(push).toHaveBeenCalledTimes(1);
  });

  it('refuses a Through date before From, and a missing date', async () => {
    await open();
    await run(() => setValue(field('Through') as HTMLInputElement, '2026-10-01'));
    await run(() => inDialog('Apply').click());
    expect(dialog()!.textContent).toContain('Through must be on or after From.');
    await run(() => setValue(field('From') as HTMLInputElement, ''));
    await run(() => inDialog('Apply').click());
    expect(dialog()!.textContent).toContain('Choose a start date.');
    expect(push).not.toHaveBeenCalled();
  });

  it('clears an earlier error after Reset', async () => {
    await open();
    await run(() => setValue(field('Market ZIP') as HTMLInputElement, '803'));
    await run(() => inDialog('Apply').click());
    await run(() => inDialog('Reset').click());
    expect(dialog()!.textContent).not.toContain('Enter a five digit ZIP code.');
    // and the next edit is not judged until Apply is pressed again
    await run(() => setValue(field('Market ZIP') as HTMLInputElement, '803'));
    expect(dialog()!.textContent).not.toContain('Enter a five digit ZIP code.');
  });

  it('stops the Through date at today', async () => {
    await open();
    expect(field('Through').getAttribute('max')).toBe('2026-11-20');
  });

  it('keeps a multi-store selection selectable, as the inline bar does', async () => {
    await open('stores=SAFEWAY,KING_SOOPERS');
    expect((field('Store') as HTMLSelectElement).value).toBe('SAFEWAY,KING_SOOPERS');
    expect([...(field('Store') as HTMLSelectElement).options].map((o) => o.textContent)).toContain('Selected stores');
  });

  it('has no accessibility violations, with and without errors', async () => {
    await open();
    await expectNoA11yViolations(dialog()!);
    await run(() => setValue(field('Market ZIP') as HTMLInputElement, '803'));
    await run(() => inDialog('Apply').click());
    await expectNoA11yViolations(dialog()!);
  });
});
