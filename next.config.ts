import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    // Demo photography from Unsplash (Unsplash License). Blob uploads will be added later.
    remotePatterns: [
      new URL("https://images.unsplash.com/**"),
      // Media library uploads (public Vercel Blob store). Keep in sync with isAllowedImageUrl().
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com", pathname: "/**" },
    ],
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
