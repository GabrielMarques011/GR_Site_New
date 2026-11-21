import type { Metadata } from "next";

import { getPublicStoreSettings } from "@/services/settings";

export const metadata: Metadata = {
  title: "Sobre nós",
  description: "Conheça a história da GR Design.",
};

export default async function SobrePage() {
  const settings = await getPublicStoreSettings();

  return (
    <div className="container-page max-w-3xl py-16">
      <h1 className="font-display text-3xl font-semibold text-ink-900">
        Sobre a {settings.store_name}
      </h1>
      {settings.slogan && (
        <p className="mt-2 text-lg text-lilac-700">{settings.slogan}</p>
      )}
      {settings.about_text && (
        <p className="mt-6 whitespace-pre-line text-ink-700">
          {settings.about_text}
        </p>
      )}
    </div>
  );
}
