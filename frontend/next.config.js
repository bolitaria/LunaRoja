/** @type {import('next').NextConfig} */

const isProduction = process.env.NODE_ENV === 'production';
const API_HOST = process.env.NEXT_PUBLIC_API_HOST || 'tudominio.org';  // Cambia por tu dominio
const API_PORT = process.env.NEXT_PUBLIC_API_PORT || '443';            // HTTPS por defecto
const PROTOCOL = isProduction ? 'https' : 'http';

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',

  // Cabeceras de seguridad (recomendadas para HTTPS)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
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
        ],
      },
    ];
  },

  images: {
    remotePatterns: [
      // Desarrollo local (HTTP)
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '5000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'host.docker.internal',
        port: '5000',
        pathname: '/uploads/**',
      },

      // Producción (HTTPS)
      {
        protocol: 'https',
        hostname: API_HOST,
        port: API_PORT,
        pathname: '/uploads/**',
      },
    ],
    domains: ['img.youtube.com'],  // se mantiene
  },
};

module.exports = nextConfig;