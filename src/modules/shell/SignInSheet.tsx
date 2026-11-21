'use client';

import Link from 'next/link';
import { Sheet, Button } from '@/components/ui';
import type { AuthProviderType } from '@/types/domain';

// v2.0 M4-6a (spec decision 8): the sign-in sheet, one for every way in: Settings' Sign In, and every "Sign in to use" prompt (the Plan's AI
// Chef, voice entry). It replaces the signed-out half of AccountModal. The two buttons call the same `signInWithProvider` as before
// (Google and Apple single sign-on; no password is ever asked for here), the AI intent keeps its own title, its note, and its
// "unavailable" state when sign-in is not configured, and the privacy facts the old panel stated are kept in plain words. Presentation only:
// the sign-in, callback and sync calls are untouched.
interface Props {
  open: boolean;
  intent: 'account' | 'ai';
  onClose: () => void;
  authLoading: boolean;
  supabaseConfigured: boolean;
  onSignIn: (provider: AuthProviderType) => Promise<void>;
}

export default function SignInSheet({ open, intent, onClose, authLoading, supabaseConfigured, onSignIn }: Props) {
  const ai = intent === 'ai';
  const unavailable = ai && !supabaseConfigured;
  const blocked = authLoading || unavailable;
  return (
    <Sheet
      open={open}
      onClose={onClose}
      closeLabel="Close sign-in"
      title={ai ? 'Sign in to access AI features' : 'Sign In to Sync Your Virtual Pantry & Preferences'}
    >
      <div className="space-y-4 text-sm text-ink">
        <p>
          {ai
            ? 'AI assistance requires a verified signed-in account. Standard suggestions and manual pantry entry remain available.'
            : 'Sign in to back up your Virtual Pantry, My Stores filter and Macro and Dietary profile across your phone, tablet and desktop.'}
        </p>
        {unavailable && (
          <p role="status" className="rounded-control bg-warning-bg p-3 text-warning">
            Sign-in for AI is unavailable right now. You can still use manual pantry entry and standard suggestions.
          </p>
        )}

        <div className="space-y-2">
          <Button variant="secondary" className="w-full" disabled={blocked} onClick={() => void onSignIn('google')}>
            <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z" />
              <path fill="#FBBC05" d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z" />
            </svg>
            <span>{authLoading ? 'Connecting...' : 'Continue with Google'}</span>
          </Button>
          {/* The Apple button follows Apple's guidelines: a solid black button with white text, white with dark text in a dark theme (Ticket #30). The overrides are important (`!`) because the secondary variant sets its own background, text and border at the same specificity. */}
          <Button variant="secondary" className="w-full border-ink! bg-ink! text-bg!" disabled={blocked} onClick={() => void onSignIn('apple')}>
            <svg className="size-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            <span>{authLoading ? 'Connecting...' : 'Sign in with Apple'}</span>
          </Button>
        </div>

        <p className="text-xs text-muted">
          By signing in, you agree to our{' '}
          <Link href="/privacy" className="font-semibold text-accent underline">Privacy Policy</Link>
          {' '}and{' '}
          <Link href="/terms" className="font-semibold text-accent underline">Terms</Link>.
        </p>

        <section aria-label="What we keep" className="space-y-2 rounded-card bg-chip p-4 text-xs text-ink">
          <p><strong>Minimal data.</strong> We store an opaque account ID, your email address and your grocery preferences. No passwords, street addresses or phone numbers.</p>
          <p><strong>Private by design.</strong> Every pantry entry and preference row is isolated to your account at the database (row-level security).</p>
          <p><strong>Yours to take or delete.</strong> Download a complete copy of your data, or delete your account and data, from Settings at any time.</p>
          <p><strong>Guest mode is always available.</strong> You can keep using PantryBot without an account for manual pantry entry and standard suggestions.</p>
        </section>
      </div>
    </Sheet>
  );
}
