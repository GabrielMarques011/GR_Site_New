"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, ShoppingBag, X } from "lucide-react";

import { useCart } from "@/features/cart/cart-context";
import { cn } from "@/lib/utils/cn";
import type { PublicStoreSettings } from "@/types/domain";

const NAV_LINKS = [
  { href: "/", label: "Início" },
  { href: "/produtos", label: "Produtos" },
  { href: "/categorias", label: "Categorias" },
  { href: "/sobre", label: "Sobre nós" },
  { href: "/contato", label: "Contato" },
];

export function Header({ settings }: { settings: PublicStoreSettings }) {
  const { totalItems } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-white/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-lg font-semibold text-lilac-800"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={settings.logo_url || "/brand/gr-monogram.svg"}
            alt={settings.store_name}
            className="h-9 w-auto"
          />
          <span>{settings.store_name}</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink-700 transition-colors hover:text-lilac-700"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/carrinho"
            className="focus-ring relative flex size-10 items-center justify-center rounded-full text-ink-700 hover:bg-lilac-50 hover:text-lilac-700"
            aria-label="Carrinho de compras"
          >
            <ShoppingBag className="size-5" />
            {totalItems > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-lilac-600 text-[11px] font-semibold text-white">
                {totalItems > 9 ? "9+" : totalItems}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="focus-ring flex size-10 items-center justify-center rounded-full text-ink-700 hover:bg-lilac-50 md:hidden"
            aria-label="Abrir menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      <nav
        className={cn(
          "grid border-t border-ink-100 bg-white md:hidden",
          menuOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
          "transition-[grid-template-rows] duration-200 ease-out",
        )}
      >
        <div className="overflow-hidden">
          <div className="container-page flex flex-col gap-1 py-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-ink-700 hover:bg-lilac-50 hover:text-lilac-700"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
}
