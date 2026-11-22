"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/**
 * Volta para a página anterior quando o cliente navegou a partir do
 * próprio site; se a página foi aberta direto (link externo, nova aba),
 * cai para `fallbackHref` em vez de sair do site.
 */
export function BackButton({
  fallbackHref,
  label = "Voltar",
}: {
  fallbackHref: string;
  label?: string;
}) {
  const router = useRouter();

  function handleClick() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="focus-ring mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-lilac-700"
    >
      <ArrowLeft className="size-4" />
      {label}
    </button>
  );
}
