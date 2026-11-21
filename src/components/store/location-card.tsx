import { ExternalLink, MapPin } from "lucide-react";

import { CopyButton } from "@/components/ui/copy-button";
import { buttonVariants } from "@/components/ui/button";
import { buildMapsDirectionsUrl, buildMapsEmbedUrl } from "@/lib/utils/maps";
import type { PublicStoreSettings } from "@/types/domain";

export function LocationCard({
  settings,
}: {
  settings: Pick<PublicStoreSettings, "address" | "maps_url">;
}) {
  if (!settings.address) return null;

  const embedUrl = buildMapsEmbedUrl(settings.address, settings.maps_url);
  const directionsUrl = buildMapsDirectionsUrl(settings.address);

  return (
    <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white">
      <div className="relative h-56 w-full bg-lilac-50">
        <iframe
          src={embedUrl}
          title="Localização da GR Design no mapa"
          className="size-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-lilac-100 text-lilac-700">
            <MapPin className="size-5" />
          </span>
          <p className="text-sm text-ink-700">{settings.address}</p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <CopyButton
            value={settings.address}
            label="Copiar endereço"
            size="sm"
          />
          <a
            href={directionsUrl}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ size: "sm" })}
          >
            <ExternalLink className="size-4" />
            Abrir no Google Maps
          </a>
        </div>
      </div>
    </div>
  );
}
