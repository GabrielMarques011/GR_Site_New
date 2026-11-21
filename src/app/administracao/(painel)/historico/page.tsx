import type { Metadata } from "next";

import { Alert } from "@/components/ui/alert";
import { OrdersTable } from "@/features/administration/orders/orders-table";
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

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink-900">
        Histórico de pedidos
      </h1>
      <p className="mt-1 text-sm text-ink-500">
        {orders.length} pedido(s) recebido(s) pelo WhatsApp
      </p>

      <div className="mt-6">
        {loadError ? (
          <Alert variant="danger">
            Não foi possível carregar o histórico ({loadError}). Se a migration{" "}
            <code>0002_orders.sql</code> ainda não foi aplicada no Supabase, é
            por isso — peça para aplicá-la e recarregue a página.
          </Alert>
        ) : (
          <OrdersTable orders={orders} />
        )}
      </div>
    </div>
  );
}
