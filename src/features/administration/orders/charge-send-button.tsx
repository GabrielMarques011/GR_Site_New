"use client";

import { useState, useTransition } from "react";
import { Check, MessageCircle, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { buildAdminWhatsAppLink } from "@/lib/utils/whatsapp-admin-link";
import { normalizePhoneE164 } from "@/lib/utils/phone";
import { formatCurrency } from "@/lib/utils/currency";

import {
  cancelPreparedChargeAction,
  confirmChargeSentAction,
  prepareChargeAction,
} from "./actions";

function buildChargeMessage(customerName: string, total: number): string {
  return (
    `Oi, ${customerName}! Tudo bem? Aqui é da GR Design 💜 Vimos que ainda não ` +
    `identificamos o pagamento do seu pedido de ${formatCurrency(total)}. ` +
    `Poderia nos confirmar, por favor?`
  );
}

/**
 * Mesma técnica de `WhatsAppSendButton` (customers), mas ligada ao pedido —
 * funciona mesmo sem cadastro de cliente vinculado, usando o telefone do
 * próprio checkout.
 */
export function ChargeSendButton({
  orderId,
  customerName,
  customerPhone,
  total,
}: {
  orderId: string;
  customerName: string;
  customerPhone: string;
  total: number;
}) {
  const [pending, startTransition] = useTransition();
  const [preparedLogId, setPreparedLogId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const phoneE164 = normalizePhoneE164(customerPhone);

  function handleOpen() {
    if (!phoneE164) {
      setError("Telefone inválido para cobrança.");
      return;
    }
    setError(null);
    const whatsappWindow = window.open("", "_blank");

    startTransition(async () => {
      const result = await prepareChargeAction(orderId);

      if (result.error) {
        whatsappWindow?.close();
        setError(result.error);
        return;
      }

      const link = buildAdminWhatsAppLink(
        phoneE164,
        buildChargeMessage(customerName, total),
      );
      if (whatsappWindow) {
        whatsappWindow.location.href = link;
      } else {
        window.open(link, "_blank");
      }

      setPreparedLogId(result.logId ?? null);
    });
  }

  function handleConfirm() {
    if (!preparedLogId) return;
    startTransition(async () => {
      await confirmChargeSentAction(preparedLogId, orderId);
      setPreparedLogId(null);
    });
  }

  function handleCancel() {
    if (!preparedLogId) return;
    startTransition(async () => {
      await cancelPreparedChargeAction(preparedLogId, orderId);
      setPreparedLogId(null);
    });
  }

  if (preparedLogId) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-ink-500">
          WhatsApp aberto — confirme depois de enviar de verdade.
        </span>
        <Button
          type="button"
          size="sm"
          onClick={handleConfirm}
          disabled={pending}
        >
          <Check className="size-3.5" /> Marcar como enviada
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          disabled={pending}
        >
          <X className="size-3.5" /> Cancelar
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={handleOpen}
        isLoading={pending}
      >
        <MessageCircle className="size-3.5" /> Enviar cobrança
      </Button>
      {error && <p className="mt-1 text-xs text-danger-600">{error}</p>}
    </div>
  );
}
