import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductDetailView } from "@/components/store/product-detail-view";
import { getProductBySlug } from "@/services/products";

interface StoreProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: StoreProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug, "loja");

  if (!product) return { title: "Produto não encontrado" };

  return {
    title: product.name,
    description: product.description?.slice(0, 160) ?? undefined,
  };
}

export default async function StoreProductPage({
  params,
}: StoreProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug, "loja");

  if (!product) {
    notFound();
  }

  return (
    <ProductDetailView
      product={product}
      listHref="/loja"
      listLabel="Loja"
      categoryHref={(slug) => `/loja?categoria=${slug}`}
    />
  );
}
