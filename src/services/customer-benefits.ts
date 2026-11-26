import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { CustomerBenefit } from "@/types/domain";

/**
 * Reserva atomicamente o benefício de primeira compra (disponível ->
 * reservado) vinculado a um pedido. Devolve o percentual de desconto se a
 * reserva deu certo, ou `null` se o benefício não existir/já tiver sido
 * usado/reservado (inclusive por outra finalização concorrente — a troca é
 * garantida pelo próprio UPDATE no banco, não precisa de lock explícito) ou
 * se a migration 0004_customers.sql ainda não tiver sido aplicada.
 */
export async function reserveFirstPurchaseBenefit(
  customerId: string,
  orderReference: string,
): Promise<number | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("reserve_first_purchase_benefit", {
    p_customer_id: customerId,
    p_order_reference: orderReference,
  });

  if (error) {
    console.error(
      "Falha ao reservar benefício de primeira compra:",
      error.message,
    );
    return null;
  }

  return data;
}

export async function getCustomerBenefit(
  customerId: string,
): Promise<CustomerBenefit | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customer_benefits")
    .select("*")
    .eq("customer_id", customerId)
    .eq("benefit_type", "primeira_compra")
    .maybeSingle();

  if (error) {
    throw new Error(`Falha ao carregar benefício do cliente: ${error.message}`);
  }

  return data;
}

/**
 * Confirma o uso do benefício após a administradora verificar que a compra
 * foi realmente concluída. Nunca acontece automaticamente — é sempre uma
 * ação manual, deliberada, no painel.
 */
export async function confirmBenefitUsage(customerId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("customer_benefits")
    .update({ status: "utilizado", used_at: new Date().toISOString() })
    .eq("customer_id", customerId)
    .eq("benefit_type", "primeira_compra")
    .eq("status", "reservado");

  if (error) {
    throw new Error(`Falha ao confirmar uso do benefício: ${error.message}`);
  }

  await supabase
    .from("customers")
    .update({
      first_purchase_discount_used: true,
      first_purchase_discount_used_at: new Date().toISOString(),
    })
    .eq("id", customerId);
}

/** Cancela uma reserva (pedido não concluído) e devolve o benefício a "disponível". */
export async function cancelBenefitReservation(
  customerId: string,
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("customer_benefits")
    .update({
      status: "disponivel",
      reserved_at: null,
      order_reference: null,
      cancelled_at: new Date().toISOString(),
    })
    .eq("customer_id", customerId)
    .eq("benefit_type", "primeira_compra")
    .eq("status", "reservado");

  if (error) {
    throw new Error(`Falha ao cancelar reserva do benefício: ${error.message}`);
  }
}

/**
 * Revoga o benefício definitivamente (situação justificada — ex.: abuso
 * identificado) — diferente de cancelar uma reserva, que devolve o
 * benefício para "disponível". Um benefício "cancelado" não pode mais ser
 * reservado nem utilizado.
 */
export async function revokeBenefit(customerId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("customer_benefits")
    .update({ status: "cancelado", cancelled_at: new Date().toISOString() })
    .eq("customer_id", customerId)
    .eq("benefit_type", "primeira_compra");

  if (error) {
    throw new Error(`Falha ao cancelar benefício: ${error.message}`);
  }
}
