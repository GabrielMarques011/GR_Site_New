"use server";

import { checkoutCustomerSchema } from "@/lib/validations/order";
import { buildWhatsAppOrderUrl } from "@/lib/utils/whatsapp";
import { countOrdersByPhone, createOrder } from "@/services/orders";
import { getPublicStoreSettings } from "@/services/settings";
import type { CartItem } from "@/types/domain";

export interface PlaceOrderState {
  error: string | null;
  fieldErrors?: Record<string, string>;
  whatsappUrl?: string;
  isFirstPurchase?: boolean;
}

const FIRST_PURCHASE_DISCOUNT_PERCENT = 5;

/**
 * Checagem "ao vivo" enquanto o cliente digita o telefone no formulário,
 * só para mostrar (ou não) o aviso do desconto antes de confirmar o
 * pedido de verdade. Não grava nada.
 */
export async function checkDiscountEligibilityAction(
  phone: string,
): Promise<{ isFirstPurchase: boolean }> {
  const parsed = checkoutCustomerSchema.shape.phone.safeParse(phone);
  if (!parsed.success) {
    return { isFirstPurchase: false };
  }

  const previousOrders = await countOrdersByPhone(parsed.data);
  return { isFirstPurchase: previousOrders === 0 };
}

/**
 * Registra o pedido no histórico e devolve o link do WhatsApp já pronto
 * (com nome e desconto de primeira compra, se for o caso). Os itens que
 * chegam aqui já passaram por `revalidateCart` no servidor — mesmo assim,
 * o total é recalculado aqui a partir deles, nunca aceito pronto do
 * cliente.
 */
export async function placeOrderAction(
  items: CartItem[],
  _prevState: PlaceOrderState,
  formData: FormData,
): Promise<PlaceOrderState> {
  const parsed = checkoutCustomerSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
  });

  if (!parsed.success) {
    return {
      error: "Revise os campos destacados.",
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((issue) => [
          issue.path.join("."),
          issue.message,
        ]),
      ),
    };
  }

  if (items.length === 0) {
    return { error: "Seu carrinho está vazio." };
  }

  const settings = await getPublicStoreSettings();
  if (!settings.whatsapp) {
    return {
      error: "Não encontramos o WhatsApp da loja. Tente novamente mais tarde.",
    };
  }

  const previousOrders = await countOrdersByPhone(parsed.data.phone);
  const isFirstPurchase = previousOrders === 0;
  const discountPercent = isFirstPurchase ? FIRST_PURCHASE_DISCOUNT_PERCENT : 0;

  const subtotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
  const total = subtotal * (1 - discountPercent / 100);

  try {
    await createOrder({
      customerName: parsed.data.name,
      customerPhone: parsed.data.phone,
      items: items.map((item) => ({
        product_id: item.productId,
        name: item.name,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        subtotal: item.unitPrice * item.quantity,
      })),
      subtotal,
      discountPercent,
      total,
      isFirstPurchase,
    });
  } catch (error) {
    // Gravar o histórico nunca deve impedir o cliente de finalizar pelo
    // WhatsApp — se a tabela ainda não existir (migration pendente) ou
    // falhar por qualquer motivo, só registramos no log do servidor.
    console.error("Falha ao registrar pedido no histórico:", error);
  }

  const whatsappUrl = buildWhatsAppOrderUrl(settings.whatsapp, {
    lines: items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
    customerName: parsed.data.name,
    discountPercent,
  });

  return { error: null, whatsappUrl, isFirstPurchase };
}
