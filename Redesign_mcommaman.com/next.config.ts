import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "mcommaman.com", pathname: "/cdn/**" }],
  },
};

export default nextConfig;
