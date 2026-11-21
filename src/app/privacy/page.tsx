import type { Metadata } from 'next';
import { ShieldCheck, Lock, Database, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui';
import DocumentShell, { DocLink, DocList, DocSection, InlineCode } from '@/components/document/DocumentShell';

export const metadata: Metadata = {
  title: 'Privacy Policy — PantryBot',
  description:
    'PantryBot Privacy Policy: Strict PII minimization, PostgreSQL Row-Level Security (RLS), zero data brokerage, and self-serve GDPR/CCPA data export and deletion.',
};

export default function PrivacyPolicyPage() {
  return (
    <DocumentShell
      label="Legal"
      badge={(
        <Badge tone="save" className="gap-1.5 px-3 py-1">
          <ShieldCheck aria-hidden="true" className="size-3.5" />
          <span>Strict PII Minimization &amp; Privacy-First Architecture</span>
        </Badge>
      )}
      title="Privacy Policy"
      dates="Effective Date: October 19, 2026 • Last Updated: October 19, 2026 (v1.3.0)"
    >
      <DocSection title="1. Overview &amp; Our Privacy Pledge">
        <p>
          <strong>PantryBot</strong> (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;the Service&rdquo;), accessible at{' '}
          <InlineCode>pantrybot.dev</InlineCode>, is built on a simple privacy principle:{' '}
          <strong>
            you should not have to surrender your personal identity to find out which supermarket has the best price on chuck roast or russet
            potatoes.
          </strong>
        </p>
        <p>
          PantryBot works 100% out-of-the-box in anonymous Guest Mode without requiring an account. If you choose to sign in via Single
          Sign-On (Google or Apple) to synchronize your Virtual Pantry and meal-prep preferences across devices, we collect only the absolute
          minimum data necessary to operate your account.
        </p>
      </DocSection>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-card bg-chip p-4">
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <Lock aria-hidden="true" className="size-4 text-accent" />
            <span>Zero Passwords Stored</span>
          </h2>
          <p className="mt-1.5 text-sm text-muted">
            Authentication is delegated exclusively to Google OAuth 2.0 and Sign in with Apple using PKCE and <InlineCode>HttpOnly</InlineCode>{' '}
            cookies.
          </p>
        </div>
        <div className="rounded-card bg-chip p-4">
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <Database aria-hidden="true" className="size-4 text-save" />
            <span>Row-Level Security</span>
          </h2>
          <p className="mt-1.5 text-sm text-muted">
            Your Virtual Pantry and store preferences are isolated at the PostgreSQL engine level via <InlineCode>auth.uid() = user_id</InlineCode>.
          </p>
        </div>
        <div className="rounded-card bg-chip p-4">
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <Trash2 aria-hidden="true" className="size-4 text-danger" />
            <span>2-Click Data Purge</span>
          </h2>
          <p className="mt-1.5 text-sm text-muted">
            Export your entire grocery dataset as portable JSON or permanently delete your account at any time from Settings, under Account.
          </p>
        </div>
      </section>

      <DocSection title="2. Information We Collect">
        <DocList>
          <li>
            <strong>Account Identifiers (Only When Signed In):</strong> When you authenticate with Google or Apple SSO, we store an opaque
            account UUID (<InlineCode>id</InlineCode>), your email address (or Apple Private Relay address), an optional display name, and the
            authentication provider name.
          </li>
          <li>
            <strong>Grocery &amp; Meal-Prep Preferences:</strong> Your selected 5-digit US ZIP code (used solely to query regional supermarket
            circulars), preferred supermarket chains, macro/dietary targets, cooking vessel preferences, and Virtual Pantry inventory items.
            Original legacy inventory records and migration archives remain available for data export and account deletion.
          </li>
          <li>
            <strong>Anonymous Guest Mode Data:</strong> If you use PantryBot without signing in, your preferences and checked shopping list
            items remain in your browser&apos;s local storage (<InlineCode>localStorage</InlineCode>).
          </li>
          <li>
            <strong>AI assistance:</strong> We do not ask for or accept personal AI API keys. When enabled, AI runs only for a verified signed-in
            account. Explicit requests send the selected recipe and pantry context to OpenAI. Sending a speech recording shares audio for
            transcription and its transcript for ingredient extraction. PantryBot keeps recordings and transcripts in memory for the
            request/review, without logging or persisting them. Confirmed pantry changes and explicitly saved recipes use ordinary account
            storage. OpenAI states API data is not used for training by default. Text sent to the Responses API may be retained in
            abuse-monitoring logs for up to 30 days; disabling response storage does not remove this retention, and prompt caching may retain
            application state for up to 24 hours. OpenAI lists no abuse-monitoring or application-state retention for the audio transcription
            endpoint. We do not claim our account has Zero Data Retention. See{' '}
            <DocLink href="https://developers.openai.com/api/docs/guides/your-data">OpenAI’s data controls</DocLink> for provider retention
            details. Usage controls record account/request IDs, dates and conservative allowance reservations, without storing prompts,
            recordings or model outputs in the usage ledger.
          </li>
        </DocList>
      </DocSection>

      <DocSection title="3. Information We Never Collect or Sell">
        <p>
          We <strong>never</strong> collect physical street addresses, phone numbers, government identifiers, payment card information, or
          precise GPS coordinates. We <strong>never sell, rent, or monetize</strong> your email address or grocery shopping habits with data
          brokers, ad networks, or retail partners.
        </p>
      </DocSection>

      <DocSection title="4. Cookies &amp; Session Security">
        <p>
          PantryBot uses strictly necessary authentication session cookies configured with <InlineCode>HttpOnly</InlineCode>,{' '}
          <InlineCode>SameSite=Lax</InlineCode>, and <InlineCode>Secure</InlineCode> attributes to keep you signed in safely and defend against
          Cross-Site Scripting (XSS) and Cross-Site Request Forgery (CSRF). We do not use third-party advertising or cross-site tracking cookies.
        </p>
      </DocSection>

      <DocSection title="5. Your Privacy Rights (GDPR &amp; CCPA Compliance)">
        <p>
          Regardless of where you live, we provide direct self-serve tools in Settings, under <strong>Account</strong>:
        </p>
        <DocList>
          <li>
            <strong>Right to Data Portability:</strong> Click <em>&ldquo;Export My Grocery Data&rdquo;</em> to immediately download a complete,
            machine-readable <InlineCode>.json</InlineCode> archive of your profile, preferences, Virtual Pantry inventory, and saved recipes.
          </li>
          <li>
            <strong>Right to Erasure (Right to be Forgotten):</strong> Click <em>&ldquo;Delete Account &amp; Data&rdquo;</em> to permanently and
            irreversibly purge your user record and all associated database rows.
          </li>
        </DocList>
      </DocSection>

      <DocSection title="6. Contact Us">
        <p>
          If you have any questions about this Privacy Policy or our data security practices, please contact us at{' '}
          <DocLink href="mailto:support@pantrybot.dev?subject=PantryBot%20Privacy%20Inquiry">support@pantrybot.dev</DocLink>.
        </p>
      </DocSection>
    </DocumentShell>
  );
}
