import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Directory probes in the legacy SQLite store can otherwise trace every data file.
  // Next's route matcher supports a negated glob; only the lookup route may ship this pair.
  outputFileTracingExcludes: {
    '!**/api/pantry/barcode-lookup': ['./data/fdc-barcode-index/**/*'],
  },
  outputFileTracingIncludes: {
    '/api/pantry/barcode-lookup': ['./data/fdc-barcode-index/index.sqlite', './data/fdc-barcode-index/manifest.json'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/swagger',
        destination: '/docs',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
