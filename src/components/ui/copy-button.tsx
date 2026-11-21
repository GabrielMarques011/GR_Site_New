"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { buttonVariants, type ButtonSize, type ButtonVariant } from "./button";

export function CopyButton({
  value,
  label = "Copiar",
  copiedLabel = "Copiado!",
  variant = "outline",
  size = "md",
  className,
}: {
  value: string;
  label?: string;
  copiedLabel?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Clipboard indisponível (contexto não seguro, permissão negada etc.)
      // — sem bloquear a interface, só não mostramos o feedback de sucesso.
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={buttonVariants({ variant, size, className })}
    >
      {copied ? (
        <>
          <Check className="size-4" /> {copiedLabel}
        </>
      ) : (
        <>
          <Copy className="size-4" /> {label}
        </>
      )}
    </button>
  );
}
