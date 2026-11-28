import type { Metadata } from "next";
import { PackageSearch } from "lucide-react";

import { CatalogToolbar } from "@/components/store/catalog-toolbar";
import { Pagination } from "@/components/store/pagination";
import { ProductCard } from "@/components/store/product-card";
import { getActiveCategories } from "@/services/categories";
import { getPublicProducts } from "@/services/products";
import type { ProductSortOption } from "@/types/domain";

export const metadata: Metadata = {
  title: "Loja",
  description:
    "Acessórios, papelaria e outros itens de pronta entrega da GR Design.",
};

const SORT_VALUES: ProductSortOption[] = [
  "relevance",
  "price_asc",
  "price_desc",
  "name_asc",
];
const PAGE_SIZE = 12;

interface LojaPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function LojaPage({ searchParams }: LojaPageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.pagina ?? "1") || 1);
  const sort = SORT_VALUES.includes(params.ordenar as ProductSortOption)
    ? (params.ordenar as ProductSortOption)
    : "relevance";

  const [{ items, total }, categories] = await Promise.all([
    getPublicProducts({
      kind: "loja",
      search: params.busca,
      categorySlug: params.categoria,
      sort,
      promotionsOnly: params.promocao === "1",
      page,
      pageSize: PAGE_SIZE,
    }),
    getActiveCategories("loja"),
  ]);

  return (
    <div className="container-page py-10">
      <h1 className="font-display text-3xl font-semibold text-ink-900">Loja</h1>
      <p className="mt-1 text-ink-700">
        Acessórios, papelaria e outros itens de pronta entrega.
      </p>

      <div className="mt-6">
        <CatalogToolbar categories={categories} basePath="/loja" />
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
              <ProductCard
                key={product.id}
                product={product}
                basePath="/loja"
              />
            ))}
          </div>
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            basePath="/loja"
            searchParams={params}
          />
        </>
      )}
    </div>
  );
}
