import type { Metadata } from "next";

import { Alert } from "@/components/ui/alert";
import { computeOrderStats } from "@/features/administration/orders/order-stats";
import { SalesDashboard } from "@/features/administration/orders/sales-dashboard";
import { getOrders } from "@/services/orders";
import type { Order } from "@/types/domain";

export const metadata: Metadata = { title: "Histórico" };

export default async function AdminHistoricoPage() {
  let orders: Order[] = [];
  let loadError: string | null = null;

  try {
    orders = await getOrders();
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Erro desconhecido";
  }

  const stats = computeOrderStats(orders);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink-900">
        Histórico de vendas
      </h1>
      <p className="mt-1 text-sm text-ink-500">
        Visão geral dos pedidos recebidos pelo WhatsApp. Para mudar status ou
        cobrar um cliente, use a tela Pagamentos.
      </p>

      <div className="mt-6">
        {loadError ? (
          <Alert variant="danger">
            Não foi possível carregar o histórico ({loadError}). Se a migration{" "}
            <code>0002_orders.sql</code> ainda não foi aplicada no Supabase, é
            por isso — peça para aplicá-la e recarregue a página.
          </Alert>
        ) : (
          <SalesDashboard stats={stats} />
        )}
      </div>
    </div>
  );
}
