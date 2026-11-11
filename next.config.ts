import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
