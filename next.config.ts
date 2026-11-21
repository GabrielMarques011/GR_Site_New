import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bolinha flutuante do Next.js no canto da tela — só aparece em
  // desenvolvimento (`next dev`), nunca em produção/Vercel. Desligada aqui
  // porque atrapalhava a visualização de conteúdo durante os testes.
  devIndicators: false,
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
