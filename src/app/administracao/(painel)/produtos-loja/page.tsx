import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { StoreProductsFilters } from "@/features/administration/products/store-products-filters";
import { getAdminCategories } from "@/services/categories";
import { getAdminProducts } from "@/services/products";

export const metadata: Metadata = { title: "Produtos Loja" };

export default async function AdminStoreProductsPage() {
  const [products, categories] = await Promise.all([
    getAdminProducts("loja"),
    getAdminCategories("loja"),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900">
            Produtos Loja
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            {products.length} produto(s) cadastrado(s) — acessórios, papelaria e
            outros itens de pronta entrega.
          </p>
        </div>
        <Link
          href="/administracao/produtos-loja/novo"
          className={buttonVariants()}
        >
          <Plus className="size-4" /> Novo produto
        </Link>
      </div>

      <div className="mt-6">
        <StoreProductsFilters products={products} categories={categories} />
      </div>
    </div>
  );
}
