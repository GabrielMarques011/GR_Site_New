import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { ProductOption } from "@/types/domain";
import type { ProductOptionValues } from "@/lib/validations/product-option";

/** Opções ativas de um produto, para a loja pública — degrada para `[]`
 * (nunca lança) se a migration 0010 ainda não tiver sido aplicada, já que
 * o produto principal precisa continuar funcionando normalmente mesmo sem
 * nenhum subproduto cadastrado. */
export async function getActiveProductOptions(
  productId: string,
): Promise<ProductOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_options")
    .select("*")
    .eq("product_id", productId)
    .eq("active", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Falha ao carregar opções do produto:", error.message);
    return [];
  }

  return data ?? [];
}

/** Busca várias opções ativas por id de uma vez (mapa id -> opção) — usado
 * para revalidar o carrinho no checkout, nunca confiando no preço vindo do
 * navegador. Degrada para mapa vazio (nunca lança). */
export async function getActiveProductOptionsByIds(
  optionIds: string[],
): Promise<Map<string, ProductOption>> {
  if (optionIds.length === 0) return new Map();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_options")
    .select("*")
    .in("id", optionIds)
    .eq("active", true);

  if (error) {
    console.error("Falha ao revalidar opções do carrinho:", error.message);
    return new Map();
  }

  return new Map((data ?? []).map((option) => [option.id, option]));
}

/** Todas as opções (ativas e inativas) — para a edição no painel. Mesma
 * degradação segura. */
export async function getProductOptions(
  productId: string,
): Promise<ProductOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_options")
    .select("*")
    .eq("product_id", productId)
    .order("display_order", { ascending: true });

  if (error) {
    console.error(
      "Falha ao carregar opções do produto (admin):",
      error.message,
    );
    return [];
  }

  return data ?? [];
}

export async function createProductOption(
  productId: string,
  values: ProductOptionValues,
): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_options")
    .insert({
      product_id: productId,
      name: values.name,
      quantity: values.quantity,
      price: values.price,
      active: values.active,
      display_order: values.display_order,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Falha ao criar opção de compra: ${error.message}`);
  }

  return data.id;
}

export async function updateProductOption(
  optionId: string,
  values: ProductOptionValues,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("product_options")
    .update({
      name: values.name,
      quantity: values.quantity,
      price: values.price,
      active: values.active,
      display_order: values.display_order,
      updated_at: new Date().toISOString(),
    })
    .eq("id", optionId);

  if (error) {
    throw new Error(`Falha ao atualizar opção de compra: ${error.message}`);
  }
}

export async function deleteProductOption(optionId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("product_options")
    .delete()
    .eq("id", optionId);

  if (error) {
    throw new Error(`Falha ao excluir opção de compra: ${error.message}`);
  }
}

export async function setProductOptionActive(
  optionId: string,
  active: boolean,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("product_options")
    .update({ active, updated_at: new Date().toISOString() })
    .eq("id", optionId);

  if (error) {
    throw new Error(
      `Falha ao atualizar status da opção de compra: ${error.message}`,
    );
  }
}

/** Cria várias opções de uma vez — usado ao criar um produto novo, com as
 * opções já preenchidas no formulário antes de o produto existir. */
export async function bulkCreateProductOptions(
  productId: string,
  items: ProductOptionValues[],
): Promise<void> {
  if (items.length === 0) return;

  const supabase = await createClient();
  const { error } = await supabase.from("product_options").insert(
    items.map((values, index) => ({
      product_id: productId,
      name: values.name,
      quantity: values.quantity,
      price: values.price,
      active: values.active,
      display_order: values.display_order ?? index,
    })),
  );

  if (error) {
    throw new Error(`Falha ao criar opções de compra: ${error.message}`);
  }
}
