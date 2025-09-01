/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Enable performance optimizations
  reactStrictMode: true,
  poweredByHeader: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Enable Turbopack for faster compilation
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
    // Additional performance optimizations
    optimizeCss: true,
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
  },
  // Webpack optimizations for faster builds
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
    }
    return config
  },
}

module.exports = nextConfig