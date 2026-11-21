import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { ProductsTable } from "@/features/administration/products/products-table";
import { getAdminProducts } from "@/services/products";

export const metadata: Metadata = { title: "Produtos" };

export default async function AdminProductsPage() {
  const products = await getAdminProducts();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900">
            Produtos
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            {products.length} produto(s) cadastrado(s)
          </p>
        </div>
        <Link href="/administracao/produtos/novo" className={buttonVariants()}>
          <Plus className="size-4" /> Novo produto
        </Link>
      </div>

      <div className="mt-6">
        <ProductsTable products={products} />
      </div>
    </div>
  );
}
