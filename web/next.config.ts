import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // Enable for optimized Docker builds
  images: {
    // The API already stores resized .webp variants (thumbnail/medium/large),
    // and the server-side optimizer cannot reach the upload host from inside its
    // container. Serve the pre-optimized files directly instead of re-optimizing.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8080",
        pathname: "/uploads/**",
      },
      {
        // Images served through nginx on the default port (http://localhost/uploads/...)
        protocol: "http",
        hostname: "localhost",
        port: "",
        pathname: "/uploads/**",
      },
      {
        // Same, over HTTPS once a certificate/domain is in place
        protocol: "https",
        hostname: "localhost",
        port: "",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "api",
        port: "8080",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "nginx",
        port: "",
        pathname: "/uploads/**",
      },
    ],
  },
  // Enable experimental features if needed
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;

