import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@siteflow/shared'],
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@siteflow/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
    };
    return config;
  },
};

export default nextConfig;
