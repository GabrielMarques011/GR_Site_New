"use server";

import { checkoutCustomerSchema } from "@/lib/validations/order";
import { buildWhatsAppOrderUrl } from "@/lib/utils/whatsapp";
import { reserveFirstPurchaseBenefit } from "@/services/customer-benefits";
import { getRecognizedCustomer } from "@/features/customers/recognize";
import {
  countOrdersByPhone,
  createOrder,
  updateOrderDiscount,
} from "@/services/orders";
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

  // Cliente reconhecido (cookie de sessão válido) tem o desconto de
  // primeira compra decidido pelo próprio cadastro (reserva transacional) —
  // nunca pelo histórico por telefone. Quem não está reconhecido mantém
  // exatamente o comportamento já existente (heurística por telefone).
  const recognizedCustomer = await getRecognizedCustomer();

  let isFirstPurchase = false;
  if (!recognizedCustomer) {
    const previousOrders = await countOrdersByPhone(parsed.data.phone);
    isFirstPurchase = previousOrders === 0;
  }
  let discountPercent = isFirstPurchase ? FIRST_PURCHASE_DISCOUNT_PERCENT : 0;

  const subtotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
  let total = subtotal * (1 - discountPercent / 100);

  let orderId: string | null = null;
  try {
    orderId = await createOrder({
      customerName: parsed.data.name,
      customerPhone: parsed.data.phone,
      customerId: recognizedCustomer?.customerId ?? null,
      items: items.map((item) => ({
        product_id: item.productId,
        name: item.name,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        subtotal: item.unitPrice * item.quantity,
        note: item.note,
        product_option_id: item.optionId,
        product_kind: item.kind,
        units_per_package: item.packageSize,
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

  // Só depois que o pedido já existe (a reserva referencia o pedido) —
  // reserva o benefício do cliente reconhecido e corrige o desconto
  // gravado, se a reserva realmente aconteceu (nunca confia em "já
  // reconhecido" sozinho: outra aba/dispositivo pode ter reservado
  // primeiro).
  if (recognizedCustomer && orderId) {
    const reservedPercent = await reserveFirstPurchaseBenefit(
      recognizedCustomer.customerId,
      orderId,
    );
    if (reservedPercent != null && reservedPercent > 0) {
      isFirstPurchase = true;
      discountPercent = reservedPercent;
      total = subtotal * (1 - discountPercent / 100);
      await updateOrderDiscount(orderId, discountPercent, total, true);
    }
  }

  const whatsappUrl = buildWhatsAppOrderUrl(settings.whatsapp, {
    lines: items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      note: item.note,
    })),
    customerName: parsed.data.name,
    discountPercent,
  });

  return { error: null, whatsappUrl, isFirstPurchase };
}
