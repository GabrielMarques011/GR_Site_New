import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { AdminProfileRow } from "@/types/database";

export interface CurrentAdmin {
  userId: string;
  email: string | null;
  profile: AdminProfileRow;
}

/**
 * Retorna o administrador autenticado ou `null`. A checagem real de
 * autorização (quem é admin) é feita no banco via RLS/`is_admin()` — esta
 * função apenas reflete isso para a UI. Nunca decida autorização só com
 * base no retorno desta função sem as políticas de RLS correspondentes
 * ativas nas tabelas administrativas.
 */
export async function getCurrentAdmin(): Promise<CurrentAdmin | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("admin_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return null;
  }

  return { userId: user.id, email: user.email ?? null, profile };
}
