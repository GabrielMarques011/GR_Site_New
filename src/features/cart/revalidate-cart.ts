"use server";

import { computeProductPricing } from "@/features/promotions/pricing";
import { getProductsByIds } from "@/services/products";
import type { CartItem } from "@/types/domain";

export interface CartIssue {
  productId: string;
  name: string;
  type: "removed" | "price_changed" | "quantity_adjusted";
  previousPrice?: number;
  newPrice?: number;
}

export interface RevalidatedCart {
  items: CartItem[];
  issues: CartIssue[];
  subtotal: number;
}

const MAX_QUANTITY_PER_ITEM = 99;

/**
 * Recalcula o carrinho a partir dos dados confiáveis do banco: produtos
 * desativados/excluídos são removidos, preços e promoções são
 * recalculados no servidor. Nunca confia nos valores vindos do navegador.
 */
export async function revalidateCart(
  clientItems: CartItem[],
): Promise<RevalidatedCart> {
  const ids = clientItems.map((item) => item.productId);
  const freshProducts = await getProductsByIds(ids);
  const freshById = new Map(
    freshProducts.map((product) => [product.id, product]),
  );

  const issues: CartIssue[] = [];
  const items: CartItem[] = [];

  for (const clientItem of clientItems) {
    const product = freshById.get(clientItem.productId);

    if (!product) {
      issues.push({
        productId: clientItem.productId,
        name: clientItem.name,
        type: "removed",
      });
      continue;
    }

    const { finalPrice } = computeProductPricing(product);
    const quantity = Math.min(
      Math.max(1, Math.trunc(clientItem.quantity)),
      MAX_QUANTITY_PER_ITEM,
    );

    if (Math.abs(finalPrice - clientItem.unitPrice) > 0.001) {
      issues.push({
        productId: product.id,
        name: product.name,
        type: "price_changed",
        previousPrice: clientItem.unitPrice,
        newPrice: finalPrice,
      });
    }

    items.push({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      unitPrice: finalPrice,
      quantity,
      imageUrl: product.images[0]?.image_url ?? null,
      note: clientItem.note,
    });
  }

  const subtotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );

  return { items, issues, subtotal };
}
