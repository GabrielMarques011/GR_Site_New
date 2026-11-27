import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface AdminProfileOption {
  userId: string;
  name: string;
}

/** Lista simples de administradoras (id + nome) — usada para mostrar "quem
 * registrou" e filtrar por responsável nas telas administrativas. Degrada
 * para `[]` (nunca lança). */
export async function getAdminProfiles(): Promise<AdminProfileOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("admin_profiles")
    .select("user_id, name")
    .order("name", { ascending: true });

  if (error) {
    console.error("Falha ao carregar administradoras:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({ userId: row.user_id, name: row.name }));
}
