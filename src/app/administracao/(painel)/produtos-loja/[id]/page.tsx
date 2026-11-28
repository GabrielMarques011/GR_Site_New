import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { updateProductAction } from "@/features/administration/products/actions";
import { ProductForm } from "@/features/administration/products/product-form";
import { getAdminCampaigns } from "@/services/campaigns";
import { getAdminCategories } from "@/services/categories";
import { getAdminProductById } from "@/services/products";

export const metadata: Metadata = { title: "Editar produto Loja" };

interface EditStoreProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditStoreProductPage({
  params,
}: EditStoreProductPageProps) {
  const { id } = await params;
  const [product, categories, campaigns] = await Promise.all([
    getAdminProductById(id),
    getAdminCategories("loja"),
    getAdminCampaigns(),
  ]);

  if (!product || product.kind !== "loja") {
    notFound();
  }

  async function handleSubmit(formData: FormData) {
    "use server";
    return updateProductAction(id, { error: null }, formData, "loja");
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink-900">
        Editar produto da Loja
      </h1>
      <p className="mt-1 text-sm text-ink-500">{product.name}</p>

      <div className="mt-6 rounded-2xl border border-ink-100 bg-white p-6">
        <ProductForm
          categories={categories}
          campaigns={campaigns}
          product={product}
          onSubmitAction={handleSubmit}
          listPath="/administracao/produtos-loja"
        />
      </div>
    </div>
  );
}
