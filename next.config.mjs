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
  // Enable development mode for better error reporting
  reactStrictMode: true,
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