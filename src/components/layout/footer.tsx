import Link from "next/link";
import { AtSign, MapPin, MessageCircle } from "lucide-react";

import type { PublicStoreSettings } from "@/types/domain";

export function Footer({ settings }: { settings: PublicStoreSettings }) {
  const whatsappHref = settings.whatsapp
    ? `https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`
    : null;

  return (
    <footer className="mt-16 border-t border-ink-100 bg-lilac-50/60">
      <div className="container-page grid gap-10 py-12 md:grid-cols-3">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={settings.logo_url || "/brand/gr-monogram.svg"}
            alt={settings.store_name}
            className="h-10 w-auto"
          />
          <h3 className="mt-3 font-display text-lg font-semibold text-lilac-900">
            {settings.store_name}
          </h3>
          {settings.slogan && (
            <p className="mt-2 text-sm text-ink-700">{settings.slogan}</p>
          )}
        </div>

        <div>
          <h4 className="text-sm font-semibold text-ink-900">Navegação</h4>
          <ul className="mt-3 space-y-2 text-sm text-ink-700">
            <li>
              <Link href="/produtos" className="hover:text-lilac-700">
                Produtos
              </Link>
            </li>
            <li>
              <Link href="/categorias" className="hover:text-lilac-700">
                Categorias
              </Link>
            </li>
            <li>
              <Link href="/sobre" className="hover:text-lilac-700">
                Sobre nós
              </Link>
            </li>
            <li>
              <Link href="/contato" className="hover:text-lilac-700">
                Contato
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-ink-900">Contato</h4>
          <ul className="mt-3 space-y-3 text-sm text-ink-700">
            {whatsappHref && (
              <li>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 hover:text-lilac-700"
                >
                  <MessageCircle className="size-4 shrink-0" />
                  WhatsApp
                </a>
              </li>
            )}
            {settings.instagram_url && (
              <li>
                <a
                  href={settings.instagram_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 hover:text-lilac-700"
                >
                  <AtSign className="size-4 shrink-0" />
                  Instagram
                </a>
              </li>
            )}
            {settings.address && (
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0" />
                <span>{settings.address}</span>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-ink-100 py-4 text-center text-xs text-ink-500">
        © {new Date().getFullYear()} {settings.store_name}. Todos os direitos
        reservados.
      </div>
    </footer>
  );
}
