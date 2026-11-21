// The legal pages (v2.0 M4-8a): /privacy and /terms. Their words are the policy, so these tests pin the content (the sections in order, the
// statements that matter, the links) independently of how the page is laid out; the document shell and tokens (M4-8a) changed the markup
// and not the content, except one explained fix: where the export and delete controls are (Settings, under Account, since M4-2a).
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ back: () => undefined, push: () => undefined }), redirect: vi.fn(), notFound: vi.fn() }));
import PrivacyPage from '@/app/privacy/page';
import TermsPage from '@/app/terms/page';

const html = (page: () => ReturnType<typeof PrivacyPage>) => renderToStaticMarkup(createElement(page));
const text = (markup: string) => markup
  .replace(/<\/?(?:p|h1|h2|h3|li|ul|section|div|header|article|main|span|nav|footer|dl|dt|dd)\b[^>]*>/g, ' ')
  .replace(/<[^>]+>/g, '')
  .replace(/&amp;/g, '&').replace(/&quot;|&ldquo;|&rdquo;|\u201c|\u201d/g, '"').replace(/&#x27;|&apos;|&rsquo;|\u2019/g, "'")
  .replace(/\s+/g, ' ');
const headings = (markup: string, tag: 'h1' | 'h2') => [...markup.matchAll(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'g'))].map((m) => text(m[1]).trim());
const hrefs = (markup: string) => [...markup.matchAll(/href="([^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, '&'));

describe('the privacy policy', () => {
  const markup = html(PrivacyPage);
  const body = text(markup);

  it('is one h1 with the six numbered sections in order', () => {
    expect(headings(markup, 'h1')).toEqual(['Privacy Policy']);
    expect(headings(markup, 'h2').filter((h) => /^\d\./.test(h))).toEqual([
      '1. Overview & Our Privacy Pledge',
      '2. Information We Collect',
      '3. Information We Never Collect or Sell',
      '4. Cookies & Session Security',
      '5. Your Privacy Rights (GDPR & CCPA Compliance)',
      '6. Contact Us',
    ]);
  });

  it('keeps its dates and the three pledges', () => {
    expect(body).toContain('Effective Date: October 19, 2026');
    expect(body).toContain('Last Updated: October 19, 2026 (v1.3.0)');
    for (const pledge of ['Zero Passwords Stored', 'Row-Level Security', '2-Click Data Purge']) expect(body).toContain(pledge);
    expect(body).toContain('auth.uid() = user_id');
  });

  it('keeps the statements about what is collected, never collected, cookies and AI', () => {
    expect(body).toContain('We never collect physical street addresses, phone numbers, government identifiers, payment card information, or precise GPS coordinates.');
    expect(body).toContain('never sell, rent, or monetize your email address');
    expect(body).toContain('HttpOnly, SameSite=Lax, and Secure');
    expect(body).toContain('We do not use third-party advertising or cross-site tracking cookies.');
    expect(body).toContain('We do not claim our account has Zero Data Retention.');
    expect(body).toContain('up to 30 days');
    expect(body).toContain('up to 24 hours');
  });

  it('names the two controls by their exact labels, and says they are in Settings under Account', () => {
    expect(body).toContain('"Export My Grocery Data"');
    expect(body).toContain('"Delete Account & Data"');
    expect(body).toMatch(/in Settings, under Account/);
    expect(body).not.toContain('top navigation bar');
    expect(body).not.toContain('Account drawer');
  });

  it('uses labels that exist on the Settings page', () => {
    const settings = readFileSync(resolve(process.cwd(), 'src/modules/settings/SettingsPage.tsx'), 'utf8');
    expect(settings).toContain('Export My Grocery Data');
    expect(settings).toContain('Delete Account & Data');
  });

  it('links to the privacy contact and the OpenAI data controls', () => {
    expect(hrefs(markup)).toContain('mailto:support@pantrybot.dev?subject=PantryBot%20Privacy%20Inquiry');
    expect(hrefs(markup)).toContain('https://developers.openai.com/api/docs/guides/your-data');
  });
});

describe('the terms and conditions', () => {
  const markup = html(TermsPage);
  const body = text(markup);

  it('is one h1 with the seven numbered sections in order', () => {
    expect(headings(markup, 'h1')).toEqual(['Terms & Conditions']);
    const numbered = [...markup.matchAll(/(\d)\. ([^<]*(?:<[^>]*>[^<]*)*?)(?=<\/(?:h2|span)>)/g)];
    expect(numbered.length).toBeGreaterThan(0);
    for (const title of [
      '1. Acceptance of Terms', '2. Description of Service', '3. Retail Pricing, Digital Coupons & In-Store Availability Disclaimer',
      '4. Nutritional, Macro & Food Safety Disclaimer', '5. User Accounts & Acceptable Use', '6. Limitation of Liability ("As-Is" Warranty)',
      '7. Contact Information',
    ]) expect(body).toContain(title.replace(/\s+/g, ' '));
    const order = ['1. Acceptance', '2. Description', '3. Retail', '4. Nutritional', '5. User Accounts', '6. Limitation', '7. Contact'].map((s) => body.indexOf(s));
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(order.every((i) => i >= 0)).toBe(true);
  });

  it('sets the retail pricing disclaimer apart as a highlighted block, with its title as a heading', () => {
    expect(markup).toMatch(/<section class="[^"]*bg-warning-bg[^"]*"><h2[^>]*>.*3\. Retail Pricing, Digital Coupons &amp; In-Store Availability Disclaimer/);
  });

  it('keeps its dates, the retailer disclaimer, the as-is clause and the links', () => {
    expect(body).toContain('Effective Date: October 19, 2026');
    expect(body).toContain('not affiliated with, endorsed by, or sponsored by');
    expect(body).toContain('THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND');
    expect(markup).toMatch(/<a[^>]*href="\/privacy"[^>]*>Privacy Policy<\/a>/); // the link in section 1, not the footer's
    expect(hrefs(markup)).toContain('mailto:support@pantrybot.dev?subject=PantryBot%20Terms%20Inquiry');
  });
});

describe('both pages', () => {
  it.each([['privacy', PrivacyPage], ['terms', TermsPage]] as const)('%s has the site footer with the legal links', (_name, page) => {
    const markup = html(page);
    expect(markup).toContain('aria-label="Footer legal and support navigation"');
    expect(hrefs(markup)).toEqual(expect.arrayContaining(['/privacy', '/terms', '/data', '/docs']));
  });
});
