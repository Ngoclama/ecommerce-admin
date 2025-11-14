import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
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
        hostname: "utfs.io",
      },
      {
        protocol: "https",
        hostname: "uploadthing.com",
      },
    ],
  },
};

export default nextConfig;
