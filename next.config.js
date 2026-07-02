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
  // @react-pdf/renderer juga ESM murni — perlu esmExternals: 'loose' agar
  // bisa di-dynamic-import dari komponen client.
  experimental: {
    serverComponentsExternalPackages: ['firebase-admin'],
    esmExternals: 'loose',
  },
};

module.exports = nextConfig;
