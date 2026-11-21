import "server-only";

import { createClient } from "@/lib/supabase/server";
import { computeProductPricing } from "@/features/promotions/pricing";
import type { ProductFormValues } from "@/lib/validations/product";
import type { Product, ProductFilters } from "@/types/domain";

import { deleteAllProductImages } from "./product-images";

const PRODUCT_FIELDS = `
  id, category_id, name, slug, description, price, promotional_price,
  promotion_start, promotion_end, sku, stock_quantity, featured, active,
  display_order, created_at, updated_at,
  images:product_images ( id, product_id, storage_path, image_url, alt_text, display_order, created_at )
`;

const PRODUCT_SELECT = `${PRODUCT_FIELDS}, category:categories ( id, name, slug )`;
const PRODUCT_SELECT_CATEGORY_INNER = `${PRODUCT_FIELDS}, category:categories!inner ( id, name, slug )`;

function sortImages(product: Product): Product {
  return {
    ...product,
    images: [...product.images].sort(
      (a, b) => a.display_order - b.display_order,
    ),
  };
}

export async function getPublicProducts(filters: ProductFilters = {}): Promise<{
  items: Product[];
  total: number;
}> {
  const supabase = await createClient();

  let query = filters.categorySlug
    ? supabase
        .from("products")
        .select(PRODUCT_SELECT_CATEGORY_INNER)
        .eq("active", true)
        .eq("category.slug", filters.categorySlug)
    : supabase.from("products").select(PRODUCT_SELECT).eq("active", true);

  if (filters.search) {
    query = query.ilike("name", `%${filters.search}%`);
  }

  if (filters.featuredOnly) {
    query = query.eq("featured", true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Falha ao carregar produtos: ${error.message}`);
  }

  let items = (data ?? []).map((row) => sortImages(row as unknown as Product));

  if (filters.promotionsOnly) {
    items = items.filter((p) => computeProductPricing(p).isPromotionActive);
  }

  const sort = filters.sort ?? "relevance";
  items = [...items].sort((a, b) => {
    switch (sort) {
      case "price_asc":
        return (
          computeProductPricing(a).finalPrice -
          computeProductPricing(b).finalPrice
        );
      case "price_desc":
        return (
          computeProductPricing(b).finalPrice -
          computeProductPricing(a).finalPrice
        );
      case "name_asc":
        return a.name.localeCompare(b.name, "pt-BR");
      default:
        return (
          a.display_order - b.display_order ||
          a.name.localeCompare(b.name, "pt-BR")
        );
    }
  });

  const total = items.length;
  const pageSize = filters.pageSize ?? 24;
  const page = filters.page ?? 1;
  const start = (page - 1) * pageSize;
  const paginated = items.slice(start, start + pageSize);

  return { items: paginated, total };
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    throw new Error(`Falha ao carregar produto: ${error.message}`);
  }

  return data ? sortImages(data as unknown as Product) : null;
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const { items } = await getPublicProducts({
    featuredOnly: true,
    pageSize: limit,
  });
  return items;
}

export async function getPromotionalProducts(limit = 8): Promise<Product[]> {
  const { items } = await getPublicProducts({
    promotionsOnly: true,
    pageSize: limit,
  });
  return items;
}

/**
 * Capas de produtos ativos para usar como fundo decorativo (ex.: hero da
 * home). Prioriza destaques, depois completa com os demais produtos
 * ativos, sempre uma imagem por produto, sem repetir.
 */
export async function getHeroShowcaseImages(limit = 6): Promise<string[]> {
  const [{ items: featuredItems }, { items: recentItems }] = await Promise.all([
    getPublicProducts({ featuredOnly: true, pageSize: limit }),
    getPublicProducts({ pageSize: limit }),
  ]);

  const urls: string[] = [];
  for (const product of [...featuredItems, ...recentItems]) {
    const cover = product.images[0]?.image_url;
    if (cover && !urls.includes(cover)) {
      urls.push(cover);
    }
    if (urls.length >= limit) break;
  }

  return urls;
}

/** Busca produtos por ID para revalidar preços no servidor (carrinho/WhatsApp). */
export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .in("id", ids)
    .eq("active", true);

  if (error) {
    throw new Error(
      `Falha ao revalidar produtos do carrinho: ${error.message}`,
    );
  }

  return (data ?? []).map((row) => sortImages(row as unknown as Product));
}

// ---------------------------------------------------------------------------
// Administração (requer sessão com role admin — reforçado por RLS no banco)
// ---------------------------------------------------------------------------

export async function getAdminProducts(): Promise<Product[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .order("display_order", { ascending: true });

  if (error) {
    throw new Error(`Falha ao carregar produtos (admin): ${error.message}`);
  }

  return (data ?? []).map((row) => sortImages(row as unknown as Product));
}

export async function getAdminProductById(id: string): Promise<Product | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Falha ao carregar produto (admin): ${error.message}`);
  }

  return data ? sortImages(data as unknown as Product) : null;
}

function toProductPayload(values: ProductFormValues) {
  return {
    name: values.name,
    slug: values.slug,
    description: values.description || null,
    category_id: values.category_id,
    price: values.price,
    promotional_price: values.promotional_price ?? null,
    promotion_start: values.promotion_start || null,
    promotion_end: values.promotion_end || null,
    sku: values.sku || null,
    stock_quantity: values.stock_quantity ?? null,
    featured: values.featured,
    active: values.active,
    display_order: values.display_order,
  };
}

export async function createProduct(
  values: ProductFormValues,
): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .insert(toProductPayload(values))
    .select("id")
    .single();

  if (error) {
    throw new Error(`Falha ao criar produto: ${error.message}`);
  }

  return data.id;
}

export async function updateProduct(
  id: string,
  values: ProductFormValues,
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("products")
    .update(toProductPayload(values))
    .eq("id", id);

  if (error) {
    throw new Error(`Falha ao atualizar produto: ${error.message}`);
  }
}

export async function setProductActive(
  id: string,
  active: boolean,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ active })
    .eq("id", id);

  if (error) {
    throw new Error(`Falha ao atualizar status do produto: ${error.message}`);
  }
}

export async function deleteProduct(id: string): Promise<void> {
  await deleteAllProductImages(id);

  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    throw new Error(`Falha ao excluir produto: ${error.message}`);
  }
}
