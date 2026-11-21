import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { updateCategoryAction } from "@/features/administration/categories/actions";
import { CategoryForm } from "@/features/administration/categories/category-form";
import { getAdminCategories } from "@/services/categories";

export const metadata: Metadata = { title: "Editar categoria" };

interface EditCategoryPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCategoryPage({
  params,
}: EditCategoryPageProps) {
  const { id } = await params;
  const categories = await getAdminCategories();
  const category = categories.find((item) => item.id === id);

  if (!category) {
    notFound();
  }

  async function handleSubmit(formData: FormData) {
    "use server";
    return updateCategoryAction(id, { error: null }, formData);
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink-900">
        Editar categoria
      </h1>
      <p className="mt-1 text-sm text-ink-500">{category.name}</p>

      <div className="mt-6 max-w-xl rounded-2xl border border-ink-100 bg-white p-6">
        <CategoryForm category={category} onSubmitAction={handleSubmit} />
      </div>
    </div>
  );
}
