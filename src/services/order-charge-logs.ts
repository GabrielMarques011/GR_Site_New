import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { OrderChargeLog } from "@/types/domain";

/**
 * Registra que uma cobrança foi preparada (link do WhatsApp aberto) — não
 * significa que foi enviada. O envio real só é confirmado manualmente pela
 * administradora (ver `confirmChargeSent`). Mesmo padrão de
 * `logPreparedMessage` (whatsapp-message-logs.ts), mas ligado ao pedido, não
 * ao cliente — um pedido pode não ter cadastro vinculado.
 */
export async function logPreparedCharge(input: {
  orderId: string;
  administratorId: string | null;
}): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("order_charge_logs")
    .insert({
      order_id: input.orderId,
      administrator_id: input.administratorId,
      status: "preparada",
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Falha ao registrar cobrança preparada: ${error.message}`);
  }

  return data.id;
}

export async function confirmChargeSent(logId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("order_charge_logs")
    .update({
      status: "enviada_manualmente",
      manually_confirmed_at: new Date().toISOString(),
    })
    .eq("id", logId);

  if (error) {
    throw new Error(`Falha ao confirmar envio da cobrança: ${error.message}`);
  }
}

export async function cancelPreparedCharge(logId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("order_charge_logs")
    .update({ status: "cancelada" })
    .eq("id", logId);

  if (error) {
    throw new Error(`Falha ao cancelar cobrança: ${error.message}`);
  }
}

export async function getChargeLogsByOrder(
  orderId: string,
): Promise<OrderChargeLog[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("order_charge_logs")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(
      `Falha ao carregar histórico de cobranças: ${error.message}`,
    );
  }

  return data ?? [];
}
