"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { cn } from "@/lib/utils/cn";

/** Primeiro modal do projeto — sem equivalente anterior para reaproveitar,
 * então segue o mesmo visual de `Card` (borda/raio/sombra) com um overlay
 * fixo por cima do painel administrativo.
 *
 * Renderiza via `createPortal` direto em `document.body` — se o modal for
 * aberto a partir de dentro de um `<form>` (ex: "criar produto rápido"
 * dentro do formulário de compra), sem o portal o `<form>` do modal ficaria
 * aninhado dentro do `<form>` de quem chamou, o que é HTML inválido: o
 * navegador corrige sozinho fechando o form externo mais cedo, e isso
 * desalinha a árvore do React com o DOM real (descoberto com um form real
 * perdendo todo o estado ao abrir o modal).
 *
 * `document.body` só é acessado quando `open` é `true` — nunca durante o
 * primeiro render (SSR ou hidratação), que sempre começa com o modal
 * fechado, então não precisa de nenhum truque de "só depois de montar no
 * cliente" para evitar acessar `document` no servidor. */
export function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink-900/40"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-ink-100 bg-white p-5 shadow-xl shadow-ink-900/10 sm:p-6",
          className,
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="focus-ring flex size-8 items-center justify-center rounded-full text-ink-500 hover:bg-ink-50"
          >
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
