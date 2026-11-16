// @vitest-environment jsdom
import { createElement as h, createRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Badge, Banner, Button, Card, EmptyState, List, ListRow, PageHeader, Sheet, Sidebar, Skeleton, TabBar } from '@/components/ui';
import { expectNoA11yViolations, renderUi, type RenderHandle } from '../../helpers/render';

let handle: RenderHandle | undefined;
afterEach(async () => { await handle?.unmount(); handle = undefined; document.body.style.overflow = ''; vi.unstubAllGlobals(); });
const q = <T extends Element>(selector: string, scope: ParentNode = document) => scope.querySelector(selector) as T;
const page = (...children: unknown[]) => h('main', null, ...(children as never[]));
const key = (target: Element, name: string, init: KeyboardEventInit = {}) => {
  const event = new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
};

describe('Card, Badge, Skeleton, PageHeader, EmptyState', () => {
  it('render accessibly with proper structure', async () => {
    handle = await renderUi(page(
      h(PageHeader, { title: 'Weekly Plan', subtitle: 'Three batch meals', actions: h(Button, null, 'Edit') }),
      h(Card, { as: 'section', 'aria-label': 'Totals' }, h(Badge, { tone: 'save' }, 'Saves $4')),
      h('div', { role: 'status' }, h(Skeleton, null)),
      h(EmptyState, { title: 'Nothing Here Yet', description: 'Add an item.', action: h(Button, null, 'Add Item') }),
    ));
    expect(handle.container.querySelector('h1')?.textContent).toBe('Weekly Plan');
    expect(handle.container.querySelector('h2')?.textContent).toBe('Nothing Here Yet');
    expect(q('[aria-hidden="true"].animate-pulse', handle.container)).not.toBeNull();
    await expectNoA11yViolations(handle.container);
  });
  it('EmptyState heading level is configurable and Card forwards refs', async () => {
    const ref = createRef<HTMLElement>();
    handle = await renderUi(page(h(Card, { ref }, 'x'), h(EmptyState, { title: 'Empty', headingLevel: 3 })));
    expect(ref.current).toBeInstanceOf(HTMLElement);
    expect(handle.container.querySelector('h3')?.textContent).toBe('Empty');
  });
});

describe('Banner', () => {
  it('uses role=alert for errors and warnings, status for info', async () => {
    handle = await renderUi(page(h(Banner, { tone: 'error', title: 'Sync failed', children: 'Retry later.' }), h(Banner, { tone: 'warning', children: 'Heads up' }), h(Banner, { children: 'FYI' })));
    expect([...handle.container.querySelectorAll('[role]')].map((el) => el.getAttribute('role'))).toEqual(['alert', 'alert', 'status']);
    await expectNoA11yViolations(handle.container);
  });
  it('dismisses through a named button', async () => {
    const dismiss = vi.fn();
    handle = await renderUi(page(h(Banner, { onDismiss: dismiss, dismissLabel: 'Dismiss notice', children: 'FYI' })));
    await handle.run(() => q<HTMLButtonElement>('button[aria-label="Dismiss notice"]', handle!.container).click());
    expect(dismiss).toHaveBeenCalledOnce();
  });
});

describe('ListRow', () => {
  it('renders static and pressable rows', async () => {
    const click = vi.fn();
    handle = await renderUi(page(h(List, null, h(ListRow, { title: 'Kale', subtitle: '$2.49 / lb', trailing: h(Badge, null, 'Low') }), h(ListRow, { title: 'Open Pantry', onClick: click }))));
    expect(handle.container.querySelectorAll('li').length).toBe(2);
    expect(handle.container.querySelectorAll('button').length).toBe(1);
    await handle.run(() => q<HTMLButtonElement>('button', handle!.container).click());
    expect(click).toHaveBeenCalledOnce();
    await expectNoA11yViolations(handle.container);
  });
});

