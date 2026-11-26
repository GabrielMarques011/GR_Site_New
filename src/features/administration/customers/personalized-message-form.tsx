"use client";

import { useState } from "react";

import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { renderWhatsAppTemplate } from "@/lib/utils/whatsapp-templates";

import { WhatsAppSendButton } from "./whatsapp-send-button";

export function PersonalizedMessageForm({
  customerId,
  phone,
  customerName,
}: {
  customerId: string;
  phone: string;
  customerName: string;
}) {
  const [content, setContent] = useState(`Olá, {nome}! 💜\n\n`);

  const rendered = renderWhatsAppTemplate(content, { nome: customerName });

  return (
    <div className="flex flex-col gap-3">
      <Field
        label="Mensagem personalizada"
        htmlFor="personalized-message"
        hint="Use {nome} para inserir o nome do cliente automaticamente"
      >
        <Textarea
          id="personalized-message"
          rows={4}
          value={content}
          onChange={(event) => setContent(event.target.value)}
        />
      </Field>

      <div className="rounded-xl border border-ink-100 bg-ink-50 p-3 text-sm text-ink-700">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-500">
          Pré-visualização
        </p>
        <p className="whitespace-pre-line">{rendered}</p>
      </div>

      <div>
        <WhatsAppSendButton
          customerId={customerId}
          phone={phone}
          messageType="personalizada"
          message={rendered}
          label="Abrir no WhatsApp"
        />
      </div>
    </div>
  );
}
