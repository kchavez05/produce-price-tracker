import type { Metadata } from 'next';
import { FileText } from 'lucide-react';
import { Badge } from '@/components/ui';
import DocumentShell, { DocCallout, DocLink, DocSection, InlineCode } from '@/components/document/DocumentShell';

export const metadata: Metadata = {
  title: 'Terms & Conditions — PantryBot',
  description:
    'PantryBot Terms & Conditions: Service usage guidelines, supermarket circular price and coupon accuracy disclaimers, and limitation of liability.',
};

export default function TermsAndConditionsPage() {
  return (
    <DocumentShell
      label="Legal"
      badge={(
        <Badge tone="neutral" className="gap-1.5 px-3 py-1">
          <FileText aria-hidden="true" className="size-3.5" />
          <span>Terms of Service &amp; Retailer Disclaimers</span>
        </Badge>
      )}
      title="Terms &amp; Conditions"
      dates="Effective Date: October 19, 2026 • Last Updated: October 19, 2026 (v1.3.0)"
    >
      <DocSection title="1. Acceptance of Terms">
        <p>
          By accessing or using <strong>PantryBot</strong> (accessible at <InlineCode>pantrybot.dev</InlineCode>), you agree to be bound by these
          Terms &amp; Conditions and our <DocLink href="/privacy">Privacy Policy</DocLink>. If you do not agree to these terms, please
          discontinue use of the Service.
        </p>
      </DocSection>

      <DocSection title="2. Description of Service">
        <p>
          PantryBot is an informational grocery price comparison, Virtual Pantry availability tracking, and weekend batch meal-prep planning
          companion. The Service aggregates publicly advertised weekly supermarket circulars, USDA commodity reports, and wholesale club unit
          price baselines to estimate batch recipe costs and store basket totals.
        </p>
      </DocSection>

      <DocCallout title="3. Retail Pricing, Digital Coupons &amp; In-Store Availability Disclaimer">
        <p>
          PantryBot is an independent consumer utility and is <strong>not affiliated with, endorsed by, or sponsored by</strong> The Kroger Co.
          (King Soopers, Ralphs, Fred Meyer, Fry&apos;s), Albertsons Companies (Safeway, Vons, Jewel-Osco), ALDI, Walmart, Target, Sprouts
          Farmers Market, Costco Wholesale, Sam&apos;s Club, or Instacart. All retailer names and trademarks belong to their respective owners.
        </p>
        <p>
          Advertised sale prices, multi-buy requirements, digital loyalty coupons, and stock availability are determined solely by individual
          retailers and may vary by store location or change without notice. Always verify final shelf prices and clip required digital coupons
          in your retailer&apos;s official app prior to checkout.
        </p>
      </DocCallout>

      <DocSection title="4. Nutritional, Macro &amp; Food Safety Disclaimer">
        <p>
          Calorie, protein, carbohydrate, fat, and dietary tag classifications (such as Gluten-Free, Dairy-Free, Nut-Free, or Low-Carb/Keto)
          are automated estimates based on standard USDA ingredient profiles. Always inspect manufacturer food labels for allergens and follow
          USDA safe food handling, cooking temperature, and freezer storage guidelines.
        </p>
      </DocSection>

      <DocSection title="5. User Accounts &amp; Acceptable Use">
        <p>
          You may use PantryBot anonymously or sign in using Google or Apple Single Sign-On (SSO). You agree not to abuse API endpoints, bypass
          rate limits, or attempt unauthorized access to other users&apos; data. We reserve the right to rate-limit or suspend automated
          traffic that degrades service stability.
        </p>
      </DocSection>

      <DocSection title="6. Limitation of Liability (&ldquo;As-Is&rdquo; Warranty)">
        <p>
          THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
          IN NO EVENT SHALL PANTRYBOT OR ITS CREATORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES ARISING FROM PRICING
          DISCREPANCIES, OUT-OF-STOCK ITEMS, OR RELIANCE ON INFORMATION PROVIDED BY THE SERVICE.
        </p>
      </DocSection>

      <DocSection title="7. Contact Information">
        <p>
          Questions regarding these Terms &amp; Conditions may be directed to{' '}
          <DocLink href="mailto:support@pantrybot.dev?subject=PantryBot%20Terms%20Inquiry">support@pantrybot.dev</DocLink>.
        </p>
      </DocSection>
    </DocumentShell>
  );
}
