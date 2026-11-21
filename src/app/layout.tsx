import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";

const sans = Inter({
  variable: "--next-font-sans",
  subsets: ["latin"],
});

const display = Poppins({
  variable: "--next-font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

/**
 * Lê NEXT_PUBLIC_SITE_URL com segurança: se a variável vier mal formatada
 * (ex.: "designersgr.com.br" sem o "https://"), `new URL()` lança e
 * derruba o build inteiro — já aconteceu uma vez no deploy. Em vez disso,
 * cai de volta para localhost e só avisa no log do build.
 */
function resolveSiteUrl(): URL {
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  if (raw) {
    try {
      return new URL(raw);
    } catch {
      console.warn(
        `NEXT_PUBLIC_SITE_URL inválida ("${raw}") — faltando "https://"? Usando http://localhost:3000 como fallback.`,
      );
    }
  }
  return new URL("http://localhost:3000");
}

export const metadata: Metadata = {
  metadataBase: resolveSiteUrl(),
  title: {
    default: "GR Design — Personalizados feitos com carinho",
    template: "%s | GR Design",
  },
  description:
    "Canecas, camisetas, topos de bolo e produtos personalizados feitos com carinho pela GR Design.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${sans.variable} ${display.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white font-sans text-ink-900">
        {children}
      </body>
    </html>
  );
}
