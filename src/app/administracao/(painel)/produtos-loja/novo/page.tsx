import type { Metadata } from "next";

import { createProductAction } from "@/features/administration/products/actions";
import { ProductForm } from "@/features/administration/products/product-form";
import { getAdminCampaigns } from "@/services/campaigns";
import { getAdminCategories } from "@/services/categories";

export const metadata: Metadata = { title: "Novo produto Loja" };

export default async function NewStoreProductPage() {
  const [categories, campaigns] = await Promise.all([
    getAdminCategories("loja"),
    getAdminCampaigns(),
  ]);

  async function handleSubmit(formData: FormData) {
    "use server";
    return createProductAction({ error: null }, formData, "loja");
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink-900">
        Novo produto da Loja
      </h1>
      <p className="mt-1 text-sm text-ink-500">
        Salve o produto primeiro para depois adicionar as imagens.
      </p>

      <div className="mt-6 rounded-2xl border border-ink-100 bg-white p-6">
        <ProductForm
          categories={categories}
          campaigns={campaigns}
          onSubmitAction={handleSubmit}
          listPath="/administracao/produtos-loja"
        />
      </div>
    </div>
  );
}
