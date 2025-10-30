/** @type {import('next').NextConfig} */
const nextConfig = {
  // Write build artifacts to a fresh directory to avoid stale OneDrive locks
  distDir: '.next-dev',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Disable React Strict Mode to prevent double mounting in development
  reactStrictMode: false,
  // Use SWC minifier (Next.js default) to avoid deprecation warnings
  swcMinify: true,
  // Enable source maps for better error tracking
  productionBrowserSourceMaps: true,
  // Add webpack config for better error reporting
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      config.devtool = 'eval-source-map';
    }
    return config;
  },
  // Allow local dev origins to avoid noisy dev warnings
  allowedDevOrigins: ['http://localhost:3000', 'http://localhost:3001']
}

export default nextConfig