// @vitest-environment jsdom
import { createRef, createElement as h, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Button, Checkbox, Chip, IconButton, SegmentedControl, Select, TextField } from '@/components/ui';
import { expectNoA11yViolations, renderUi, setValue, type RenderHandle } from '../../helpers/render';

let handle: RenderHandle | undefined;
afterEach(async () => { await handle?.unmount(); handle = undefined; vi.unstubAllGlobals(); });
const q = <T extends Element>(selector: string) => handle!.container.querySelector(selector) as T;
const page = (...children: unknown[]) => h('main', null, ...(children as never[]));

describe('Button', () => {
  it('defaults to type=button, forwards refs and is a named, accessible control', async () => {
    const ref = createRef<HTMLButtonElement>(); const click = vi.fn();
    handle = await renderUi(page(h(Button, { ref, onClick: click }, 'Save')));
    expect(ref.current).toBe(q('button'));
    expect(q<HTMLButtonElement>('button').type).toBe('button');
    await handle.run(() => ref.current!.click());
    expect(click).toHaveBeenCalledOnce();
    await expectNoA11yViolations(handle.container);
  });
  it('blocks activation and announces busy while loading', async () => {
    const click = vi.fn();
    handle = await renderUi(page(h(Button, { loading: true, onClick: click }, 'Saving')));
    const button = q<HTMLButtonElement>('button');
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
    await handle.run(() => button.click());
    expect(click).not.toHaveBeenCalled();
    expect(button.textContent).toBe('Saving');
  });
  it('supports every variant with a 44px target class', async () => {
    handle = await renderUi(page(...(['primary', 'secondary', 'quiet', 'destructive'] as const).map((variant) => h(Button, { key: variant, variant }, variant))));
    expect(handle.container.querySelectorAll('button.min-h-touch').length).toBe(4);
    await expectNoA11yViolations(handle.container);
  });
});

describe('IconButton', () => {
  it('takes its accessible name from label and hides the icon', async () => {
    const click = vi.fn();
    handle = await renderUi(page(h(IconButton, { label: 'Close', icon: h('svg', { 'data-icon': true }), onClick: click })));
    expect(q('button').getAttribute('aria-label')).toBe('Close');
    expect(q('[aria-hidden="true"]')).not.toBeNull();
    await handle.run(() => q<HTMLButtonElement>('button').click());
    expect(click).toHaveBeenCalledOnce();
    await expectNoA11yViolations(handle.container);
  });
});

describe('TextField', () => {
  it('associates label, hint and error and reports invalid state', async () => {
    handle = await renderUi(page(h(TextField, { label: 'ZIP code', hint: 'Five digits', error: 'Enter a valid ZIP' })));
    const input = q<HTMLInputElement>('input');
    expect(handle.container.querySelector(`label[for="${input.id}"]`)?.textContent).toBe('ZIP code');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    const described = input.getAttribute('aria-describedby')!.split(' ').map((id) => document.getElementById(id)?.textContent);
    expect(described).toEqual(['Five digits', 'Enter a valid ZIP']);
    await expectNoA11yViolations(handle.container);
  });
  it('is valid without hint or error and forwards value changes and refs', async () => {
    const ref = createRef<HTMLInputElement>(); const change = vi.fn();
    handle = await renderUi(page(h(TextField, { label: 'Name', ref, onChange: (e) => change(e.target.value) })));
    expect(q('input').getAttribute('aria-invalid')).toBeNull();
    expect(q('input').getAttribute('aria-describedby')).toBeNull();
    await setValue(handle, ref.current!, 'Kale');
    expect(change).toHaveBeenCalledWith('Kale');
    await expectNoA11yViolations(handle.container);
  });
});

describe('Select', () => {
  it('labels the native select and reports changes', async () => {
    const change = vi.fn();
    handle = await renderUi(page(h(Select, { label: 'Storage location', defaultValue: 'PANTRY', error: 'Required', onChange: (e) => change(e.target.value) },
      h('option', { value: 'PANTRY' }, 'Pantry'), h('option', { value: 'FRIDGE' }, 'Fridge'))));
    const select = q<HTMLSelectElement>('select');
    expect(handle.container.querySelector(`label[for="${select.id}"]`)?.textContent).toBe('Storage location');
    expect(select.getAttribute('aria-invalid')).toBe('true');
    await setValue(handle, select, 'FRIDGE');
    expect(change).toHaveBeenCalledWith('FRIDGE');
    await expectNoA11yViolations(handle.container);
  });
});

describe('Checkbox', () => {
  it('toggles from its label and is controlled-friendly', async () => {
    function Probe() { const [on, setOn] = useState(false); return h(Checkbox, { label: 'Include staples', checked: on, onChange: (e) => setOn(e.target.checked) }); }
    handle = await renderUi(page(h(Probe)));
    const box = q<HTMLInputElement>('input');
    expect(box.checked).toBe(false);
    await handle.run(() => q<HTMLLabelElement>('label').click());
    expect(box.checked).toBe(true);
    await expectNoA11yViolations(handle.container);
  });
  it('can be disabled', async () => {
    handle = await renderUi(page(h(Checkbox, { label: 'Locked', disabled: true })));
    expect(q<HTMLInputElement>('input').disabled).toBe(true);
  });
});

describe('SegmentedControl', () => {
  const options = [{ value: 'system', label: 'System' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }] as const;
  function Probe({ onChange }: { onChange: (v: string) => void }) {
    type Value = (typeof options)[number]['value'];
    const [value, setValue] = useState<Value>('system');
    return h(SegmentedControl, { label: 'Theme', options, value, onChange: (next: string) => { setValue(next as Value); onChange(next); } });
  }
  it('is a named radio group with one checked segment sharing a name', async () => {
    handle = await renderUi(page(h(Probe, { onChange: () => undefined })));
    const group = q('[role="radiogroup"]');
    expect(group.getAttribute('aria-label')).toBe('Theme');
    const radios = [...handle.container.querySelectorAll<HTMLInputElement>('input[type=radio]')];
    expect(radios.map((r) => r.checked)).toEqual([true, false, false]);
    expect(new Set(radios.map((r) => r.name)).size).toBe(1);
    await expectNoA11yViolations(handle.container);
  });
  it('selects a segment on activation and reports it', async () => {
    const change = vi.fn();
    handle = await renderUi(page(h(Probe, { onChange: change })));
    const radios = [...handle.container.querySelectorAll<HTMLInputElement>('input[type=radio]')];
    await handle.run(() => radios[2].click());
    expect(change).toHaveBeenCalledWith('dark');
    expect([...handle.container.querySelectorAll<HTMLInputElement>('input[type=radio]')].map((r) => r.checked)).toEqual([false, false, true]);
  });
});

describe('Chip', () => {
  it('is a toggle with aria-pressed when selected is provided', async () => {
    function Probe() { const [on, setOn] = useState(false); return h(Chip, { selected: on, onClick: () => setOn(!on) }, 'Vegan'); }
    handle = await renderUi(page(h(Probe)));
    expect(q('button').getAttribute('aria-pressed')).toBe('false');
    await handle.run(() => q<HTMLButtonElement>('button').click());
    expect(q('button').getAttribute('aria-pressed')).toBe('true');
    await expectNoA11yViolations(handle.container);
  });
  it('is a plain button when selected is omitted', async () => {
    handle = await renderUi(page(h(Chip, null, 'Filter')));
    expect(q('button').hasAttribute('aria-pressed')).toBe(false);
  });
});
