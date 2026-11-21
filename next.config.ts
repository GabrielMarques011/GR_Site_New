import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "jcloztrhwgtvxypybzav.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  experimental: {
    serverActions: {
      // Produtos podem ter várias fotos; limite alinhado à validação de
      // tamanho feita em features/administration/products/image-actions.ts
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
