import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mead, CO Meal-Prep & Commodity Value Tracker (80542)',
    short_name: 'Mead Prep',
    description:
      'Compare King Soopers, Safeway, and USDA Mountain Region wholesale prices in Mead, CO (80542) to plan 3 low-cost weekend batch stews, braises, and casseroles.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#059669',
    orientation: 'portrait-primary',
    categories: ['food', 'shopping', 'finance', 'lifestyle'],
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
