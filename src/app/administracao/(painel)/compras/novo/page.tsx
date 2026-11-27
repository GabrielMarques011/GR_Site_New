import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { NewPurchaseClient } from "@/features/administration/purchases/new-purchase-client";
import { getAdminCategories } from "@/services/categories";
import { getAdminProducts } from "@/services/products";
import { getSuppliers } from "@/services/suppliers";

export const metadata: Metadata = { title: "Nova Compra" };

export default async function AdminNovaCompraPage() {
  const [products, categories, suppliers] = await Promise.all([
    getAdminProducts(),
    getAdminCategories(),
    getSuppliers(),
  ]);

  return (
    <div>
      <Link
        href="/administracao/compras"
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        <ArrowLeft className="size-4" /> Voltar
      </Link>

      <h1 className="mt-3 font-display text-2xl font-semibold text-ink-900">
        Nova compra de materiais
      </h1>
      <p className="mt-1 text-sm text-ink-500">
        Registre os produtos adquiridos — o estoque de cada um é atualizado
        automaticamente ao salvar.
      </p>

      <div className="mt-6 max-w-3xl rounded-2xl border border-ink-100 bg-white p-5 sm:p-6">
        <NewPurchaseClient
          products={products.map((p) => ({
            id: p.id,
            name: p.name,
            stock_quantity: p.stock_quantity,
          }))}
          categories={categories}
          suppliers={suppliers.map((s) => ({ id: s.id, name: s.name }))}
        />
      </div>
    </div>
  );
}