describe('TabBar and Sidebar', () => {
  const items = [{ id: 'shop', label: 'Shop' }, { id: 'pantry', label: 'Pantry' }, { id: 'plan', label: 'Plan' }];
  function Probe({ Nav }: { Nav: typeof TabBar | typeof Sidebar }) {
    const [current, setCurrent] = useState('shop');
    return h(Nav as typeof TabBar, { label: 'Main', items, current, onSelect: setCurrent });
  }
  it.each([['TabBar', TabBar], ['Sidebar', Sidebar]] as const)('%s marks the current item and switches on activation', async (_name, Nav) => {
    handle = await renderUi(page(h(Probe, { Nav })));
    expect(q('nav', handle.container).getAttribute('aria-label')).toBe('Main');
    const current = () => [...handle!.container.querySelectorAll('button')].filter((b) => b.getAttribute('aria-current') === 'page').map((b) => b.textContent);
    expect(current()).toEqual(['Shop']);
    await handle.run(() => handle!.container.querySelectorAll('button')[2].click());
    expect(current()).toEqual(['Plan']);
    expect(handle.container.querySelectorAll('button.min-h-touch').length).toBe(3);
    await expectNoA11yViolations(handle.container);
  });
});

describe('Sheet', () => {
  function Harness({ onClose = () => undefined, variant }: { onClose?: () => void; variant?: 'sheet' | 'dialog' }) {
    const [open, setOpen] = useState(false);
    return h('main', null,
      h('button', { id: 'opener', onClick: () => setOpen(true) }, 'Open'),
      h(Sheet, { open, onClose: () => { onClose(); setOpen(false); }, title: 'Edit Item', variant,
        children: h('div', null, h('input', { 'aria-label': 'Name', id: 'first' }), h('button', { id: 'last' }, 'Save')) }));
  }
  async function open() {
    const opener = q<HTMLButtonElement>('#opener'); opener.focus();
    await handle!.run(() => opener.click());
    return opener;
  }

  it('renders nothing while closed and an accessible modal dialog when open', async () => {
    handle = await renderUi(h(Harness));
    expect(q('[role=dialog]')).toBeNull();
    await open();
    const dialog = q<HTMLElement>('[role=dialog]');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(document.getElementById(dialog.getAttribute('aria-labelledby')!)?.textContent).toBe('Edit Item');
    await expectNoA11yViolations(dialog);
  });

  it('moves focus inside, locks scroll, and restores both on close', async () => {
    handle = await renderUi(h(Harness));
    const opener = await open();
    expect(document.activeElement).toBe(q('[role=dialog] button[aria-label="Close"]'));
    expect(document.body.style.overflow).toBe('hidden');
    await handle.run(() => key(document.activeElement!, 'Escape'));
    expect(q('[role=dialog]')).toBeNull();
    expect(document.body.style.overflow).toBe('');
    expect(document.activeElement).toBe(opener);
  });

  it('traps Tab and Shift+Tab inside the panel', async () => {
    handle = await renderUi(h(Harness));
    await open();
    const last = q<HTMLElement>('#last'); last.focus();
    expect(key(last, 'Tab').defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(q('[role=dialog] button[aria-label="Close"]'));
    const closeButton = document.activeElement as HTMLElement;
    expect(key(closeButton, 'Tab', { shiftKey: true }).defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(last);
    const first = q<HTMLElement>('#first'); first.focus();
    expect(key(first, 'Tab').defaultPrevented).toBe(false);
  });

  it('closes on backdrop press but not on panel press, and honors initialFocusRef', async () => {
    const onClose = vi.fn(); const target = createRef<HTMLInputElement>();
    function Focused() { return h(Sheet, { open: true, onClose, title: 'Pick', initialFocusRef: target, children: h('input', { ref: target, 'aria-label': 'Search' }) }); }
    handle = await renderUi(h(Focused));
    expect(document.activeElement).toBe(target.current);
    const press = (el: Element) => el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await handle.run(() => press(q('[role=dialog]')));
    expect(onClose).not.toHaveBeenCalled();
    await handle.run(() => press(q('[role=dialog]').parentElement!));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('supports the centered dialog variant', async () => {
    handle = await renderUi(h(Harness, { variant: 'dialog' }));
    await open();
    expect(q('[role=dialog]').parentElement!.className).toContain('items-center');
  });
});
