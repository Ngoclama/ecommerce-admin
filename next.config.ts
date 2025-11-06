import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: [
      "placehold.co",
      "res.cloudinary.com",
      "cdn.pixabay.com",
      "images.unsplash.com",
    ],
  },
};

export default nextConfig;
