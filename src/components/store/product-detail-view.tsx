import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/components/store/back-button";
import { PriceDisplay } from "@/components/store/price-display";
import { AddToCartButton } from "@/features/cart/add-to-cart-button";
import { computeProductPricing } from "@/features/promotions/pricing";
import type { Product } from "@/types/domain";

/** View compartilhada entre a página de produto personalizado
 * (`/produtos/[slug]`) e a de produto da loja (`/loja/[slug]`) — o conteúdo
 * é idêntico, só muda para onde os links de volta/categoria apontam. */
export function ProductDetailView({
  product,
  listHref,
  listLabel,
  categoryHref,
}: {
  product: Product;
  listHref: string;
  listLabel: string;
  /** Monta o link da categoria a partir do slug — path (`/categorias/x`) ou
   * query (`/loja?categoria=x`), conforme o segmento. */
  categoryHref: (slug: string) => string;
}) {
  const { isPromotionActive } = computeProductPricing(product);
  const outOfStock =
    product.stock_quantity != null && product.stock_quantity <= 0;
  const cover = product.images[0];

  return (
    <div className="container-page py-10">
      <BackButton fallbackHref={listHref} />

      <nav className="mb-6 text-sm text-ink-500">
        <Link href={listHref} className="hover:text-lilac-700">
          {listLabel}
        </Link>
        {product.category && (
          <>
            {" / "}
            <Link
              href={categoryHref(product.category.slug)}
              className="hover:text-lilac-700"
            >
              {product.category.name}
            </Link>
          </>
        )}
        {" / "}
        <span className="text-ink-700">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-lilac-50">
            {cover ? (
              <Image
                src={cover.image_url}
                alt={cover.alt_text ?? product.name}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                priority
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-ink-300">
                <ImageOff className="size-14" />
              </div>
            )}
          </div>

          {product.images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {product.images.map((image) => (
                <div
                  key={image.id}
                  className="relative aspect-square overflow-hidden rounded-lg bg-lilac-50"
                >
                  <Image
                    src={image.image_url}
                    alt={image.alt_text ?? product.name}
                    fill
                    sizes="20vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {isPromotionActive && <Badge variant="lilac">Promoção</Badge>}
            {product.featured && <Badge variant="warning">Destaque</Badge>}
            {outOfStock && <Badge variant="danger">Esgotado</Badge>}
          </div>

          {product.category && (
            <span className="text-sm font-medium uppercase tracking-wide text-ink-500">
              {product.category.name}
            </span>
          )}

          <h1 className="font-display text-3xl font-semibold text-ink-900">
            {product.name}
          </h1>

          <PriceDisplay product={product} size="lg" />

          {product.description && (
            <p className="whitespace-pre-line text-ink-700">
              {product.description}
            </p>
          )}

          {product.stock_quantity != null && !outOfStock && (
            <p className="text-sm text-ink-500">
              {product.stock_quantity} em estoque
            </p>
          )}

          <div className="mt-2 border-t border-ink-100 pt-6">
            <AddToCartButton
              productId={product.id}
              kind={product.kind}
              name={product.name}
              slug={product.slug}
              unitPrice={computeProductPricing(product).finalPrice}
              imageUrl={cover?.image_url ?? null}
              maxQuantity={product.stock_quantity}
              options={product.options}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
