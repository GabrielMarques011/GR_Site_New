import "server-only";

import { createClient } from "@/lib/supabase/server";
import { computeProductPricing } from "@/features/promotions/pricing";
import type { ProductFormValues } from "@/lib/validations/product";
import type { Product, ProductFilters } from "@/types/domain";

import { deleteAllProductImages } from "./product-images";
import { getActiveProductOptions, getProductOptions } from "./product-options";

const PRODUCT_FIELDS = `
  id, category_id, name, slug, description, price, promotional_price,
  promotion_start, promotion_end, sku, stock_quantity, featured, active,
  display_order, created_at, updated_at,
  images:product_images ( id, product_id, storage_path, image_url, alt_text, display_order, created_at )
`;

const PRODUCT_SELECT = `${PRODUCT_FIELDS}, category:categories ( id, name, slug )`;
const PRODUCT_SELECT_CATEGORY_INNER = `${PRODUCT_FIELDS}, category:categories!inner ( id, name, slug )`;
const PRODUCT_SELECT_CAMPAIGN_INNER = `${PRODUCT_FIELDS}, campaign:seasonal_campaigns!inner ( id, slug, name )`;

function sortImages(product: Product): Product {
  return {
    ...product,
    images: [...product.images].sort(
      (a, b) => a.display_order - b.display_order,
    ),
    // As opções (subprodutos) não fazem parte do `PRODUCT_SELECT` — ver
    // `getProductBySlug`/`getAdminProductById`, os dois únicos lugares que
    // realmente precisam delas (a vitrine/listagem não mostra seletor de
    // opção). Aqui só garante o valor padrão seguro para o resto das
    // funções que reusam este helper.
    options: product.options ?? [],
  };
}

export async function getPublicProducts(filters: ProductFilters = {}): Promise<{
  items: Product[];
  total: number;
}> {
  const supabase = await createClient();

  let query = filters.campaignSlug
    ? supabase
        .from("products")
        .select(PRODUCT_SELECT_CAMPAIGN_INNER)
        .eq("active", true)
        .eq("campaign.slug", filters.campaignSlug)
    : filters.categorySlug
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
    if (filters.campaignSlug) {
      // A tabela/coluna de campanhas pode ainda não existir (migration
      // 0003 pendente) — trata como "nenhum produto nessa campanha" em vez
      // de quebrar a página. Esse filtro só é alcançável por um link
      // gerado a partir de uma campanha que já carregou com sucesso, mas
      // alguém pode acessar a URL diretamente antes da migration rodar.
      console.error("Falha ao filtrar produtos por campanha:", error.message);
      return { items: [], total: 0 };
    }
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

  if (!data) return null;

  const product = sortImages(data as unknown as Product);
  product.options = await getActiveProductOptions(product.id);
  return product;
}

export interface HomeShowcase {
  homeProducts: Product[];
  promotional: Product[];
  heroImages: string[];
}

/**
 * Busca TODOS os produtos ativos uma única vez e deriva, a partir desse
 * mesmo resultado, a vitrine de produtos da home, as promoções e as fotos
 * do hero — em vez de repetir a mesma consulta ao Supabase várias vezes.
 *
 * `homeProducts` prioriza os marcados como destaque, mas sempre completa
 * com os demais produtos ativos até o limite — assim a home sempre mostra
 * produtos de verdade para quem entra, mesmo antes de a proprietária
 * marcar algum como "destaque".
 */
export async function getHomeShowcase(
  limits: {
    homeProducts?: number;
    promotional?: number;
    heroImages?: number;
  } = {},
): Promise<HomeShowcase> {
  const { items: allActive } = await getPublicProducts({ pageSize: 100 });

  const homeProductsLimit = limits.homeProducts ?? 8;
  const featuredFirst = allActive.filter((product) => product.featured);
  const homeProducts = [
    ...featuredFirst,
    ...allActive.filter((product) => !product.featured),
  ].slice(0, homeProductsLimit);

  const promotional = allActive
    .filter((product) => computeProductPricing(product).isPromotionActive)
    .slice(0, limits.promotional ?? 8);

  const heroImages: string[] = [];
  for (const product of homeProducts) {
    const cover = product.images[0]?.image_url;
    if (cover && !heroImages.includes(cover)) {
      heroImages.push(cover);
    }
    if (heroImages.length >= (limits.heroImages ?? 6)) break;
  }

  return { homeProducts, promotional, heroImages };
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

  if (!data) return null;

  const product = sortImages(data as unknown as Product);
  product.options = await getProductOptions(product.id);

  // campaign_id não faz parte do PRODUCT_SELECT (evita que toda listagem de
  // produtos dependa dessa coluna nova); buscado à parte, só para
  // pré-preencher o seletor de tema na edição. Se a coluna ainda não
  // existir (migration 0003 pendente), a edição do produto continua
  // funcionando normalmente, só sem tema pré-selecionado.
  const { data: campaignRow, error: campaignError } = await supabase
    .from("products")
    .select("campaign_id")
    .eq("id", id)
    .maybeSingle();

  if (campaignError) {
    console.error(
      "Falha ao carregar a campanha do produto:",
      campaignError.message,
    );
  }

  product.campaign_id = campaignRow?.campaign_id ?? null;

  return product;
}

function toProductPayload(values: ProductFormValues) {
  return {
    name: values.name,
    slug: values.slug,
    description: values.description || null,
    category_id: values.category_id,
    campaign_id: values.campaign_id ?? null,
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
  const payload = toProductPayload(values);

  const result = await supabase
    .from("products")
    .insert(payload)
    .select("id")
    .single();

  if (result.error) {
    // Pode ser a coluna campaign_id ainda não existir (migration 0003
    // pendente) — tenta de novo sem ela antes de desistir, para a criação
    // de produto nunca quebrar por causa de um campo novo e opcional.
    const { campaign_id, ...fallbackPayload } = payload;
    void campaign_id;
    const retry = await supabase
      .from("products")
      .insert(fallbackPayload)
      .select("id")
      .single();

    if (retry.error) {
      throw new Error(`Falha ao criar produto: ${result.error.message}`);
    }

    console.error(
      "Produto criado sem campanha sazonal (coluna pendente de migration):",
      result.error.message,
    );
    return retry.data.id;
  }

  return result.data.id;
}

export async function updateProduct(
  id: string,
  values: ProductFormValues,
): Promise<void> {
  const supabase = await createClient();
  const payload = toProductPayload(values);

  const result = await supabase.from("products").update(payload).eq("id", id);

  if (result.error) {
    // Mesma degradação do createProduct: se a coluna campaign_id ainda não
    // existir, tenta salvar o resto das alterações sem ela.
    const { campaign_id, ...fallbackPayload } = payload;
    void campaign_id;
    const retry = await supabase
      .from("products")
      .update(fallbackPayload)
      .eq("id", id);

    if (retry.error) {
      throw new Error(`Falha ao atualizar produto: ${result.error.message}`);
    }

    console.error(
      "Produto atualizado sem campanha sazonal (coluna pendente de migration):",
      result.error.message,
    );
    return;
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
