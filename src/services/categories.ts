import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { CategoryFormValues } from "@/lib/validations/category";
import type { Category, ProductKind } from "@/types/domain";

const CATEGORY_SELECT =
  "id, name, slug, description, image_url, display_order, active, kind, created_at, updated_at";

export async function getActiveCategories(
  kind: ProductKind = "personalizado",
): Promise<Category[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select(CATEGORY_SELECT)
    .eq("active", true)
    .eq("kind", kind)
    .order("display_order", { ascending: true });

  if (error) {
    throw new Error(`Falha ao carregar categorias: ${error.message}`);
  }

  return data ?? [];
}

export async function getCategoryBySlug(
  slug: string,
  kind: ProductKind = "personalizado",
): Promise<Category | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select(CATEGORY_SELECT)
    .eq("slug", slug)
    .eq("active", true)
    .eq("kind", kind)
    .maybeSingle();

  if (error) {
    throw new Error(`Falha ao carregar categoria: ${error.message}`);
  }

  return data;
}

export async function getAdminCategories(
  kind: ProductKind = "personalizado",
): Promise<Category[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select(CATEGORY_SELECT)
    .eq("kind", kind)
    .order("display_order", { ascending: true });

  if (error) {
    throw new Error(`Falha ao carregar categorias (admin): ${error.message}`);
  }

  return data ?? [];
}

/** Busca uma categoria por id independente do segmento — usada na tela de
 * edição, que só recebe o id pela URL (não sabe de antemão se é
 * personalizado ou loja). */
export async function getAdminCategoryById(
  id: string,
): Promise<Category | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select(CATEGORY_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Falha ao carregar categoria (admin): ${error.message}`);
  }

  return data;
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
    display_order: values.display_order,
    active: values.active,
  };
}

export async function createCategory(
  values: CategoryFormValues,
  kind: ProductKind = "personalizado",
): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .insert({ ...toCategoryPayload(values), kind })
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
