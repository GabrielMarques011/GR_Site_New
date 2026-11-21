import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { CategoriesTable } from "@/features/administration/categories/categories-table";
import { getAdminCategories } from "@/services/categories";

export const metadata: Metadata = { title: "Categorias" };

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900">
            Categorias
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            {categories.length} categoria(s) cadastrada(s)
          </p>
        </div>
        <Link
          href="/administracao/categorias/nova"
          className={buttonVariants()}
        >
          <Plus className="size-4" /> Nova categoria
        </Link>
      </div>

      <div className="mt-6">
        <CategoriesTable categories={categories} />
      </div>
    </div>
  );
}
