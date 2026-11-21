import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { computeProductPricing } from "@/features/promotions/pricing";
import { isAllowedImageUrl } from "@/lib/utils/image-host";
import type { Product } from "@/types/domain";

import { PriceDisplay } from "./price-display";

export function ProductCard({ product }: { product: Product }) {
  const cover = product.images[0];
  const hasCoverImage = isAllowedImageUrl(cover?.image_url);
  const { isPromotionActive } = computeProductPricing(product);
  const outOfStock =
    product.stock_quantity != null && product.stock_quantity <= 0;

  return (
    <Link
      href={`/produtos/${product.slug}`}
      className="focus-ring group flex flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white transition-shadow hover:shadow-md hover:shadow-ink-900/10"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-lilac-50">
        {hasCoverImage ? (
          <Image
            src={cover.image_url}
            alt={cover.alt_text ?? product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-300">
            <ImageOff className="size-10" />
          </div>
        )}

        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {isPromotionActive && <Badge variant="lilac">Promoção</Badge>}
          {product.featured && <Badge variant="warning">Destaque</Badge>}
          {outOfStock && <Badge variant="danger">Esgotado</Badge>}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        {product.category && (
          <span className="text-xs font-medium uppercase tracking-wide text-ink-500">
            {product.category.name}
          </span>
        )}
        <h3 className="line-clamp-2 font-medium text-ink-900">
          {product.name}
        </h3>
        <div className="mt-auto pt-2">
          <PriceDisplay product={product} />
        </div>
      </div>
    </Link>
  );
}
