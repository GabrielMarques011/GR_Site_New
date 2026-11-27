import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Supplier } from "@/types/domain";

/** Degrada para `[]` (nunca lança) — se a migration 0009 ainda não tiver
 * sido aplicada, a tela de compras continua carregando normalmente, só sem
 * sugestões de fornecedores já cadastrados. */
export async function getSuppliers(): Promise<Supplier[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Falha ao carregar fornecedores:", error.message);
    return [];
  }

  return data ?? [];
}

/**
 * Localiza um fornecedor pelo nome (sem diferenciar maiúsculas/minúsculas)
 * ou cria um novo — evita cadastro duplicado quando a administradora digita
 * um fornecedor já existente com grafia ligeiramente diferente de maiúsculas.
 * `suppliers.name` tem constraint `unique`, então uma corrida rara entre
 * duas inserções simultâneas é resolvida tentando localizar de novo após o
 * conflito, em vez de falhar.
 */
export async function resolveOrCreateSupplier(name: string): Promise<string> {
  const supabase = await createClient();
  const trimmedName = name.trim();

  const { data: existing } = await supabase
    .from("suppliers")
    .select("id")
    .ilike("name", trimmedName)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("suppliers")
    .insert({ name: trimmedName })
    .select("id")
    .single();

  if (!error) return created.id;

  if (error.code === "23505") {
    const { data: afterConflict } = await supabase
      .from("suppliers")
      .select("id")
      .ilike("name", trimmedName)
      .maybeSingle();
    if (afterConflict) return afterConflict.id;
  }

  throw new Error(`Falha ao registrar fornecedor: ${error.message}`);
}
