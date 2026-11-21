import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { AuditLogRow } from "@/types/database";

export type AuditAction =
  | "product.create"
  | "product.update"
  | "product.delete"
  | "product.activate"
  | "product.deactivate"
  | "category.create"
  | "category.update"
  | "category.delete"
  | "settings.update";

/**
 * Registra uma ação administrativa relevante. Nunca recebe segredos,
 * senhas ou tokens em `details` — apenas identificadores e campos alterados.
 */
export async function logAuditEvent(
  action: AuditAction,
  entity: string,
  entityId: string | null,
  details?: Record<string, unknown>,
): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("audit_logs").insert({
    user_id: user?.id ?? null,
    action,
    entity,
    entity_id: entityId,
    details: details ?? null,
  });

  if (error) {
    // Auditoria não deve derrubar a operação principal; registra no
    // servidor para investigação, mas não propaga para a UI.
    console.error(`Falha ao registrar auditoria (${action}):`, error.message);
  }
}

export async function getAuditLogs(limit = 100): Promise<AuditLogRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Falha ao carregar auditoria: ${error.message}`);
  }

  return data ?? [];
}
