"use client";

import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/database";

import { supabasePublishableKey, supabaseUrl } from "./env";

/**
 * Cliente Supabase para uso em Client Components. Reaproveita a mesma
 * instância entre renders — nunca crie um novo cliente dentro de um
 * componente ou hook.
 */
export function createClient() {
  return createBrowserClient<Database>(supabaseUrl, supabasePublishableKey);
}
