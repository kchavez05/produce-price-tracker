import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText, ArrowLeft, AlertCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms & Conditions — PantryBot',
  description:
    'PantryBot Terms & Conditions: Service usage guidelines, supermarket circular price and coupon accuracy disclaimers, and limitation of liability.',
};

export default function TermsAndConditionsPage() {
  return (
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
          <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-800 border border-slate-200">
            <FileText className="h-3.5 w-3.5 text-emerald-600" />
            <span>Terms of Service &amp; Retailer Disclaimers</span>
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Terms &amp; Conditions
          </h1>
          <p className="mt-1.5 text-xs text-slate-500">
            Effective Date: October 19, 2026 • Last Updated: October 19, 2026 (v1.3.0)
          </p>
        </header>

        <div className="mt-6 space-y-6 text-sm leading-relaxed text-slate-700">
          <section>
            <h2 className="text-base font-bold text-slate-900">
              1. Acceptance of Terms
            </h2>
            <p className="mt-2">
              By accessing or using <strong>PantryBot</strong> (accessible at{' '}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
                pantrybot.dev
              </code>
              ), you agree to be bound by these Terms &amp; Conditions and our{' '}
              <Link
                href="/privacy"
                className="font-semibold text-emerald-700 underline hover:text-emerald-900"
              >
                Privacy Policy
              </Link>
              . If you do not agree to these terms, please discontinue use of the
              Service.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900">
              2. Description of Service
            </h2>
            <p className="mt-2">
              PantryBot is an informational grocery price comparison, Virtual
              Pantry availability tracking, and weekend batch meal-prep planning companion. The
              Service aggregates publicly advertised weekly supermarket circulars,
              USDA commodity reports, and wholesale club unit price baselines to
              estimate batch recipe costs and store basket totals.
            </p>
          </section>

          <section className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
            <div className="flex items-center gap-2 font-bold text-amber-950 text-sm">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>
                3. Retail Pricing, Digital Coupons &amp; In-Store Availability
                Disclaimer
              </span>
            </div>
            <p className="mt-2 text-xs text-amber-900 leading-relaxed">
              PantryBot is an independent consumer utility and is{' '}
              <strong>not affiliated with, endorsed by, or sponsored by</strong>{' '}
              The Kroger Co. (King Soopers, Ralphs, Fred Meyer, Fry&apos;s),
              Albertsons Companies (Safeway, Vons, Jewel-Osco), ALDI, Walmart,
              Target, Sprouts Farmers Market, Costco Wholesale, Sam&apos;s Club, or
              Instacart. All retailer names and trademarks belong to their
              respective owners.
            </p>
            <p className="mt-1.5 text-xs text-amber-900 leading-relaxed">
              Advertised sale prices, multi-buy requirements, digital loyalty
              coupons, and stock availability are determined solely by individual
              retailers and may vary by store location or change without notice.
              Always verify final shelf prices and clip required digital coupons in
              your retailer&apos;s official app prior to checkout.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900">
              4. Nutritional, Macro &amp; Food Safety Disclaimer
            </h2>
            <p className="mt-2">
              Calorie, protein, carbohydrate, fat, and dietary tag classifications
              (such as Gluten-Free, Dairy-Free, Nut-Free, or Low-Carb/Keto) are
              automated estimates based on standard USDA ingredient profiles.
              Always inspect manufacturer food labels for allergens and follow USDA
              safe food handling, cooking temperature, and freezer storage
              guidelines.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900">
              5. User Accounts &amp; Acceptable Use
            </h2>
            <p className="mt-2">
              You may use PantryBot anonymously or sign in using Google or Apple
              Single Sign-On (SSO). You agree not to abuse API endpoints, bypass
              rate limits, or attempt unauthorized access to other users&apos; data.
              We reserve the right to rate-limit or suspend automated traffic that
              degrades service stability.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900">
              6. Limitation of Liability (&ldquo;As-Is&rdquo; Warranty)
            </h2>
            <p className="mt-2">
              THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS
              AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
              IMPLIED. IN NO EVENT SHALL PANTRYBOT OR ITS CREATORS BE LIABLE FOR
              ANY INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES ARISING FROM
              PRICING DISCREPANCIES, OUT-OF-STOCK ITEMS, OR RELIANCE ON INFORMATION
              PROVIDED BY THE SERVICE.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900">
              7. Contact Information
            </h2>
            <p className="mt-2">
              Questions regarding these Terms &amp; Conditions may be directed to{' '}
              <a
                href="mailto:support@pantrybot.dev?subject=PantryBot%20Terms%20Inquiry"
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
  );
}
