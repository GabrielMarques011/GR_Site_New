import {
  CheckCircle2,
  Clock,
  ShoppingBag,
  TrendingUp,
  Wallet,
  XCircle,
} from "lucide-react";

import { formatCurrency } from "@/lib/utils/currency";

import type { OrderStats } from "./order-stats";

/** Menor número "redondo" >= value, para o eixo do gráfico de barras. */
function niceMax(value: number): number {
  if (value <= 0) return 100;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const steps = [1, 2, 5, 10];
  for (const step of steps) {
    const candidate = step * magnitude;
    if (candidate >= value) return candidate;
  }
  return 10 * magnitude;
}

const TINT_CLASSES = {
  lilac: "bg-lilac-100 text-lilac-600",
  warning: "bg-warning-100 text-warning-600",
  success: "bg-success-100 text-success-600",
  danger: "bg-danger-100 text-danger-600",
} as const;

function StatTile({
  label,
  value,
  icon: Icon,
  tint,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  tint: keyof typeof TINT_CLASSES;
}) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-ink-500">{label}</span>
        <span
          className={`flex size-8 items-center justify-center rounded-full ${TINT_CLASSES[tint]}`}
        >
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 font-display text-3xl font-semibold text-ink-900">
        {value}
      </p>
    </div>
  );
}

function MonthlyRevenueChart({
  data,
}: {
  data: { monthLabel: string; total: number }[];
}) {
  const max = niceMax(Math.max(...data.map((d) => d.total), 0));
  const gridSteps = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5">
      <h3 className="font-display text-base font-semibold text-ink-900">
        Vendas concluídas por mês
      </h3>
      <p className="mt-0.5 text-sm text-ink-500">
        Soma do total dos pedidos concluídos, mês a mês.
      </p>

      <div className="mt-6 flex gap-3">
        <div className="flex h-48 flex-col justify-between pb-6 text-right text-xs text-ink-400">
          {gridSteps
            .slice()
            .reverse()
            .map((step) => (
              <span key={step}>{formatCurrency(max * step)}</span>
            ))}
        </div>

        <div className="relative flex h-48 flex-1 items-end justify-between gap-2 border-l border-ink-100">
          {gridSteps.map((step) => (
            <div
              key={step}
              className="absolute left-0 right-0 border-t border-ink-100"
              style={{ bottom: `${step * 100}%` }}
            />
          ))}

          {data.map((point, index) => {
            const heightPercent = max > 0 ? (point.total / max) * 100 : 0;
            const isLast = index === data.length - 1;
            return (
              <div
                key={point.monthLabel}
                className="relative z-10 flex h-full flex-1 flex-col items-center justify-end"
              >
                {isLast && point.total > 0 && (
                  <span className="mb-1 text-xs font-medium text-ink-700">
                    {formatCurrency(point.total)}
                  </span>
                )}
                {point.total > 0 && (
                  <div
                    title={`${point.monthLabel}: ${formatCurrency(point.total)}`}
                    className="w-full max-w-6 rounded-t-[4px] bg-lilac-600 transition-opacity hover:opacity-80"
                    style={{ height: `${heightPercent}%` }}
                  />
                )}
                <span className="mt-2 text-xs text-ink-500">
                  {point.monthLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PaymentSegmentedBar({
  paymentCounts,
  paymentValues,
}: {
  paymentCounts: { pago: number; nao_pago: number };
  paymentValues: { pago: number; nao_pago: number };
}) {
  const total = paymentValues.pago + paymentValues.nao_pago;
  const pagoPercent = total > 0 ? (paymentValues.pago / total) * 100 : 0;
  const naoPagoPercent = 100 - pagoPercent;

  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5">
      <h3 className="font-display text-base font-semibold text-ink-900">
        Pagamentos
      </h3>
      <p className="mt-0.5 text-sm text-ink-500">
        Proporção do valor total em pedidos já pagos.
      </p>

      <div className="mt-5 flex h-7 w-full overflow-hidden rounded-full bg-ink-100">
        {paymentValues.pago > 0 && (
          <div
            className="flex items-center justify-center bg-success-600 text-xs font-medium text-white"
            style={{ width: `${pagoPercent}%` }}
          >
            {pagoPercent >= 18 && `${Math.round(pagoPercent)}%`}
          </div>
        )}
        {paymentValues.nao_pago > 0 && (
          <div
            className="flex items-center justify-center bg-warning-600 text-xs font-medium text-white"
            style={{ width: `${naoPagoPercent}%` }}
          >
            {naoPagoPercent >= 18 && `${Math.round(naoPagoPercent)}%`}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-success-600" />
          <span className="text-ink-700">
            Pago · {paymentCounts.pago} pedido(s) ·{" "}
            {formatCurrency(paymentValues.pago)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-warning-600" />
          <span className="text-ink-700">
            Não pago · {paymentCounts.nao_pago} pedido(s) ·{" "}
            {formatCurrency(paymentValues.nao_pago)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function SalesDashboard({ stats }: { stats: OrderStats }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Total de pedidos"
          value={String(stats.totalOrders)}
          icon={ShoppingBag}
          tint="lilac"
        />
        <StatTile
          label="Vendas concluídas"
          value={formatCurrency(stats.totalRevenue)}
          icon={TrendingUp}
          tint="success"
        />
        <StatTile
          label="Ticket médio"
          value={formatCurrency(stats.averageTicket)}
          icon={Wallet}
          tint="lilac"
        />
        <StatTile
          label="Pedidos não pagos"
          value={String(stats.paymentCounts.nao_pago)}
          icon={Wallet}
          tint="warning"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile
          label="Em andamento"
          value={String(stats.countByStatus.em_andamento)}
          icon={Clock}
          tint="warning"
        />
        <StatTile
          label="Concluídos"
          value={String(stats.countByStatus.concluido)}
          icon={CheckCircle2}
          tint="success"
        />
        <StatTile
          label="Recusados"
          value={String(stats.countByStatus.recusado)}
          icon={XCircle}
          tint="danger"
        />
      </div>

      <MonthlyRevenueChart data={stats.monthlyRevenue} />

      <PaymentSegmentedBar
        paymentCounts={stats.paymentCounts}
        paymentValues={stats.paymentValues}
      />
    </div>
  );
}
