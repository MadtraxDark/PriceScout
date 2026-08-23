import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@crawlee/playwright", "playwright"],
};

export default nextConfig;
