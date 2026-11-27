"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileText, Pencil, Undo2 } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/currency";
import type { Category, MaterialPurchaseWithItems } from "@/types/domain";

import { cancelPurchaseAction } from "./actions";
import type { PickerProduct } from "./product-picker";
import { PurchaseForm } from "./purchase-form";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

export function PurchaseDetail({
  purchase,
  receiptUrl,
  administratorName,
  products,
  categories,
  suppliers,
}: {
  purchase: MaterialPurchaseWithItems;
  receiptUrl: string | null;
  administratorName: string | null;
  products: PickerProduct[];
  categories: Category[];
  suppliers: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleCancelPurchase() {
    if (
      !confirm(
        "Tem certeza que deseja cancelar (estornar) esta compra? O estoque dos produtos será revertido.",
      )
    ) {
      return;
    }
    setCancelError(null);
    startTransition(async () => {
      const result = await cancelPurchaseAction(purchase.id);
      if (result.error) {
        setCancelError(result.error);
        return;
      }
      router.refresh();
    });
  }

  if (editing) {
    return (
      <div className="rounded-2xl border border-ink-100 bg-white p-5 sm:p-6">
        <PurchaseForm
          mode="edit"
          purchase={purchase}
          products={products}
          categories={categories}
          suppliers={suppliers}
          onSaved={() => {
            setEditing(false);
            router.refresh();
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {cancelError && <Alert variant="danger">{cancelError}</Alert>}

      <div className="rounded-2xl border border-ink-100 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-lg font-semibold text-ink-900">
                {purchase.supplier_name_snapshot}
              </h2>
              <Badge variant="lilac">{purchase.category}</Badge>
              {purchase.status === "cancelada" && (
                <Badge variant="danger">Cancelada</Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-ink-500">
              Registrada em{" "}
              {dateFormatter.format(new Date(purchase.created_at))}
              {administratorName && ` por ${administratorName}`}
            </p>
            {purchase.status === "cancelada" && purchase.cancelled_at && (
              <p className="mt-1 text-sm text-danger-600">
                Cancelada em{" "}
                {dateFormatter.format(new Date(purchase.cancelled_at))}
              </p>
            )}
          </div>

          {purchase.status === "ativa" && (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditing(true)}
              >
                <Pencil className="size-3.5" /> Editar
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={handleCancelPurchase}
                isLoading={pending}
              >
                <Undo2 className="size-3.5" /> Cancelar / estornar
              </Button>
            </div>
          )}
        </div>

        <ul className="mt-4 space-y-2 border-t border-ink-100 pt-4 text-sm">
          {purchase.items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-4"
            >
              <span className="text-ink-700">
                {item.quantity}x {item.product_name_snapshot}
              </span>
              <span className="text-ink-500">
                {formatCurrency(item.unit_price)} un. ·{" "}
                <span className="font-medium text-ink-900">
                  {formatCurrency(item.subtotal)}
                </span>
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-4">
          {receiptUrl ? (
            <a
              href={receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-lilac-700 hover:underline"
            >
              <FileText className="size-4" /> Ver comprovante
            </a>
          ) : (
            <span className="text-sm text-ink-400">
              Sem comprovante anexado
            </span>
          )}

          <p className="font-display text-xl font-semibold text-ink-900">
            Total {formatCurrency(purchase.total_value)}
          </p>
        </div>
      </div>
    </div>
  );
}
