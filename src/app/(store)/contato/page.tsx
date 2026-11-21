import type { Metadata } from "next";
import { AtSign, MapPin, MessageCircle } from "lucide-react";

import { getPublicStoreSettings } from "@/services/settings";

export const metadata: Metadata = {
  title: "Contato",
  description: "Fale com a GR Design pelo WhatsApp ou Instagram.",
};

export default async function ContatoPage() {
  const settings = await getPublicStoreSettings();
  const whatsappHref = settings.whatsapp
    ? `https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`
    : null;

  return (
    <div className="container-page max-w-2xl py-16">
      <h1 className="font-display text-3xl font-semibold text-ink-900">
        Contato
      </h1>
      <p className="mt-2 text-ink-700">
        Tire suas dúvidas, peça um orçamento ou finalize seu pedido falando com
        a gente.
      </p>

      <div className="mt-8 flex flex-col gap-4">
        {whatsappHref && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="focus-ring flex items-center gap-4 rounded-2xl border border-ink-100 bg-white p-5 transition-shadow hover:shadow-md"
          >
            <span className="flex size-12 items-center justify-center rounded-full bg-lilac-100 text-lilac-700">
              <MessageCircle className="size-6" />
            </span>
            <div>
              <p className="font-medium text-ink-900">WhatsApp</p>
              <p className="text-sm text-ink-500">
                Resposta rápida para pedidos e dúvidas
              </p>
            </div>
          </a>
        )}

        {settings.instagram_url && (
          <a
            href={settings.instagram_url}
            target="_blank"
            rel="noreferrer"
            className="focus-ring flex items-center gap-4 rounded-2xl border border-ink-100 bg-white p-5 transition-shadow hover:shadow-md"
          >
            <span className="flex size-12 items-center justify-center rounded-full bg-lilac-100 text-lilac-700">
              <AtSign className="size-6" />
            </span>
            <div>
              <p className="font-medium text-ink-900">Instagram</p>
              <p className="text-sm text-ink-500">@designers_gr</p>
            </div>
          </a>
        )}

        {settings.address && (
          <div className="flex items-center gap-4 rounded-2xl border border-ink-100 bg-white p-5">
            <span className="flex size-12 items-center justify-center rounded-full bg-lilac-100 text-lilac-700">
              <MapPin className="size-6" />
            </span>
            <div>
              <p className="font-medium text-ink-900">Endereço</p>
              <p className="text-sm text-ink-500">{settings.address}</p>
            </div>
          </div>
        )}

        {settings.maps_url && (
          <div className="overflow-hidden rounded-2xl border border-ink-100">
            <iframe
              src={settings.maps_url}
              title="Localização da GR Design"
              className="h-72 w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        )}
      </div>
    </div>
  );
}
