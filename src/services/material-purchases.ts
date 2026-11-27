import "server-only";

import { createClient } from "@/lib/supabase/server";
import { resolveOrCreateSupplier } from "@/services/suppliers";
import type {
  MaterialPurchase,
  MaterialPurchaseItemInput,
  MaterialPurchaseWithItems,
} from "@/types/domain";

export interface MaterialPurchaseFilters {
  search?: string;
  category?: string;
  from?: string;
  to?: string;
  administratorId?: string;
}

/** Degrada para `[]` (nunca lança) — se a migration 0009 ainda não tiver
 * sido aplicada, o resto do painel continua funcionando normalmente. */
export async function getMaterialPurchases(
  filters: MaterialPurchaseFilters = {},
): Promise<MaterialPurchase[]> {
  const supabase = await createClient();

  let query = supabase
    .from("material_purchases")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters.category) {
    query = query.ilike("category", `%${filters.category}%`);
  }
  if (filters.from) {
    query = query.gte("created_at", filters.from);
  }
  if (filters.to) {
    query = query.lte("created_at", filters.to);
  }
  if (filters.administratorId) {
    query = query.eq("administrator_id", filters.administratorId);
  }
  if (filters.search) {
    query = query.or(
      `supplier_name_snapshot.ilike.%${filters.search}%,category.ilike.%${filters.search}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("Falha ao carregar compras de materiais:", error.message);
    return [];
  }

  return data ?? [];
}

/** Conta quantos itens (produtos diferentes) cada compra tem — usado só
 * para exibir na listagem, sem precisar carregar os itens inteiros. */
export async function getItemCountsByPurchase(
  purchaseIds: string[],
): Promise<Map<string, number>> {
  if (purchaseIds.length === 0) return new Map();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("material_purchase_items")
    .select("purchase_id")
    .in("purchase_id", purchaseIds);

  const counts = new Map<string, number>();
  if (error || !data) return counts;

  for (const row of data) {
    counts.set(row.purchase_id, (counts.get(row.purchase_id) ?? 0) + 1);
  }
  return counts;
}

export async function getMaterialPurchaseById(
  id: string,
): Promise<MaterialPurchaseWithItems | null> {
  const supabase = await createClient();

  const { data: purchase, error } = await supabase
    .from("material_purchases")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Falha ao carregar compra: ${error.message}`);
  }
  if (!purchase) return null;

  const { data: items, error: itemsError } = await supabase
    .from("material_purchase_items")
    .select("*")
    .eq("purchase_id", id)
    .order("created_at", { ascending: true });

  if (itemsError) {
    throw new Error(`Falha ao carregar itens da compra: ${itemsError.message}`);
  }

  return { ...purchase, items: items ?? [] };
}

export interface MaterialPurchaseInput {
  category: string;
  supplierId: string | null;
  supplierName: string;
  items: MaterialPurchaseItemInput[];
  receiptPath: string | null;
  administratorId: string | null;
}

export async function createMaterialPurchase(
  input: MaterialPurchaseInput,
): Promise<string> {
  const supabase = await createClient();

  const supplierId =
    input.supplierId ?? (await resolveOrCreateSupplier(input.supplierName));

  const { data, error } = await supabase.rpc("create_material_purchase", {
    p_category: input.category,
    p_supplier_id: supplierId,
    p_supplier_name: input.supplierName,
    p_items: input.items,
    p_receipt_path: input.receiptPath,
    p_administrator_id: input.administratorId,
  });

  if (error) {
    throw new Error(`Falha ao registrar compra: ${error.message}`);
  }

  return data;
}

export interface MaterialPurchaseUpdateInput {
  purchaseId: string;
  category: string;
  supplierId: string | null;
  supplierName: string;
  items: MaterialPurchaseItemInput[];
  receiptPath: string | null;
}

export async function updateMaterialPurchase(
  input: MaterialPurchaseUpdateInput,
): Promise<void> {
  const supabase = await createClient();

  const supplierId =
    input.supplierId ?? (await resolveOrCreateSupplier(input.supplierName));

  const { error } = await supabase.rpc("update_material_purchase", {
    p_purchase_id: input.purchaseId,
    p_category: input.category,
    p_supplier_id: supplierId,
    p_supplier_name: input.supplierName,
    p_items: input.items,
    p_receipt_path: input.receiptPath,
  });

  if (error) {
    throw new Error(`Falha ao atualizar compra: ${error.message}`);
  }
}

export async function cancelMaterialPurchase(
  purchaseId: string,
  administratorId: string | null,
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("cancel_material_purchase", {
    p_purchase_id: purchaseId,
    p_administrator_id: administratorId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function updatePurchaseReceiptPath(
  purchaseId: string,
  receiptPath: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("material_purchases")
    .update({ receipt_path: receiptPath })
    .eq("id", purchaseId);

  if (error) {
    throw new Error(`Falha ao vincular comprovante: ${error.message}`);
  }
}

export interface MaterialPurchaseStats {
  totalPurchases: number;
  totalValue: number;
  purchasesThisMonth: number;
  totalItemsPurchased: number;
}

/** Degrada para zeros (nunca lança) — mesmo motivo de `getMaterialPurchases`. */
export async function getMaterialPurchaseStats(): Promise<MaterialPurchaseStats> {
  const supabase = await createClient();
  const now = new Date();

  const { data: purchases, error } = await supabase
    .from("material_purchases")
    .select("id, total_value, status, created_at")
    .eq("status", "ativa");

  if (error) {
    console.error("Falha ao carregar indicadores de compras:", error.message);
    return {
      totalPurchases: 0,
      totalValue: 0,
      purchasesThisMonth: 0,
      totalItemsPurchased: 0,
    };
  }

  const activePurchases = purchases ?? [];
  const purchaseIds = activePurchases.map((p) => p.id);

  let totalItemsPurchased = 0;
  if (purchaseIds.length > 0) {
    const { data: items } = await supabase
      .from("material_purchase_items")
      .select("quantity")
      .in("purchase_id", purchaseIds);
    totalItemsPurchased = (items ?? []).reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
  }

  const purchasesThisMonth = activePurchases.filter((p) => {
    const date = new Date(p.created_at);
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth()
    );
  }).length;

  return {
    totalPurchases: activePurchases.length,
    totalValue: activePurchases.reduce((sum, p) => sum + p.total_value, 0),
    purchasesThisMonth,
    totalItemsPurchased,
  };
}
