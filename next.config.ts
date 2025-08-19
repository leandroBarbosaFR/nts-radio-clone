/** @type {import('next').NextConfig} */

const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["bcryptjs", "jsonwebtoken"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
      {
        protocol: "https",
        hostname: "pdeaayngkuwtxhoywbwh.supabase.co",
      },
    ],
  },
  // Configuration pour les uploads de fichiers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  webpack: (config: { resolve: { fallback: any } }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
};

module.exports = nextConfig;
