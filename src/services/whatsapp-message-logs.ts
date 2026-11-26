import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { WhatsAppMessageLog, WhatsAppMessageType } from "@/types/domain";

/**
 * Registra que uma mensagem foi preparada (link do WhatsApp aberto) — não
 * significa que foi enviada. O envio real só é confirmado manualmente pela
 * administradora (ver `confirmMessageSent`).
 */
export async function logPreparedMessage(input: {
  customerId: string;
  messageType: WhatsAppMessageType;
  messageContent: string;
  administratorId: string | null;
}): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("whatsapp_message_logs")
    .insert({
      customer_id: input.customerId,
      message_type: input.messageType,
      message_content: input.messageContent,
      administrator_id: input.administratorId,
      status: "preparada",
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Falha ao registrar mensagem preparada: ${error.message}`);
  }

  return data.id;
}

export async function confirmMessageSent(logId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("whatsapp_message_logs")
    .update({
      status: "enviada_manualmente",
      manually_confirmed_at: new Date().toISOString(),
    })
    .eq("id", logId);

  if (error) {
    throw new Error(`Falha ao confirmar envio da mensagem: ${error.message}`);
  }
}

export async function cancelPreparedMessage(logId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("whatsapp_message_logs")
    .update({ status: "cancelada" })
    .eq("id", logId);

  if (error) {
    throw new Error(`Falha ao cancelar mensagem: ${error.message}`);
  }
}

export async function getMessageLogsByCustomer(
  customerId: string,
): Promise<WhatsAppMessageLog[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("whatsapp_message_logs")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(
      `Falha ao carregar histórico de mensagens: ${error.message}`,
    );
  }

  return data ?? [];
}
