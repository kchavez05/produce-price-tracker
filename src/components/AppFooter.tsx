import React from 'react';
import packageMetadata from '../../package.json';
import Link from 'next/link';
import { ChefHat, ShieldCheck, Mail, FileText, Lock, BookOpen } from 'lucide-react';

export default function AppFooter() {
  return (
    <footer className="border-t border-border bg-surface text-xs text-muted no-print">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Brand & Copyright */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 font-bold text-ink hover:text-accent transition"
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-accent text-on-accent">
                <ChefHat className="h-3.5 w-3.5" />
              </span>
              <span>PantryBot</span>
            </Link>
            <span className="text-border-strong">•</span>
            <span className="text-muted">
              &copy; {new Date().getFullYear()} PantryBot. All rights reserved.
            </span>
            <span className="hidden rounded-full bg-save-bg px-2 py-0.5 text-[11px] font-semibold text-save border border-border md:inline-flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              v{packageMetadata.version} AI Meal Prep
            </span>
          </div>

          {/* Legal & Contact Links */}
          <nav
            aria-label="Footer legal and support navigation"
            className="flex flex-wrap items-center gap-4 font-medium text-muted"
          >
            <Link
              href="/privacy"
              className="inline-flex items-center gap-1 hover:text-accent hover:underline transition"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Privacy Policy</span>
            </Link>
            <Link
              href="/terms"
              className="inline-flex items-center gap-1 hover:text-accent hover:underline transition"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Terms &amp; Conditions</span>
            </Link>
            <Link
              href="/data"
              className="inline-flex items-center gap-1 hover:text-accent hover:underline transition"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Explore the data</span>
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center gap-1 hover:text-accent hover:underline transition"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>API Docs</span>
            </Link>
            <a
              href="mailto:support@pantrybot.dev?subject=PantryBot%20Support%20Inquiry"
              className="inline-flex items-center gap-1 hover:text-accent hover:underline transition"
            >
              <Mail className="h-3.5 w-3.5" />
              <span>Contact Support</span>
            </a>
          </nav>
        </div>

        <div className="mt-3 border-t border-border pt-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between text-[11px] text-muted">
          <p>
            Supermarket circular prices, digital coupons, and wholesale club
            benchmarks are provided for informational meal-prep planning. Verify
            final pricing in-store or in your retailer&apos;s loyalty app.
          </p>
          <p className="shrink-0">
            Strict PII Minimization • Never Sold to Data Brokers
          </p>
        </div>
      </div>
    </footer>
  );
}
