import Link from "next/link";
import { Paperclip } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils/currency";
import type { MaterialPurchase } from "@/types/domain";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

export function PurchasesList({
  purchases,
  itemCounts,
  adminNames,
}: {
  purchases: MaterialPurchase[];
  itemCounts: Map<string, number>;
  adminNames: Map<string, string>;
}) {
  if (purchases.length === 0) {
    return (
      <p className="py-10 text-center text-ink-500">
        Nenhuma compra registrada ainda.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {purchases.map((purchase) => (
        <Link
          key={purchase.id}
          href={`/administracao/compras/${purchase.id}`}
          className="focus-ring block rounded-2xl border border-ink-100 bg-white p-5 hover:border-lilac-200"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-ink-900">
                  {purchase.supplier_name_snapshot}
                </p>
                <Badge variant="lilac">{purchase.category}</Badge>
                {purchase.status === "cancelada" && (
                  <Badge variant="danger">Cancelada</Badge>
                )}
                {purchase.receipt_path && (
                  <span
                    title="Tem comprovante anexado"
                    className="text-ink-400"
                  >
                    <Paperclip className="size-3.5" />
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-ink-500">
                {itemCounts.get(purchase.id) ?? 0} produto(s) ·{" "}
                {dateFormatter.format(new Date(purchase.created_at))}
                {purchase.administrator_id &&
                  adminNames.get(purchase.administrator_id) &&
                  ` · ${adminNames.get(purchase.administrator_id)}`}
              </p>
            </div>

            <p className="font-display text-lg font-semibold text-ink-900">
              {formatCurrency(purchase.total_value)}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
