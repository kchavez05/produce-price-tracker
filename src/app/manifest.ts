import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PantryBot — Grocery Deals & Meal-Prep Value Tracker',
    short_name: 'PantryBot',
    description:
      'Compare weekly supermarket circulars, digital coupons, and USDA wholesale prices in your zip code to plan 3 low-cost weekend batch stews, braises, and casseroles.',
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
