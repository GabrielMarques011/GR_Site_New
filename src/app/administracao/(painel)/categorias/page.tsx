import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { CategoriesTable } from "@/features/administration/categories/categories-table";
import { getAdminCategories } from "@/services/categories";
import type { ProductKind } from "@/types/domain";

export const metadata: Metadata = { title: "Categorias" };

interface AdminCategoriesPageProps {
  searchParams: Promise<{ segmento?: string }>;
}

const TABS: { kind: ProductKind; label: string }[] = [
  { kind: "personalizado", label: "Personalizados" },
  { kind: "loja", label: "Loja" },
];

export default async function AdminCategoriesPage({
  searchParams,
}: AdminCategoriesPageProps) {
  const { segmento } = await searchParams;
  const kind: ProductKind = segmento === "loja" ? "loja" : "personalizado";
  const categories = await getAdminCategories(kind);

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
          href={`/administracao/categorias/nova${kind === "loja" ? "?segmento=loja" : ""}`}
          className={buttonVariants()}
        >
          <Plus className="size-4" /> Nova categoria
        </Link>
      </div>

      <div className="mt-6 flex gap-1 border-b border-ink-100">
        {TABS.map((tab) => (
          <Link
            key={tab.kind}
            href={
              tab.kind === "personalizado"
                ? "/administracao/categorias"
                : "/administracao/categorias?segmento=loja"
            }
            className={cn(
              "border-b-2 px-4 py-2 text-sm font-medium",
              kind === tab.kind
                ? "border-lilac-600 text-lilac-800"
                : "border-transparent text-ink-500 hover:text-ink-700",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="mt-6">
        <CategoriesTable categories={categories} />
      </div>
    </div>
  );
}
