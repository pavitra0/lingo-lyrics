import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

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
      {
        protocol: "https",
        hostname: "static.saavncdn.com",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
