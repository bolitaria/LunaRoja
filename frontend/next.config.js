/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', 
  images: {
    domains: ['img.youtube.com'],
  },
};

module.exports = nextConfig;