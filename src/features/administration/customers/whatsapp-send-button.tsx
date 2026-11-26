"use client";

import { useState, useTransition } from "react";
import { Check, MessageCircle, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { buildAdminWhatsAppLink } from "@/lib/utils/whatsapp-admin-link";
import type { WhatsAppMessageType } from "@/types/domain";

import {
  cancelPreparedMessageAction,
  confirmMessageSentAction,
  prepareMessageAction,
} from "./actions";

/**
 * Abre o WhatsApp (api.whatsapp.com/send/) já com a mensagem preenchida —
 * o envio continua manual, dentro do próprio WhatsApp. A aba é aberta de
 * forma síncrona no clique (mesma técnica usada no checkout) para não ser
 * bloqueada como popup, mesmo no celular.
 */
export function WhatsAppSendButton({
  customerId,
  phone,
  messageType,
  message,
  label,
}: {
  customerId: string;
  phone: string;
  messageType: WhatsAppMessageType;
  message: string;
  label: string;
}) {
  const [pending, startTransition] = useTransition();
  const [preparedLogId, setPreparedLogId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleOpen() {
    setError(null);
    const whatsappWindow = window.open("", "_blank");

    startTransition(async () => {
      const result = await prepareMessageAction({
        customerId,
        messageType,
        content: message,
      });

      if (result.error) {
        whatsappWindow?.close();
        setError(result.error);
        return;
      }

      const link = buildAdminWhatsAppLink(phone, message);
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
      await confirmMessageSentAction(preparedLogId, customerId);
      setPreparedLogId(null);
    });
  }

  function handleCancel() {
    if (!preparedLogId) return;
    startTransition(async () => {
      await cancelPreparedMessageAction(preparedLogId, customerId);
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
        <MessageCircle className="size-3.5" /> {label}
      </Button>
      {error && <p className="mt-1 text-xs text-danger-600">{error}</p>}
    </div>
  );
}
