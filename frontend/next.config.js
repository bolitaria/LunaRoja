/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.alias["lodash-es"] = "lodash";
    return config;
  },
  output: 'standalone',

  async rewrites() {
    // Use the public API URL if set, otherwise default to the Docker service name
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://backend:5000';
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${backendUrl}/uploads/:path*`,
      },
    ];
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },

  images: {
    remotePatterns: [
      // Servidor local (desarrollo)
      { protocol: 'http', hostname: 'localhost', port: '5000', pathname: '/uploads/**' },
      { protocol: 'http', hostname: '127.0.0.1', port: '5000', pathname: '/uploads/**' },
      { protocol: 'http', hostname: 'host.docker.internal', port: '5000', pathname: '/uploads/**' },
      // YouTube (thumbnail)
      { protocol: 'https', hostname: 'img.youtube.com', pathname: '/**' },
    ],
  },
};

module.exports = nextConfig;
