/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'drive.google.com',
      },
    ],
  },
  // firebase-admin (lewat jwks-rsa -> jose) memakai ESM murni yang bentrok
  // dengan bundling webpack default Next.js untuk API routes. Jadikan
  // external agar dimuat langsung oleh Node.js saat runtime.
  experimental: {
    serverComponentsExternalPackages: ['firebase-admin'],
  },
};

module.exports = nextConfig;
