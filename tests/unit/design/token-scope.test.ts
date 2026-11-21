// @vitest-environment jsdom
// TokenScope (v2.0 M4-7a): a page opts into the design tokens' color scheme while it is on screen, and only then.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import TokenScope from '@/design/TokenScope';

afterEach(() => { document.documentElement.removeAttribute('data-ds'); vi.unstubAllGlobals(); });

describe('TokenScope', () => {
  it('sets data-ds on <html> while mounted and removes it on unmount, rendering nothing', async () => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    expect(document.documentElement.hasAttribute('data-ds')).toBe(false);
    await act(async () => { root.render(createElement(TokenScope)); });
    expect(document.documentElement.hasAttribute('data-ds')).toBe(true);
    expect(container.innerHTML).toBe('');
    await act(async () => { root.unmount(); });
    expect(document.documentElement.hasAttribute('data-ds')).toBe(false);
    container.remove();
  });
});
