// @vitest-environment jsdom
// The sign-in sheet (v2.0 M4-6a, spec decision 8): one sheet for Settings' Sign In and every "Sign in to use" prompt. It calls the same
// provider sign-in as the old panel; this file pins its wording and states, including the two safety cases the old panel was tested for
// (a local or demo profile is never a dead end, and an AI sign-in is never offered when it is not configured).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement, type ComponentProps } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import SignInSheet from '@/modules/shell/SignInSheet';
import { expectNoA11yViolations } from 'tests/helpers/render';

let root: Root;
let container: HTMLDivElement;
const onSignIn = vi.fn(async () => undefined);
const onClose = vi.fn();
async function run(action: () => unknown) { await act(async () => { await action(); }); }
async function render(overrides: Partial<ComponentProps<typeof SignInSheet>> = {}) {
  await run(() => root.render(createElement(SignInSheet, { open: true, intent: 'account', onClose, authLoading: false, supabaseConfigured: true, onSignIn, ...overrides })));
}
const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]')!;
const button = (label: string) => [...dialog().querySelectorAll('button')].find((b) => b.textContent === label)!;
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.clearAllMocks();
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await run(() => root.unmount()); container.remove(); vi.unstubAllGlobals(); });

describe('the account intent', () => {
  it('is a dialog titled for syncing, with one-tap Google and Apple and no password field', async () => {
    await render();
    expect(dialog().getAttribute('aria-labelledby')).toBeTruthy();
    expect(dialog().querySelector('h2')!.textContent).toBe('Sign In to Sync Your Virtual Pantry & Preferences');
    expect(dialog().textContent).toContain('back up your Virtual Pantry, My Stores filter and Macro and Dietary profile');
    expect([...dialog().querySelectorAll('button')].map((b) => b.textContent)).toEqual(['', 'Continue with Google', 'Sign in with Apple']);
    expect(dialog().querySelector('input[type=password]')).toBeNull();
  });

  it('signs in with the provider that was chosen, and only that one', async () => {
    await render();
    await run(() => button('Continue with Google').click());
    expect(onSignIn).toHaveBeenCalledTimes(1);
    expect(onSignIn).toHaveBeenLastCalledWith('google');
    await run(() => button('Sign in with Apple').click());
    expect(onSignIn).toHaveBeenLastCalledWith('apple');
    expect(onSignIn).toHaveBeenCalledTimes(2);
  });

  it('keeps the privacy facts, the links and the promise that guest mode stays', async () => {
    await render();
    const links = [...dialog().querySelectorAll('a')];
    expect(links.map((a) => [a.textContent, a.getAttribute('href')])).toEqual([['Privacy Policy', '/privacy'], ['Terms', '/terms']]);
    const facts = dialog().querySelector('section[aria-label="What we keep"]')!;
    expect(facts.textContent).toContain('No passwords, street addresses or phone numbers.');
    expect(facts.textContent).toContain('row-level security');
    expect(facts.textContent).toContain('delete your account and data, from Settings at any time');
    expect(facts.textContent).toContain('Guest mode is always available.');
  });

  it('closes from its close button and on Escape', async () => {
    await render();
    await run(() => dialog().querySelector<HTMLButtonElement>('button[aria-label="Close sign-in"]')!.click());
    expect(onClose).toHaveBeenCalledTimes(1);
    await run(() => { button('Continue with Google').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); });
    expect(onClose.mock.calls.length).toBeGreaterThan(1);
  });

  it('is not there when it is closed', async () => {
    await render({ open: false });
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it('is blocked while a sign-in is under way, and says it is connecting', async () => {
    await render({ authLoading: true });
    expect(button('Connecting...')).toBeDefined();
    expect([...dialog().querySelectorAll('button')].filter((b) => b.textContent === 'Connecting...').every((b) => (b as HTMLButtonElement).disabled)).toBe(true);
    expect(dialog().textContent).not.toContain('Continue with Google');
  });

  it('is still offered when sign-in is not configured, as it was before (only the AI intent is blocked)', async () => {
    await render({ supabaseConfigured: false });
    expect((button('Continue with Google') as HTMLButtonElement).disabled).toBe(false);
    expect(dialog().textContent).not.toContain('unavailable');
  });
});

describe('the AI intent', () => {
  it('is titled for AI and says what AI needs, and standard suggestions stay available', async () => {
    await render({ intent: 'ai' });
    expect(dialog().querySelector('h2')!.textContent).toBe('Sign in to access AI features');
    expect(dialog().textContent).toContain('AI assistance requires a verified signed-in account. Standard suggestions and manual pantry entry remain available.');
    expect(dialog().textContent).not.toContain('Gemini');
  });

  it('does not leave a local demo profile in a dead end: signing in still works when AI sign-in is configured', async () => {
    await render({ intent: 'ai', supabaseConfigured: true });
    await run(() => button('Continue with Google').click());
    expect(onSignIn).toHaveBeenCalledOnce();
    expect(dialog().textContent).not.toContain('unavailable right now');
  });

  it('does not present local or demo OAuth as verified AI access when cloud auth is missing', async () => {
    await render({ intent: 'ai', supabaseConfigured: false });
    expect((button('Continue with Google') as HTMLButtonElement).disabled).toBe(true);
    expect((button('Sign in with Apple') as HTMLButtonElement).disabled).toBe(true);
    expect(dialog().querySelector('[role=status]')!.textContent).toContain('Sign-in for AI is unavailable right now. You can still use manual pantry entry and standard suggestions.');
    await run(() => button('Continue with Google').click());
    expect(onSignIn).not.toHaveBeenCalled();
  });
});

describe('the buttons', () => {
  it('makes the Apple button a solid ink button, as Apple\'s guidelines ask, and Google a plain one', async () => {
    await render();
    expect(button('Sign in with Apple').className).toContain('bg-ink!');
    expect(button('Sign in with Apple').className).toContain('text-bg!');
    expect(button('Continue with Google').className).not.toContain('bg-ink!');
    expect(button('Sign in with Apple').querySelector('svg')!.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('accessibility', () => {
  it('has no violations, in each state', async () => {
    await render();
    await expectNoA11yViolations(dialog());
    await render({ intent: 'ai', supabaseConfigured: false });
    await expectNoA11yViolations(dialog());
    await render({ authLoading: true });
    await expectNoA11yViolations(dialog());
  });
});
