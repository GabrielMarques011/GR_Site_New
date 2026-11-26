import type { Metadata } from "next";

import { Alert } from "@/components/ui/alert";
import { PaymentsTable } from "@/features/administration/orders/payments-table";
import { getOrders } from "@/services/orders";
import type { Order } from "@/types/domain";

export const metadata: Metadata = { title: "Pagamentos" };

export default async function AdminPagamentosPage() {
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
        Pagamentos
      </h1>
      <p className="mt-1 text-sm text-ink-500">
        Controle de pagamento de cada pedido recebido pelo WhatsApp.
      </p>

      <div className="mt-6">
        {loadError ? (
          <Alert variant="danger">
            Não foi possível carregar os pedidos ({loadError}). Se a migration{" "}
            <code>0008_order_payments.sql</code> ainda não foi aplicada no
            Supabase, é por isso — peça para aplicá-la e recarregue a página.
          </Alert>
        ) : (
          <PaymentsTable orders={orders} />
        )}
      </div>
    </div>
  );
}
