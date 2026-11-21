import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { CategoryFormValues } from "@/lib/validations/category";
import type { Category } from "@/types/domain";

const CATEGORY_SELECT =
  "id, name, slug, description, image_url, display_order, active, created_at, updated_at";

export async function getActiveCategories(): Promise<Category[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select(CATEGORY_SELECT)
    .eq("active", true)
    .order("display_order", { ascending: true });

  if (error) {
    throw new Error(`Falha ao carregar categorias: ${error.message}`);
  }

  return data ?? [];
}

export async function getCategoryBySlug(
  slug: string,
): Promise<Category | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select(CATEGORY_SELECT)
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    throw new Error(`Falha ao carregar categoria: ${error.message}`);
  }

  return data;
}

export async function getAdminCategories(): Promise<Category[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select(CATEGORY_SELECT)
    .order("display_order", { ascending: true });

  if (error) {
    throw new Error(`Falha ao carregar categorias (admin): ${error.message}`);
  }

  return data ?? [];
}

export async function countProductsInCategory(
  categoryId: string,
): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category_id", categoryId);

  if (error) {
    throw new Error(`Falha ao contar produtos da categoria: ${error.message}`);
  }

  return count ?? 0;
}

function toCategoryPayload(values: CategoryFormValues) {
  return {
    name: values.name,
    slug: values.slug,
    description: values.description || null,
    image_url: values.image_url || null,
    display_order: values.display_order,
    active: values.active,
  };
}

export async function createCategory(
  values: CategoryFormValues,
): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .insert(toCategoryPayload(values))
    .select("id")
    .single();

  if (error) {
    throw new Error(`Falha ao criar categoria: ${error.message}`);
  }

  return data.id;
}

export async function updateCategory(
  id: string,
  values: CategoryFormValues,
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("categories")
    .update(toCategoryPayload(values))
    .eq("id", id);

  if (error) {
    throw new Error(`Falha ao atualizar categoria: ${error.message}`);
  }
}

/**
 * Exclui uma categoria. Produtos vinculados NÃO são excluídos: o
 * category_id deles é limpo (produto passa a ficar "sem categoria") para
 * nunca apagar dados de produto como efeito colateral de uma operação em
 * categoria.
 */
export async function deleteCategory(id: string): Promise<void> {
  const supabase = await createClient();

  const { error: unlinkError } = await supabase
    .from("products")
    .update({ category_id: null })
    .eq("category_id", id);

  if (unlinkError) {
    throw new Error(
      `Falha ao desvincular produtos da categoria: ${unlinkError.message}`,
    );
  }

  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    throw new Error(`Falha ao excluir categoria: ${error.message}`);
  }
}
