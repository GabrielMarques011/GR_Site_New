"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Código de recuperação + botão de copiar — usado tanto na tela de
 * sucesso do cadastro público quanto no cadastro feito pela administradora. */
export function RecoveryCodeBox({ recoveryCode }: { recoveryCode: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopyCode() {
    navigator.clipboard
      .writeText(recoveryCode)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <code className="rounded-lg bg-lilac-50 px-4 py-2 font-mono text-lg tracking-wide text-lilac-800">
        {recoveryCode}
      </code>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleCopyCode}
      >
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        {copied ? "Copiado" : "Copiar"}
      </Button>
    </div>
  );
}
