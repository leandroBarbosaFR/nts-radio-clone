const nextConfig = {
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
};

module.exports = nextConfig;
