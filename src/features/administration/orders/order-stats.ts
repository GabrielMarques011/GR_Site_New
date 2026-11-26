import type { Order } from "@/types/domain";

export interface OrderStats {
  totalOrders: number;
  countByStatus: {
    em_andamento: number;
    concluido: number;
    recusado: number;
  };
  totalRevenue: number;
  averageTicket: number;
  paymentCounts: { pago: number; nao_pago: number };
  paymentValues: { pago: number; nao_pago: number };
  monthlyRevenue: { monthLabel: string; total: number }[];
}

const MONTH_FORMATTER = new Intl.DateTimeFormat("pt-BR", { month: "short" });

/**
 * Agrega os pedidos já carregados (`getOrders()`) em números prontos para o
 * dashboard do Histórico — tudo calculado aqui, sem função nova no banco,
 * já que `getOrders()` busca todos os pedidos de uma vez (mesma premissa de
 * escala do resto do projeto: negócio pequeno, poucas centenas de pedidos).
 */
export function computeOrderStats(orders: Order[]): OrderStats {
  const countByStatus = { em_andamento: 0, concluido: 0, recusado: 0 };
  const paymentCounts = { pago: 0, nao_pago: 0 };
  const paymentValues = { pago: 0, nao_pago: 0 };
  let totalRevenue = 0;

  const monthlyMap = new Map<string, number>();
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthlyMap.set(monthKey(d), 0);
  }

  for (const order of orders) {
    countByStatus[order.status] += 1;

    const paymentStatus = order.payment_status ?? "nao_pago";
    paymentCounts[paymentStatus] += 1;
    paymentValues[paymentStatus] += order.total;

    if (order.status === "concluido") {
      totalRevenue += order.total;
      const key = monthKey(new Date(order.created_at));
      if (monthlyMap.has(key)) {
        monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + order.total);
      }
    }
  }

  const monthlyRevenue = Array.from(monthlyMap.entries()).map(
    ([key, total]) => ({
      monthLabel: formatMonthKey(key),
      total,
    }),
  );

  return {
    totalOrders: orders.length,
    countByStatus,
    totalRevenue,
    averageTicket:
      countByStatus.concluido > 0 ? totalRevenue / countByStatus.concluido : 0,
    paymentCounts,
    paymentValues,
    monthlyRevenue,
  };
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthKey(key: string): string {
  const [year, month] = key.split("-").map(Number);
  const monthName = MONTH_FORMATTER.format(new Date(year, month - 1, 1))
    .replace(".", "")
    .replace(/^\w/, (c) => c.toUpperCase());
  return `${monthName}/${String(year).slice(-2)}`;
}
