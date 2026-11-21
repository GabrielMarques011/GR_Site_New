import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  totalCategories: number;
  promotionalProducts: number;
  featuredProducts: number;
}

async function countProducts(filter?: {
  active?: boolean;
  featured?: boolean;
}): Promise<number> {
  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select("id", { count: "exact", head: true });

  if (filter?.active !== undefined) query = query.eq("active", filter.active);
  if (filter?.featured !== undefined)
    query = query.eq("featured", filter.featured);

  const { count, error } = await query;
  if (error) {
    throw new Error(
      `Falha ao calcular estatísticas de produtos: ${error.message}`,
    );
  }
  return count ?? 0;
}

async function countCategories(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("categories")
    .select("id", { count: "exact", head: true });

  if (error) {
    throw new Error(
      `Falha ao calcular estatísticas de categorias: ${error.message}`,
    );
  }
  return count ?? 0;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();

  const [totalProducts, activeProducts, totalCategories, featuredProducts] =
    await Promise.all([
      countProducts(),
      countProducts({ active: true }),
      countCategories(),
      countProducts({ featured: true }),
    ]);

  const nowIso = new Date().toISOString();
  const { count: promotionalProducts, error: promoError } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("active", true)
    .not("promotional_price", "is", null)
    .or(`promotion_start.is.null,promotion_start.lte.${nowIso}`)
    .or(`promotion_end.is.null,promotion_end.gte.${nowIso}`);

  if (promoError) {
    throw new Error(
      `Falha ao calcular produtos em promoção: ${promoError.message}`,
    );
  }

  return {
    totalProducts,
    activeProducts,
    inactiveProducts: totalProducts - activeProducts,
    totalCategories,
    promotionalProducts: promotionalProducts ?? 0,
    featuredProducts,
  };
}
