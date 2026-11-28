"use client";

import { useMemo, useState, useTransition } from "react";
import { Sparkles } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils/currency";
import type { Order, OrderPaymentStatus, OrderStatus } from "@/types/domain";

import {
  updateOrderPaymentStatusAction,
  updateOrderStatusAction,
} from "./actions";
import { ChargeSendButton } from "./charge-send-button";

const STATUS_LABELS: Record<OrderStatus, string> = {
  em_andamento: "Em andamento",
  concluido: "Concluído",
  recusado: "Recusado",
};

const STATUS_VARIANTS: Record<OrderStatus, "warning" | "success" | "danger"> = {
  em_andamento: "warning",
  concluido: "success",
  recusado: "danger",
};

const PAYMENT_STATUS_LABELS: Record<OrderPaymentStatus, string> = {
  nao_pago: "Não pago",
  pago: "Pago",
};

const PAYMENT_STATUS_VARIANTS: Record<
  OrderPaymentStatus,
  "warning" | "success"
> = {
  nao_pago: "warning",
  pago: "success",
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return phone;
  const ddd = digits.slice(-11, -9);
  const rest = digits.slice(-9);
  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
}

export function PaymentsTable({ orders }: { orders: Order[] }) {
  const [pending, startTransition] = useTransition();
  const [statusErrors, setStatusErrors] = useState<Record<string, string>>({});

  const orderCountByPhone = useMemo(() => {
    const counts = new Map<string, number>();
    for (const order of orders) {
      counts.set(
        order.customer_phone,
        (counts.get(order.customer_phone) ?? 0) + 1,
      );
    }
    return counts;
  }, [orders]);

  function handleStatusChange(orderId: string, status: OrderStatus) {
    setStatusErrors((current) => ({ ...current, [orderId]: "" }));
    startTransition(async () => {
      const result = await updateOrderStatusAction(orderId, status);
      if (result.error) {
        setStatusErrors((current) => ({
          ...current,
          [orderId]: result.error!,
        }));
      }
    });
  }

  function handlePaymentStatusChange(
    orderId: string,
    paymentStatus: OrderPaymentStatus,
  ) {
    startTransition(() =>
      updateOrderPaymentStatusAction(orderId, paymentStatus),
    );
  }

  if (orders.length === 0) {
    return (
      <p className="py-10 text-center text-ink-500">
        Nenhum pedido recebido pelo WhatsApp ainda.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {orders.map((order) => {
        const totalFromThisCustomer =
          orderCountByPhone.get(order.customer_phone) ?? 1;
        const paymentStatus = order.payment_status ?? "nao_pago";

        return (
          <div
            key={order.id}
            className="rounded-2xl border border-ink-100 bg-white p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-ink-900">
                    {order.customer_name}
                  </p>
                  {order.is_first_purchase && (
                    <Badge variant="lilac">
                      <Sparkles className="mr-1 inline size-3" />
                      1ª compra
                    </Badge>
                  )}
                  {totalFromThisCustomer > 1 && (
                    <span className="text-xs text-ink-500">
                      {totalFromThisCustomer}º pedido deste cliente
                    </span>
                  )}
                </div>
                <p className="text-sm text-ink-500">
                  {formatPhoneDisplay(order.customer_phone)} ·{" "}
                  {dateFormatter.format(new Date(order.created_at))}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={order.status}
                  disabled={pending}
                  onChange={(event) =>
                    handleStatusChange(
                      order.id,
                      event.target.value as OrderStatus,
                    )
                  }
                  className="w-40"
                  aria-label={`Status do pedido de ${order.customer_name}`}
                >
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>

                <Select
                  value={paymentStatus}
                  disabled={pending}
                  onChange={(event) =>
                    handlePaymentStatusChange(
                      order.id,
                      event.target.value as OrderPaymentStatus,
                    )
                  }
                  className="w-32"
                  aria-label={`Pagamento do pedido de ${order.customer_name}`}
                >
                  {Object.entries(PAYMENT_STATUS_LABELS).map(
                    ([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ),
                  )}
                </Select>
              </div>
            </div>

            {statusErrors[order.id] && (
              <Alert variant="danger" className="mt-3">
                {statusErrors[order.id]}
              </Alert>
            )}

            <ul className="mt-3 space-y-1 border-t border-ink-100 pt-3 text-sm text-ink-700">
              {order.items.map((item, index) => (
                <li key={index} className="flex justify-between gap-4">
                  <span className="flex items-center gap-2">
                    {item.quantity}x {item.name}
                    {item.product_kind === "loja" && (
                      <Badge variant="lilac">Loja</Badge>
                    )}
                  </span>
                  <span>{formatCurrency(item.subtotal)}</span>
                </li>
              ))}
            </ul>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-ink-100 pt-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={STATUS_VARIANTS[order.status]}>
                  {STATUS_LABELS[order.status]}
                </Badge>
                <Badge variant={PAYMENT_STATUS_VARIANTS[paymentStatus]}>
                  {PAYMENT_STATUS_LABELS[paymentStatus]}
                </Badge>
              </div>
              <div className="text-right text-sm">
                {order.discount_percent > 0 && (
                  <p className="text-ink-500">
                    Subtotal {formatCurrency(order.subtotal)} · desconto{" "}
                    {order.discount_percent}%
                  </p>
                )}
                <p className="font-display font-semibold text-ink-900">
                  Total {formatCurrency(order.total)}
                </p>
              </div>
            </div>

            {paymentStatus === "nao_pago" && (
              <div className="mt-3 border-t border-ink-100 pt-3">
                <ChargeSendButton
                  orderId={order.id}
                  customerName={order.customer_name}
                  customerPhone={order.customer_phone}
                  total={order.total}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
