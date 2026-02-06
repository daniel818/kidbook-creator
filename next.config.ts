import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',

  // Image optimization settings
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
    ],
  },

  // Disable x-powered-by header for security
  poweredByHeader: false,

  // Enable React strict mode
  reactStrictMode: true,
};

export default withSentryConfig(nextConfig, {
  // Sentry webpack plugin options
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only upload source maps in production builds
  silent: !process.env.CI,

  // Automatically tree-shake Sentry logger statements
  disableLogger: true,

  // Hide source maps from clients
  hideSourceMaps: true,

  // Tunnel Sentry events to avoid ad-blockers (optional)
  // tunnelRoute: '/monitoring-tunnel',
});
