"use client";

import { useState, useTransition } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { WhatsAppMessageTemplateType } from "@/types/domain";

import { updateWhatsAppTemplateAction } from "./actions";

const TITLES: Record<WhatsAppMessageTemplateType, string> = {
  boas_vindas: "Boas-vindas",
  aniversario: "Aniversário",
  primeira_compra: "Primeira compra",
};

export function TemplateForm({
  messageType,
  content,
}: {
  messageType: WhatsAppMessageTemplateType;
  content: string;
}) {
  const [value, setValue] = useState(content);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    const formData = new FormData();
    formData.set("content", value);

    startTransition(async () => {
      const result = await updateWhatsAppTemplateAction(
        messageType,
        { error: null },
        formData,
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(true);
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-ink-100 bg-white p-5"
    >
      <h3 className="font-display text-base font-semibold text-ink-900">
        {TITLES[messageType]}
      </h3>
      <p className="mt-1 text-xs text-ink-500">
        Variáveis disponíveis: {"{nome}"}, {"{telefone}"}, {"{data_nascimento}"}
      </p>

      {error && (
        <Alert variant="danger" className="mt-3">
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" className="mt-3">
          Modelo atualizado.
        </Alert>
      )}

      <Textarea
        rows={6}
        className="mt-3"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />

      <div className="mt-3 flex justify-end">
        <Button type="submit" size="sm" isLoading={pending}>
          Salvar modelo
        </Button>
      </div>
    </form>
  );
}
