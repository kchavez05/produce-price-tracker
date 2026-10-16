import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mead, CO Commodity & Meal Prep Value Tracker (80542)',
  description:
    'Tracks King Soopers, Safeway, and USDA Mountain Region wholesale commodity prices to recommend the 3 best-value weekend stews, braises, and casseroles.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 selection:bg-emerald-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
