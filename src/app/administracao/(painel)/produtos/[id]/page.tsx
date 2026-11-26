import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { updateProductAction } from "@/features/administration/products/actions";
import { ProductForm } from "@/features/administration/products/product-form";
import { getAdminCampaigns } from "@/services/campaigns";
import { getAdminCategories } from "@/services/categories";
import { getAdminProductById } from "@/services/products";

export const metadata: Metadata = { title: "Editar produto" };

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const { id } = await params;
  const [product, categories, campaigns] = await Promise.all([
    getAdminProductById(id),
    getAdminCategories(),
    getAdminCampaigns(),
  ]);

  if (!product) {
    notFound();
  }

  async function handleSubmit(formData: FormData) {
    "use server";
    return updateProductAction(id, { error: null }, formData);
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink-900">
        Editar produto
      </h1>
      <p className="mt-1 text-sm text-ink-500">{product.name}</p>

      <div className="mt-6 rounded-2xl border border-ink-100 bg-white p-6">
        <ProductForm
          categories={categories}
          campaigns={campaigns}
          product={product}
          onSubmitAction={handleSubmit}
        />
      </div>
    </div>
  );
}
