/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { 
    unoptimized: true,
    domains: ['images.unsplash.com', 'via.placeholder.com']
  },
  env: {
    CUSTOM_KEY: 'my-value',
  },
  webpack:(config) =>{
    config.module.exprContextCritical = false; // Disable critical warnings for dynamic imports
    return config;
  },
};

module.exports = nextConfig;