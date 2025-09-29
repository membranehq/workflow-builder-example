/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'static.integration.app',
        pathname: '/files/**',
      },
      {
        protocol: 'https',
        hostname: 'static.integration.app',
      },
    ],
  },
}

module.exports = nextConfig
