import type { ProductRow } from "@/types/database";
import type { ProductPricing } from "@/types/domain";

/**
 * Calcula o preço final de um produto no momento atual, respeitando a
 * janela de promoção (promotion_start/promotion_end). Esta é a única fonte
 * de verdade para "a promoção está ativa agora" no lado da aplicação — o
 * carrinho e o checkout por WhatsApp sempre recalculam a partir daqui,
 * nunca confiando em um preço recebido do navegador.
 */
export function computeProductPricing(
  product: Pick<
    ProductRow,
    "price" | "promotional_price" | "promotion_start" | "promotion_end"
  >,
  now: Date = new Date(),
): ProductPricing {
  const basePrice = product.price;

  if (
    product.promotional_price == null ||
    product.promotional_price >= basePrice
  ) {
    return { basePrice, finalPrice: basePrice, isPromotionActive: false };
  }

  const startsOk =
    !product.promotion_start || new Date(product.promotion_start) <= now;
  const endsOk =
    !product.promotion_end || new Date(product.promotion_end) >= now;

  if (startsOk && endsOk) {
    return {
      basePrice,
      finalPrice: product.promotional_price,
      isPromotionActive: true,
    };
  }

  return { basePrice, finalPrice: basePrice, isPromotionActive: false };
}
