import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductDetailView } from "@/components/store/product-detail-view";
import { getProductBySlug } from "@/services/products";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug, "personalizado");

  if (!product) return { title: "Produto não encontrado" };

  return {
    title: product.name,
    description: product.description?.slice(0, 160) ?? undefined,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug, "personalizado");

  if (!product) {
    notFound();
  }

  return (
    <ProductDetailView
      product={product}
      listHref="/produtos"
      listLabel="Produtos"
      categoryHref={(slug) => `/categorias/${slug}`}
    />
  );
}
