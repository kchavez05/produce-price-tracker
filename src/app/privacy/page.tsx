import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Lock, Database, Trash2 } from 'lucide-react';
import AppFooter from '@/components/AppFooter';

export const metadata: Metadata = {
  title: 'Privacy Policy — PantryBot',
  description:
    'PantryBot Privacy Policy: Strict PII minimization, PostgreSQL Row-Level Security (RLS), zero data brokerage, and self-serve GDPR/CCPA data export and deletion.',
};

export default function PrivacyPolicyPage() {
  return (
    <>
    <main className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-emerald-600" />
          <span>Back to PantryBot Dashboard</span>
        </Link>
      </div>

      <article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 shadow-xs">
        <header className="border-b border-slate-100 pb-6">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Strict PII Minimization &amp; Privacy-First Architecture</span>
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Privacy Policy
          </h1>
          <p className="mt-1.5 text-xs text-slate-500">
            Effective Date: October 19, 2026 • Last Updated: October 19, 2026 (v1.3.0)
          </p>
        </header>

        <div className="mt-6 space-y-6 text-sm leading-relaxed text-slate-700">
          <section>
            <h2 className="text-base font-bold text-slate-900">
              1. Overview &amp; Our Privacy Pledge
            </h2>
            <p className="mt-2">
              <strong>PantryBot</strong> (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or
              &ldquo;the Service&rdquo;), accessible at{' '}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
                pantrybot.dev
              </code>
              , is built on a simple privacy principle:{' '}
              <strong>
                you should not have to surrender your personal identity to find out
                which supermarket has the best price on chuck roast or russet
                potatoes.
              </strong>
            </p>
            <p className="mt-2">
              PantryBot works 100% out-of-the-box in anonymous Guest Mode without
              requiring an account. If you choose to sign in via Single Sign-On
              (Google or Apple) to synchronize your Virtual Pantry and meal-prep
              preferences across devices, we collect only the absolute minimum data
              necessary to operate your account.
            </p>
          </section>

          <section className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                <Lock className="h-4 w-4 text-violet-600" />
                <span>Zero Passwords Stored</span>
              </div>
              <p className="mt-1.5 text-xs text-slate-600">
                Authentication is delegated exclusively to Google OAuth 2.0 and
                Sign in with Apple using PKCE and{' '}
                <code>HttpOnly</code> cookies.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                <Database className="h-4 w-4 text-emerald-600" />
                <span>Row-Level Security</span>
              </div>
              <p className="mt-1.5 text-xs text-slate-600">
                Your Virtual Pantry and store preferences are isolated at the
                PostgreSQL engine level via <code>auth.uid() = user_id</code>.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                <Trash2 className="h-4 w-4 text-rose-600" />
                <span>2-Click Data Purge</span>
              </div>
              <p className="mt-1.5 text-xs text-slate-600">
                Export your entire grocery dataset as portable JSON or permanently
                delete your account at any time from the Account drawer.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900">
              2. Information We Collect
            </h2>
            <ul className="mt-2 list-disc pl-5 space-y-1.5">
              <li>
                <strong>Account Identifiers (Only When Signed In):</strong> When you
                authenticate with Google or Apple SSO, we store an opaque account
                UUID (<code>id</code>), your email address (or Apple Private Relay
                address), an optional display name, and the authentication provider
                name.
              </li>
              <li>
                <strong>Grocery &amp; Meal-Prep Preferences:</strong> Your selected
                5-digit US ZIP code (used solely to query regional supermarket
                circulars), preferred supermarket chains, macro/dietary targets,
                cooking vessel preferences, and Virtual Pantry inventory items. Original legacy inventory records and migration archives remain available for data export and account deletion.
              </li>
              <li>
                <strong>Anonymous Guest Mode Data:</strong> If you use PantryBot
                without signing in, your preferences and checked shopping list items
                remain in your browser&apos;s local storage (<code>localStorage</code>).
              </li>
              <li><strong>AI assistance:</strong> We do not ask for or accept personal AI API keys. When enabled, AI runs only for a verified signed-in account. Explicit requests send the selected recipe and pantry context to OpenAI. Sending a speech recording shares audio for transcription and its transcript for ingredient extraction. PantryBot keeps recordings and transcripts in memory for the request/review, without logging or persisting them. Confirmed pantry changes and explicitly saved recipes use ordinary account storage. OpenAI states API data is not used for training by default. Text sent to the Responses API may be retained in abuse-monitoring logs for up to 30 days; disabling response storage does not remove this retention, and prompt caching may retain application state for up to 24 hours. OpenAI lists no abuse-monitoring or application-state retention for the audio transcription endpoint. We do not claim our account has Zero Data Retention. See <a href="https://developers.openai.com/api/docs/guides/your-data" className="underline">OpenAI’s data controls</a> for provider retention details. Usage controls record account/request IDs, dates and conservative allowance reservations, without storing prompts, recordings or model outputs in the usage ledger.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900">
              3. Information We Never Collect or Sell
            </h2>
            <p className="mt-2">
              We <strong>never</strong> collect physical street addresses, phone
              numbers, government identifiers, payment card information, or precise
              GPS coordinates. We <strong>never sell, rent, or monetize</strong>{' '}
              your email address or grocery shopping habits with data brokers,
              ad networks, or retail partners.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900">
              4. Cookies &amp; Session Security
            </h2>
            <p className="mt-2">
              PantryBot uses strictly necessary authentication session cookies
              configured with <code>HttpOnly</code>, <code>SameSite=Lax</code>, and{' '}
              <code>Secure</code> attributes to keep you signed in safely and
              defend against Cross-Site Scripting (XSS) and Cross-Site Request
              Forgery (CSRF). We do not use third-party advertising or cross-site
              tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900">
              5. Your Privacy Rights (GDPR &amp; CCPA Compliance)
            </h2>
            <p className="mt-2">
              Regardless of where you live, we provide direct self-serve tools in
              the top navigation bar under <strong>Account</strong>:
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-1.5">
              <li>
                <strong>Right to Data Portability:</strong> Click{' '}
                <em>&ldquo;Export My Grocery Data&rdquo;</em> to immediately
                download a complete, machine-readable <code>.json</code> archive of
                your profile, preferences, Virtual Pantry inventory, and saved
                recipes.
              </li>
              <li>
                <strong>Right to Erasure (Right to be Forgotten):</strong> Click{' '}
                <em>&ldquo;Delete Account &amp; Data&rdquo;</em> to permanently and
                irreversibly purge your user record and all associated database rows.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900">
              6. Contact Us
            </h2>
            <p className="mt-2">
              If you have any questions about this Privacy Policy or our data
              security practices, please contact us at{' '}
              <a
                href="mailto:support@pantrybot.dev?subject=PantryBot%20Privacy%20Inquiry"
                className="font-semibold text-emerald-700 underline hover:text-emerald-900"
              >
                support@pantrybot.dev
              </a>
              .
            </p>
          </section>
        </div>
      </article>
    </main>
    <AppFooter />
    </>
  );
}
