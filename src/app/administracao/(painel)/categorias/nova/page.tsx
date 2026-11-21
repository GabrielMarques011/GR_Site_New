import type { Metadata } from "next";

import { createCategoryAction } from "@/features/administration/categories/actions";
import { CategoryForm } from "@/features/administration/categories/category-form";

export const metadata: Metadata = { title: "Nova categoria" };

export default function NewCategoryPage() {
  async function handleSubmit(formData: FormData) {
    "use server";
    return createCategoryAction({ error: null }, formData);
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink-900">
        Nova categoria
      </h1>

      <div className="mt-6 max-w-xl rounded-2xl border border-ink-100 bg-white p-6">
        <CategoryForm onSubmitAction={handleSubmit} />
      </div>
    </div>
  );
}
