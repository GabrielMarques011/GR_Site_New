import type { Metadata } from "next";

import { CategoryCard } from "@/components/store/category-card";
import { getActiveCategories } from "@/services/categories";

export const metadata: Metadata = {
  title: "Categorias",
  description: "Explore as categorias de produtos personalizados da GR Design.",
};

export default async function CategoriasPage() {
  const categories = await getActiveCategories();

  return (
    <div className="container-page py-10">
      <h1 className="font-display text-3xl font-semibold text-ink-900">
        Categorias
      </h1>
      <p className="mt-1 text-ink-700">
        Navegue pelos nossos produtos por categoria.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {categories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>
    </div>
  );
}
