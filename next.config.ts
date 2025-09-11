import type { NextConfig } from 'next';

// Dynamic import for next-pwa to avoid TypeScript issues
const createPWAConfig = () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const withPWA = require('next-pwa')({
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development',
    runtimeCaching: [
      {
        urlPattern: /^https?.*/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'offlineCache',
          expiration: {
            maxEntries: 200,
          },
        },
      },
    ],
  });
  return withPWA;
};

const nextConfig: NextConfig = {
  // Suppress workspace warning
  outputFileTracingRoot: __dirname,
  
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  
  // Experimental features
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js', 'zod'],
  },
  
  // Turbopack configuration
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(self), geolocation=()',
          },
        ],
      },
    ];
  },
  
  // Environment variables validation
  env: {
    CUSTOM_KEY: 'my-value',
  },
  
  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Audio worklet support
    if (!isServer) {
      config.module.rules.push({
        test: /\.(worklet|worker)\.ts$/,
        use: {
          loader: 'webpack-worker-loader',
          options: {
            name: 'static/[hash].worker.js',
            publicPath: '/_next/',
          },
        },
      });
    }
    
    return config;
  },
};

const withPWA = createPWAConfig();
export default withPWA(nextConfig);