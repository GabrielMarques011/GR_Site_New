"use client";

import { useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CustomerBenefit } from "@/types/domain";

import {
  cancelBenefitReservationAction,
  confirmBenefitUsageAction,
  revokeBenefitAction,
} from "./actions";

const STATUS_LABEL: Record<string, string> = {
  disponivel: "Disponível",
  reservado: "Reservado",
  utilizado: "Utilizado",
  cancelado: "Cancelado",
};

const STATUS_VARIANT: Record<
  string,
  "success" | "warning" | "neutral" | "danger"
> = {
  disponivel: "success",
  reservado: "warning",
  utilizado: "neutral",
  cancelado: "danger",
};

export function BenefitPanel({
  customerId,
  benefit,
}: {
  customerId: string;
  benefit: CustomerBenefit | null;
}) {
  const [pending, startTransition] = useTransition();

  if (!benefit) {
    return (
      <p className="text-sm text-ink-500">
        Nenhum benefício de primeira compra encontrado para este cliente.
      </p>
    );
  }

  function handleConfirm() {
    startTransition(() => confirmBenefitUsageAction(customerId));
  }

  function handleCancelReservation() {
    startTransition(() => cancelBenefitReservationAction(customerId));
  }

  function handleRevoke() {
    if (
      !window.confirm(
        "Cancelar definitivamente este benefício? O cliente não poderá mais utilizá-lo.",
      )
    ) {
      return;
    }
    startTransition(() => revokeBenefitAction(customerId));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={STATUS_VARIANT[benefit.status] ?? "neutral"}>
          {STATUS_LABEL[benefit.status] ?? benefit.status}
        </Badge>
        <span className="text-sm text-ink-700">
          {benefit.discount_percentage}% de desconto na primeira compra
        </span>
      </div>

      {benefit.reserved_at && (
        <p className="text-xs text-ink-500">
          Reservado em {new Date(benefit.reserved_at).toLocaleString("pt-BR")}
        </p>
      )}
      {benefit.used_at && (
        <p className="text-xs text-ink-500">
          Utilizado em {new Date(benefit.used_at).toLocaleString("pt-BR")}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {benefit.status === "reservado" && (
          <>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirm}
              disabled={pending}
            >
              Confirmar utilização
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleCancelReservation}
              disabled={pending}
            >
              Cancelar reserva (pedido não concluído)
            </Button>
          </>
        )}
        {(benefit.status === "disponivel" ||
          benefit.status === "reservado") && (
          <Button
            type="button"
            size="sm"
            variant="danger"
            onClick={handleRevoke}
            disabled={pending}
          >
            Cancelar benefício definitivamente
          </Button>
        )}
      </div>
    </div>
  );
}
