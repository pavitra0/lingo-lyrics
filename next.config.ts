import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "c.saavncdn.com",
      },
      {
        protocol: "https",
        hostname: "www.jiosaavn.com",
      },
      {
        protocol: "https",
        hostname: "pli.saavncdn.com",
      },
    ],
  },
};

export default nextConfig;
