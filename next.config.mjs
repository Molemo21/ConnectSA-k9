/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use standard .next folder - OneDrive already handles this well
  // If you see file lock errors, run: node scripts/clean-next-build.js
  // To exclude from OneDrive: Right-click folder > OneDrive > Always keep on this device
  distDir: '.next',
  // Externalize Node.js modules for server components
  // Note: serverComponentsExternalPackages moved to experimental in Next.js 14.2+
  experimental: {
    serverComponentsExternalPackages: ['web-push'],
  },
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
  webpack: (config, { dev }) => {
    if (dev) {
      config.devtool = 'eval-source-map';
      
      // Add ignore patterns for webpack watching to reduce file system pressure
      // Note: Console.error override in server.js handles OneDrive errors
      try {
        // Safely extract existing ignored patterns
        let existingIgnored = [];
        if (config.watchOptions && Array.isArray(config.watchOptions.ignored)) {
          existingIgnored = [...config.watchOptions.ignored];
        }
        
        // Create new ignored patterns array
        const ignoredPatterns = [
          ...existingIgnored,
          '**/.next/**',
          '**/node_modules/**'
        ];
        
        // Create completely new watchOptions object (don't spread potentially frozen object)
        const newWatchOptions = {};
        
        // Safely copy other watchOptions properties if they exist and are accessible
        if (config.watchOptions) {
          try {
            Object.keys(config.watchOptions).forEach(key => {
              if (key !== 'ignored') {
                try {
                  newWatchOptions[key] = config.watchOptions[key];
                } catch {
                  // Skip read-only properties
                }
              }
            });
          } catch {
            // If watchOptions is frozen, just create a new one
          }
        }
        
        // Set the ignored patterns
        newWatchOptions.ignored = ignoredPatterns;
        
        // Assign the new object (this replaces, not modifies)
        config.watchOptions = newWatchOptions;
      } catch {
        // Fallback: create minimal watchOptions if anything fails
        config.watchOptions = {
          ignored: ['**/.next/**', '**/node_modules/**']
        };
      }
      
      // Reduce webpack logging verbosity in development
      try {
        if (config.stats) {
          config.stats = {
            ...config.stats,
            errorDetails: false,
            warnings: false
          };
        } else {
          config.stats = {
            errorDetails: false,
            warnings: false
          };
        }
      } catch {
        // If stats is read-only, create new object
        config.stats = {
          errorDetails: false,
          warnings: false
        };
      }
    }
    return config;
  },
  // Allow local dev origins to avoid noisy dev warnings
  // Note: Next.js allowedDevOrigins is for dev server access patterns
  // The warning can be safely ignored in development
}

export default nextConfig