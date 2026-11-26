import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  OrderItemSnapshot,
  OrderPaymentStatus,
  OrderStatus,
} from "@/types/database";
import type { Order } from "@/types/domain";

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * Quantos pedidos esse telefone já fez — usado tanto para decidir o
 * desconto de primeira compra quanto para avisar o cliente no carrinho.
 * Passa pela função `count_orders_by_phone` (SECURITY DEFINER) porque a
 * tabela `orders` não tem leitura pública: essa função só devolve um
 * número, nunca os dados de outros clientes.
 *
 * Devolve 0 (em vez de lançar) se a função/tabela ainda não existir no
 * banco — a migration 0002_orders.sql depende de aprovação manual, e o
 * checkout pelo WhatsApp (que já funcionava antes dessa funcionalidade)
 * não pode parar de funcionar por causa disso.
 */
export async function countOrdersByPhone(phone: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("count_orders_by_phone", {
    p_phone: normalizePhone(phone),
  });

  if (error) {
    console.error("Falha ao consultar pedidos anteriores:", error.message);
    return 0;
  }

  return data ?? 0;
}

export interface CreateOrderInput {
  customerName: string;
  customerPhone: string;
  customerId?: string | null;
  items: OrderItemSnapshot[];
  subtotal: number;
  discountPercent: number;
  total: number;
  isFirstPurchase: boolean;
}

/**
 * Registra o pedido via a função `create_order()` (SECURITY DEFINER —
 * migration 0005_fix_order_insert.sql), não por INSERT direto na tabela:
 * o INSERT direto como a role `anon` falhava por RLS mesmo com a policy
 * correta (causa não identificada após investigação extensa), igual ao
 * padrão já usado para cadastro/reconhecimento de clientes (migration
 * 0004_customers.sql). Ver SECURITY.md para o detalhe.
 */
export async function createOrder(input: CreateOrderInput): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("create_order", {
    p_customer_name: input.customerName,
    p_customer_phone: normalizePhone(input.customerPhone),
    p_customer_id: input.customerId ?? null,
    p_items: input.items,
    p_subtotal: input.subtotal,
    p_discount_percent: input.discountPercent,
    p_total: input.total,
    p_is_first_purchase: input.isFirstPurchase,
  });

  if (error) {
    throw new Error(`Falha ao registrar pedido: ${error.message}`);
  }

  return data;
}

/** Corrige o desconto do pedido depois que o benefício de primeira compra
 * é reservado (a reserva só pode acontecer depois que o pedido já existe,
 * por causa da referência). Falha aqui nunca derruba o checkout — o pior
 * caso é o pedido ficar registrado com o desconto de 0% no histórico. */
export async function updateOrderDiscount(
  id: string,
  discountPercent: number,
  total: number,
  isFirstPurchase: boolean,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_order_discount", {
    p_order_id: id,
    p_discount_percent: discountPercent,
    p_total: total,
    p_is_first_purchase: isFirstPurchase,
  });

  if (error) {
    console.error("Falha ao atualizar desconto do pedido:", error.message);
  }
}

export async function getOrders(): Promise<Order[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Falha ao carregar pedidos: ${error.message}`);
  }

  return (data ?? []) as unknown as Order[];
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id);

  if (error) {
    throw new Error(`Falha ao atualizar status do pedido: ${error.message}`);
  }
}

export async function updateOrderPaymentStatus(
  id: string,
  paymentStatus: OrderPaymentStatus,
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("orders")
    .update({
      payment_status: paymentStatus,
      payment_confirmed_at:
        paymentStatus === "pago" ? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (error) {
    throw new Error(
      `Falha ao atualizar status de pagamento do pedido: ${error.message}`,
    );
  }
}
