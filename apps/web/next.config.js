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

  webpack: (config) => {
    if (config.name === 'server') {
      // Disable minification for server builds to avoid temporal build errors
      config.optimization.minimize = false
    }
    return config
  },

  // Disable SWC minification for production builds when using turbopack
  // This applies to both webpack and turbopack
  swcMinify: false,
}

export default nextConfig
