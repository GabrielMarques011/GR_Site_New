import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PackageSearch } from "lucide-react";

import { Pagination } from "@/components/store/pagination";
import { ProductCard } from "@/components/store/product-card";
import { getCategoryBySlug } from "@/services/categories";
import { getPublicProducts } from "@/services/products";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

const PAGE_SIZE = 12;

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Categoria não encontrada" };
  return {
    title: category.name,
    description: category.description ?? undefined,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { slug } = await params;
  const search = await searchParams;
  const page = Math.max(1, Number(search.pagina ?? "1") || 1);

  const category = await getCategoryBySlug(slug);
  if (!category) {
    notFound();
  }

  const { items, total } = await getPublicProducts({
    categorySlug: slug,
    page,
    pageSize: PAGE_SIZE,
  });

  return (
    <div className="container-page py-10">
      <h1 className="font-display text-3xl font-semibold text-ink-900">
        {category.name}
      </h1>
      {category.description && (
        <p className="mt-1 text-ink-700">{category.description}</p>
      )}

      {items.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-3 text-center text-ink-500">
          <PackageSearch className="size-10" />
          <p>Ainda não há produtos nesta categoria.</p>
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
            basePath={`/categorias/${slug}`}
            searchParams={search}
          />
        </>
      )}
    </div>
  );
}
