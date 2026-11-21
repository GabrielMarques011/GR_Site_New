import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "@/types/database";

import { supabasePublishableKey, supabaseUrl } from "./env";

/**
 * Cliente Supabase para Server Components, Server Actions e Route Handlers.
 * Precisa ser criado a cada requisição (depende dos cookies da requisição
 * atual) — nunca armazene a instância em uma variável de módulo.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // `setAll` é chamado a partir de um Server Component quando o
          // middleware já está atualizando a sessão em paralelo — nesse
          // caso é seguro ignorar, pois os cookies já serão renovados.
        }
      },
    },
  });
}
