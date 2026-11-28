import type { Metadata } from "next";

import { createCategoryAction } from "@/features/administration/categories/actions";
import { CategoryForm } from "@/features/administration/categories/category-form";
import type { ProductKind } from "@/types/domain";

export const metadata: Metadata = { title: "Nova categoria" };

interface NewCategoryPageProps {
  searchParams: Promise<{ segmento?: string }>;
}

export default async function NewCategoryPage({
  searchParams,
}: NewCategoryPageProps) {
  const { segmento } = await searchParams;
  const kind: ProductKind = segmento === "loja" ? "loja" : "personalizado";

  async function handleSubmit(formData: FormData) {
    "use server";
    return createCategoryAction(kind, { error: null }, formData);
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink-900">
        Nova categoria {kind === "loja" ? "(Loja)" : ""}
      </h1>

      <div className="mt-6 max-w-xl rounded-2xl border border-ink-100 bg-white p-6">
        <CategoryForm
          onSubmitAction={handleSubmit}
          listPath={
            kind === "loja"
              ? "/administracao/categorias?segmento=loja"
              : "/administracao/categorias"
          }
        />
      </div>
    </div>
  );
}
