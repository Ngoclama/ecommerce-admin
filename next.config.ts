import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ===== Performance & Production =====
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false, // Disable source maps in production

  // ===== Image Optimization =====
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 3600, // Cache images for 1 hour
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "cdn.pixabay.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "uploadthing.com" },
      { protocol: "https", hostname: "utfs.io" },
      { protocol: "https", hostname: "**.ufs.sh" },
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "images.clerk.dev" },
    ],
  },

  // ===== Experimental Features for Performance =====
  experimental: {
    optimizePackageImports: [
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-dialog",
      "@radix-ui/react-select",
      "@radix-ui/react-tabs",
      "@radix-ui/react-checkbox",
      "@tanstack/react-query",
      "@tanstack/react-table",
      "lucide-react",
      "date-fns",
    ],
  },

  // ===== Turbopack Configuration =====
  turbopack: {
    root: "../",
  },
};

export default nextConfig;
