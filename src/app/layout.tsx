import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/next';
import AppFooter from '@/components/AppFooter';
import { themeInitScript } from '@/design/theme';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#059669',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: 'PantryBot — Grocery Deals & Weekend Meal-Prep Value Tracker',
  description:
    'Compare weekly supermarket circulars, digital coupons, and USDA wholesale commodity prices in your zip code to plan 3 low-cost weekend batch stews, braises, and casseroles.',
  applicationName: 'PantryBot',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PantryBot',
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-screen flex-col bg-slate-50 text-slate-900 selection:bg-emerald-600 selection:text-white">
        <div className="flex-1">{children}</div>
        <AppFooter />
        <Analytics />
      </body>
    </html>
  );
}
