/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'images.openfoodfacts.org' },
      { protocol: 'https', hostname: '**.unsplash.com' },
    ],
    unoptimized: true,
  },
  // Allow large catalog file to be bundled
  experimental: {
    serverComponentsExternalPackages: [],
  },
};

module.exports = nextConfig;

