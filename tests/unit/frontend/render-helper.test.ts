// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { checkA11y, expectNoA11yViolations, renderUi, type RenderHandle } from '../../helpers/render';

let handle: RenderHandle | undefined;
afterEach(async () => {
  await handle?.unmount();
  handle = undefined;
  vi.unstubAllGlobals();
});

describe('renderUi', () => {
  it('renders, re-renders and unmounts cleanly', async () => {
    handle = await renderUi(createElement('p', null, 'first'));
    expect(handle.container.textContent).toBe('first');
    await handle.render(createElement('p', null, 'second'));
    expect(handle.container.textContent).toBe('second');
    await handle.unmount();
    expect(document.body.contains(handle.container)).toBe(false);
    await handle.unmount();
  });

  it('flushes state updates triggered by an action', async () => {
    handle = await renderUi(createElement('button', { type: 'button', onClick: () => undefined }, 'Go'));
    const click = vi.fn();
    handle.container.querySelector('button')!.addEventListener('click', click);
    await handle.run(() => handle!.container.querySelector('button')!.click());
    expect(click).toHaveBeenCalledOnce();
  });
});

describe('accessibility check', () => {
  it('passes a labelled control', async () => {
    handle = await renderUi(
      createElement('main', null, createElement('label', { htmlFor: 'q' }, 'Search'), createElement('input', { id: 'q', type: 'text' })),
    );
    await expectNoA11yViolations(handle.container);
  });

  it('reports an unlabelled control with a readable message', async () => {
    handle = await renderUi(createElement('main', null, createElement('input', { type: 'text' })));
    const violations = await checkA11y(handle.container);
    expect(violations.map((violation) => violation.id)).toContain('label');
    await expect(expectNoA11yViolations(handle.container)).rejects.toThrow(/Accessibility violations/);
  });
});
