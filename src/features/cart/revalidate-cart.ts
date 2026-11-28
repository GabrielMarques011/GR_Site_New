"use server";

import { computeProductPricing } from "@/features/promotions/pricing";
import { getActiveProductOptionsByIds } from "@/services/product-options";
import { getProductsByIds } from "@/services/products";
import type { CartItem } from "@/types/domain";

export interface CartIssue {
  productId: string;
  name: string;
  type: "removed" | "price_changed" | "quantity_adjusted";
  previousPrice?: number;
  newPrice?: number;
  /** Nova quantidade (de pacotes) após ajuste por falta de estoque —
   * só preenchido para `type: "quantity_adjusted"`. */
  newQuantity?: number;
}

export interface RevalidatedCart {
  items: CartItem[];
  issues: CartIssue[];
  subtotal: number;
}

const MAX_QUANTITY_PER_ITEM = 99;

/**
 * Checa o pedido contra o estoque atual do produto (só quando
 * `stock_quantity` é controlado — `null` continua significando "sem
 * controle", como já era antes da Loja existir). Devolve a quantidade de
 * pacotes possível (nunca mais que a pedida) e, se precisou reduzir,
 * registra o motivo em `issues`.
 */
function applyStockLimit(
  issues: CartIssue[],
  productId: string,
  name: string,
  requestedQuantity: number,
  packageSize: number,
  stockQuantity: number | null,
): number {
  if (stockQuantity == null) return requestedQuantity;

  const maxPackages = Math.floor(stockQuantity / packageSize);

  if (requestedQuantity <= maxPackages) return requestedQuantity;

  if (maxPackages <= 0) {
    issues.push({ productId, name, type: "removed" });
    return 0;
  }

  issues.push({
    productId,
    name,
    type: "quantity_adjusted",
    newQuantity: maxPackages,
  });
  return maxPackages;
}

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

  // Opções (kits) buscadas à parte — `getProductsByIds` não embute opções
  // (a validação de preço no carrinho precisa delas, mas a listagem/home
  // não, então não vale o custo extra ali). Nunca confia no preço do kit
  // vindo do navegador: sempre revalida contra a opção ativa no banco.
  const optionIds = clientItems
    .map((item) => item.optionId)
    .filter((id): id is string => Boolean(id));
  const freshOptionsById = await getActiveProductOptionsByIds(optionIds);

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

    const quantity = Math.min(
      Math.max(1, Math.trunc(clientItem.quantity)),
      MAX_QUANTITY_PER_ITEM,
    );

    if (clientItem.optionId) {
      const option = freshOptionsById.get(clientItem.optionId);

      if (!option || option.product_id !== product.id) {
        // Opção removida, desativada ou trocada de produto — some do
        // carrinho em vez de arriscar cobrar um valor que não existe mais.
        issues.push({
          productId: product.id,
          name: clientItem.name,
          type: "removed",
        });
        continue;
      }

      if (Math.abs(option.price - clientItem.unitPrice) > 0.001) {
        issues.push({
          productId: product.id,
          name: clientItem.name,
          type: "price_changed",
          previousPrice: clientItem.unitPrice,
          newPrice: option.price,
        });
      }

      const itemName = `${product.name} — ${option.name}`;
      const limitedQuantity = applyStockLimit(
        issues,
        product.id,
        itemName,
        quantity,
        option.quantity,
        product.stock_quantity,
      );
      if (limitedQuantity <= 0) continue;

      items.push({
        productId: product.id,
        kind: product.kind,
        optionId: option.id,
        name: itemName,
        slug: product.slug,
        unitPrice: option.price,
        quantity: limitedQuantity,
        packageSize: option.quantity,
        imageUrl: product.images[0]?.image_url ?? null,
        note: clientItem.note,
      });
      continue;
    }

    const { finalPrice } = computeProductPricing(product);

    if (Math.abs(finalPrice - clientItem.unitPrice) > 0.001) {
      issues.push({
        productId: product.id,
        name: product.name,
        type: "price_changed",
        previousPrice: clientItem.unitPrice,
        newPrice: finalPrice,
      });
    }

    const limitedQuantity = applyStockLimit(
      issues,
      product.id,
      product.name,
      quantity,
      1,
      product.stock_quantity,
    );
    if (limitedQuantity <= 0) continue;

    items.push({
      productId: product.id,
      kind: product.kind,
      optionId: null,
      name: product.name,
      slug: product.slug,
      unitPrice: finalPrice,
      quantity: limitedQuantity,
      packageSize: 1,
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
