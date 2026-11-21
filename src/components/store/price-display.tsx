import { computeProductPricing } from "@/features/promotions/pricing";
import { formatCurrency } from "@/lib/utils/currency";
import type { ProductRow } from "@/types/database";

export function PriceDisplay({
  product,
  size = "md",
}: {
  product: Pick<
    ProductRow,
    "price" | "promotional_price" | "promotion_start" | "promotion_end"
  >;
  size?: "sm" | "md" | "lg";
}) {
  const { basePrice, finalPrice, isPromotionActive } =
    computeProductPricing(product);

  const priceClass =
    size === "lg" ? "text-2xl" : size === "sm" ? "text-sm" : "text-lg";

  if (!isPromotionActive) {
    return (
      <span className={`font-display font-semibold text-ink-900 ${priceClass}`}>
        {formatCurrency(finalPrice)}
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <span
        className={`font-display font-semibold text-lilac-700 ${priceClass}`}
      >
        {formatCurrency(finalPrice)}
      </span>
      <span className="text-sm text-ink-500 line-through">
        {formatCurrency(basePrice)}
      </span>
    </div>
  );
}
