import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "placehold.co",
      "res.cloudinary.com",
      "cdn.pixabay.com",
      "images.unsplash.com",
      "uploadthing.com",
      "utfs.io",
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.ufs.sh",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    formats: ["image/avif", "image/webp"], // Tối ưu format ảnh
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60, // Cache ảnh 60 giây
  },
  // Tối ưu build
  compress: true,
  poweredByHeader: false,
};

export default nextConfig;
