/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // <-- necesario para que exista .next/standalone
  images: {
    domains: ['img.youtube.com'],
  },
};

module.exports = nextConfig;