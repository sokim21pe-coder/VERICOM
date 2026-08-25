import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 90, 95],
  },
  async redirects() {
    return [
      {
        source: "/auth/login",
        destination: "/login",
        permanent: false,
      },
      {
        source: "/auth/signup",
        destination: "/signup",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
