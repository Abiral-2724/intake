import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Uncomment if you are using server actions, otherwise remove it
    // serverActions: {},
  },
  typescript: {
    ignoreBuildErrors: true,
    
  },
};

export default nextConfig;
