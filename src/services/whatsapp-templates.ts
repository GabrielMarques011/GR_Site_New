import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  WhatsAppMessageTemplate,
  WhatsAppMessageTemplateType,
} from "@/types/domain";

/**
 * Devolve [] (em vez de lançar) se a tabela ainda não existir — a migration
 * 0004_customers.sql depende de aprovação manual, e a tela de modelos é
 * nova (pode simplesmente aparecer vazia até lá).
 */
export async function getWhatsAppTemplates(): Promise<
  WhatsAppMessageTemplate[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("whatsapp_message_templates")
    .select("*")
    .order("message_type", { ascending: true });

  if (error) {
    console.error("Falha ao carregar modelos de mensagem:", error.message);
    return [];
  }

  return data ?? [];
}

export async function updateWhatsAppTemplate(
  messageType: WhatsAppMessageTemplateType,
  content: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("whatsapp_message_templates")
    .update({ content })
    .eq("message_type", messageType);

  if (error) {
    throw new Error(`Falha ao atualizar modelo de mensagem: ${error.message}`);
  }
}
