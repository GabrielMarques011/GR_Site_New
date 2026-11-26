import type { Metadata } from "next";
import { PackageSearch } from "lucide-react";

import { CatalogToolbar } from "@/components/store/catalog-toolbar";
import { Pagination } from "@/components/store/pagination";
import { ProductCard } from "@/components/store/product-card";
import { getActiveCategories } from "@/services/categories";
import { getPublicProducts } from "@/services/products";
import type { ProductSortOption } from "@/types/domain";

export const metadata: Metadata = {
  title: "Produtos",
  description: "Conheça os produtos personalizados da GR Design.",
};

const SORT_VALUES: ProductSortOption[] = [
  "relevance",
  "price_asc",
  "price_desc",
  "name_asc",
];
const PAGE_SIZE = 12;

interface ProdutosPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function ProdutosPage({
  searchParams,
}: ProdutosPageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.pagina ?? "1") || 1);
  const sort = SORT_VALUES.includes(params.ordenar as ProductSortOption)
    ? (params.ordenar as ProductSortOption)
    : "relevance";

  const [{ items, total }, categories] = await Promise.all([
    getPublicProducts({
      search: params.busca,
      categorySlug: params.categoria,
      campaignSlug: params.campanha,
      sort,
      featuredOnly: params.destaque === "1",
      promotionsOnly: params.promocao === "1",
      page,
      pageSize: PAGE_SIZE,
    }),
    getActiveCategories(),
  ]);

  return (
    <div className="container-page py-10">
      <h1 className="font-display text-3xl font-semibold text-ink-900">
        Produtos
      </h1>
      <p className="mt-1 text-ink-700">
        Encontre o produto personalizado ideal para você.
      </p>

      <div className="mt-6">
        <CatalogToolbar categories={categories} />
      </div>

      {items.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-3 text-center text-ink-500">
          <PackageSearch className="size-10" />
          <p>Nenhum produto encontrado com esses filtros.</p>
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            basePath="/produtos"
            searchParams={params}
          />
        </>
      )}
    </div>
  );
}
