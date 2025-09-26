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
  // Disable React Strict Mode to prevent double mounting in development
  reactStrictMode: false,
  // Disable minification in production for better error debugging
  swcMinify: false,
  // Enable source maps for better error tracking
  productionBrowserSourceMaps: true,
  // Add webpack config for better error reporting
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      config.devtool = 'eval-source-map';
    }
    return config;
  },
}

export default nextConfig