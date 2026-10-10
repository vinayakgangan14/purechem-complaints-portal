/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3', 'node:sqlite', 'exceljs'],
    workerThreads: false,
    cpus: 1,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'better-sqlite3', 'node:sqlite'];
    }
    return config;
  },
};

export default nextConfig;
