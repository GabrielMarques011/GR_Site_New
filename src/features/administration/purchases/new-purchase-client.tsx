"use client";

import { useRouter } from "next/navigation";

import type { PickerProduct } from "./product-picker";
import { PurchaseForm } from "./purchase-form";
import type { Category } from "@/types/domain";

export function NewPurchaseClient({
  products,
  categories,
  suppliers,
}: {
  products: PickerProduct[];
  categories: Category[];
  suppliers: { id: string; name: string }[];
}) {
  const router = useRouter();

  return (
    <PurchaseForm
      mode="create"
      products={products}
      categories={categories}
      suppliers={suppliers}
      onSaved={(purchaseId) => {
        router.push(`/administracao/compras/${purchaseId}`);
      }}
    />
  );
}
