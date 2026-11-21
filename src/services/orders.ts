import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { OrderItemSnapshot, OrderStatus } from "@/types/database";
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
  items: OrderItemSnapshot[];
  subtotal: number;
  discountPercent: number;
  total: number;
  isFirstPurchase: boolean;
}

export async function createOrder(input: CreateOrderInput): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("orders")
    .insert({
      customer_name: input.customerName,
      customer_phone: normalizePhone(input.customerPhone),
      items: input.items,
      subtotal: input.subtotal,
      discount_percent: input.discountPercent,
      total: input.total,
      is_first_purchase: input.isFirstPurchase,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Falha ao registrar pedido: ${error.message}`);
  }

  return data.id;
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
