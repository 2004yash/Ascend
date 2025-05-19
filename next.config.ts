import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ["avatars.githubusercontent.com"],
  },
  experimental: {
    typedRoutes: false,
  },
};

export default nextConfig;
