import type { Metadata } from "next";
import Link from "next/link";
import { Boxes, Package, Receipt, Wallet } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { PurchasesList } from "@/features/administration/purchases/purchases-list";
import { PurchasesToolbar } from "@/features/administration/purchases/purchases-toolbar";
import { formatCurrency } from "@/lib/utils/currency";
import { getAdminProfiles } from "@/services/admin-profiles";
import {
  getItemCountsByPurchase,
  getMaterialPurchaseStats,
  getMaterialPurchases,
} from "@/services/material-purchases";
import type { MaterialPurchase } from "@/types/domain";

export const metadata: Metadata = { title: "Compra de Materiais" };

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function AdminComprasPage({ searchParams }: PageProps) {
  const params = await searchParams;

  let purchases: MaterialPurchase[] = [];
  let loadError: string | null = null;

  try {
    purchases = await getMaterialPurchases({
      search: params.busca,
      category: params.categoria,
      from: params.de,
      to: params.ate,
      administratorId: params.admin,
    });
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Erro desconhecido";
  }

  const [stats, admins, itemCounts] = await Promise.all([
    getMaterialPurchaseStats(),
    getAdminProfiles(),
    getItemCountsByPurchase(purchases.map((p) => p.id)),
  ]);

  const adminNames = new Map(admins.map((a) => [a.userId, a.name]));

  const cards = [
    {
      label: "Total de compras",
      value: String(stats.totalPurchases),
      icon: Boxes,
    },
    {
      label: "Valor total comprado",
      value: formatCurrency(stats.totalValue),
      icon: Wallet,
    },
    {
      label: "Compras este mês",
      value: String(stats.purchasesThisMonth),
      icon: Receipt,
    },
    {
      label: "Itens adquiridos",
      value: String(stats.totalItemsPurchased),
      icon: Package,
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900">
            Compra de Materiais
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Registre compras de materiais, com atualização automática do estoque
            dos produtos.
          </p>
        </div>
        <Link
          href="/administracao/compras/novo"
          className={buttonVariants({ size: "lg" })}
        >
          Nova Compra
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-2xl border border-ink-100 bg-white p-5"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-ink-500">{label}</span>
              <Icon className="size-5 text-lilac-600" />
            </div>
            <p className="mt-3 font-display text-3xl font-semibold text-ink-900">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <PurchasesToolbar admins={admins} />
      </div>

      <div className="mt-4">
        {loadError ? (
          <Alert variant="danger">
            Não foi possível carregar as compras ({loadError}). Se a migration{" "}
            <code>0009_material_purchases.sql</code> ainda não foi aplicada no
            Supabase, é por isso — peça para aplicá-la e recarregue a página.
          </Alert>
        ) : (
          <PurchasesList
            purchases={purchases}
            itemCounts={itemCounts}
            adminNames={adminNames}
          />
        )}
      </div>
    </div>
  );
}
