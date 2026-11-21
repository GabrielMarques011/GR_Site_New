import type { Metadata } from "next";

import { createProductAction } from "@/features/administration/products/actions";
import { ProductForm } from "@/features/administration/products/product-form";
import { getAdminCategories } from "@/services/categories";

export const metadata: Metadata = { title: "Novo produto" };

export default async function NewProductPage() {
  const categories = await getAdminCategories();

  async function handleSubmit(formData: FormData) {
    "use server";
    return createProductAction({ error: null }, formData);
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink-900">
        Novo produto
      </h1>
      <p className="mt-1 text-sm text-ink-500">
        Salve o produto primeiro para depois adicionar as imagens.
      </p>

      <div className="mt-6 rounded-2xl border border-ink-100 bg-white p-6">
        <ProductForm categories={categories} onSubmitAction={handleSubmit} />
      </div>
    </div>
  );
}
