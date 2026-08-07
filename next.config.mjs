/** @type {import("next").NextConfig} */
const nextConfig = {
  // Enable gzip compression for all responses
  compress: true,

  // Optimize production builds
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Optimize imports for large icon/chart libraries
  experimental: {
    optimizePackageImports: ['recharts', 'lucide-react'],
  },

  // HTTP cache headers for static data files
  // 1,000 users all hit the CDN/Vercel Edge — not the server
  async headers() {
    return [
      {
        // Large static data files: cache for 1 hour, revalidate in background
        source: '/data/:file*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
          },
        ],
      },
      {
        // Logo images: cache for 7 days (rarely change)
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, s-maxage=604800, immutable',
          },
        ],
      },
      {
        // API CSAT endpoint: CDN caches for 5 min, stale-while-revalidate 1 min
        source: '/api/v1/csat',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=300, stale-while-revalidate=60',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
