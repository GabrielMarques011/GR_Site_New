import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { PurchaseDetail } from "@/features/administration/purchases/purchase-detail";
import { getAdminProfiles } from "@/services/admin-profiles";
import { getMaterialPurchaseById } from "@/services/material-purchases";
import { getAdminCategories } from "@/services/categories";
import { getAdminProducts } from "@/services/products";
import { getReceiptSignedUrl } from "@/services/purchase-receipts";
import { getSuppliers } from "@/services/suppliers";

export const metadata: Metadata = { title: "Detalhes da compra" };

export default async function AdminCompraDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const purchase = await getMaterialPurchaseById(id);

  if (!purchase) notFound();

  const [products, categories, suppliers, admins, receiptUrl] =
    await Promise.all([
      getAdminProducts(),
      getAdminCategories(),
      getSuppliers(),
      getAdminProfiles(),
      purchase.receipt_path
        ? getReceiptSignedUrl(purchase.receipt_path)
        : Promise.resolve(null),
    ]);

  const administratorName =
    admins.find((a) => a.userId === purchase.administrator_id)?.name ?? null;

  return (
    <div>
      <Link
        href="/administracao/compras"
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        <ArrowLeft className="size-4" /> Voltar
      </Link>

      <div className="mt-3 max-w-3xl">
        <PurchaseDetail
          purchase={purchase}
          receiptUrl={receiptUrl}
          administratorName={administratorName}
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
