// Shared component-test helper for jsdom tests (v2.0 M1 batch 0).
// Wraps the createRoot + act pattern and adds an axe-core accessibility check.
// Test files must still declare `// @vitest-environment jsdom`.
import { act, createElement, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { vi } from 'vitest';
import axe from 'axe-core';

export interface RenderHandle {
  container: HTMLDivElement;
  root: Root;
  /** Run an action inside act() and let pending microtasks and timers settle. */
  run: (action: () => unknown) => Promise<void>;
  /** Render (or re-render) an element into the container. */
  render: (element: ReactElement) => Promise<void>;
  unmount: () => Promise<void>;
}

const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

export async function renderUi(element?: ReactElement): Promise<RenderHandle> {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  let mounted = true;
  const run = async (action: () => unknown) => {
    await act(async () => {
      await action();
      await settle();
    });
  };
  const handle: RenderHandle = {
    container,
    root,
    run,
    render: (next) => run(() => root.render(next)),
    unmount: async () => {
      if (mounted) {
        mounted = false;
        await run(() => root.unmount());
      }
      container.remove();
    },
  };
  if (element) await handle.render(element);
  return handle;
}

export { createElement };

export interface A11yViolation {
  id: string;
  impact: string | null | undefined;
  help: string;
  targets: string[];
}

/**
 * Run axe-core against a rendered subtree and return its violations.
 * jsdom has no layout or paint, so `color-contrast` is disabled here; contrast is
 * covered by the token contrast unit test (M1 batch 1), not by axe.
 */
export async function checkA11y(container: Element): Promise<A11yViolation[]> {
  const results = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false } },
  });
  return results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    help: violation.help,
    targets: violation.nodes.map((node) => node.target.join(' ')),
  }));
}

/** Assert no axe violations, with a readable failure message. */
export async function expectNoA11yViolations(container: Element): Promise<void> {
  const violations = await checkA11y(container);
  if (violations.length > 0) {
    const detail = violations
      .map((violation) => `${violation.id} (${violation.impact ?? 'n/a'}): ${violation.help} -> ${violation.targets.join(', ')}`)
      .join('\n');
    throw new Error(`Accessibility violations:\n${detail}`);
  }
}

/** Set a text input's or select's value the way React expects, and fire the matching event. */
export async function setValue(handle: RenderHandle, element: HTMLInputElement | HTMLSelectElement, value: string): Promise<void> {
  const proto = element instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  await handle.run(() => {
    Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(element, value);
    element.dispatchEvent(new Event(element instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }));
  });
}
