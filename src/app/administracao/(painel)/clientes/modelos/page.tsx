import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { TemplateForm } from "@/features/administration/customers/template-form";
import { getWhatsAppTemplates } from "@/services/whatsapp-templates";
import type { WhatsAppMessageTemplateType } from "@/types/domain";

export const metadata: Metadata = { title: "Modelos de mensagem" };

const TEMPLATE_TYPES: WhatsAppMessageTemplateType[] = [
  "boas_vindas",
  "aniversario",
  "primeira_compra",
];

const FALLBACK_CONTENT: Record<WhatsAppMessageTemplateType, string> = {
  boas_vindas: "Olá, {nome}! 💜\n\nSeja muito bem-vindo(a) à GR Design!",
  aniversario: "Olá, {nome}! 🎉💜\n\nFeliz aniversário!",
  primeira_compra:
    "Olá, {nome}! 💜\n\nVocê tem 5% de desconto na sua primeira compra.",
};

export default async function WhatsAppTemplatesPage() {
  const templates = await getWhatsAppTemplates();
  const contentByType = Object.fromEntries(
    templates.map((template) => [template.message_type, template.content]),
  );

  return (
    <div>
      <Link
        href="/administracao/clientes"
        className="focus-ring mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-lilac-700"
      >
        <ArrowLeft className="size-4" /> Voltar
      </Link>

      <h1 className="font-display text-2xl font-semibold text-ink-900">
        Modelos de mensagem
      </h1>
      <p className="mt-1 text-sm text-ink-500">
        Usados ao abrir o WhatsApp para boas-vindas, aniversário e o benefício
        de primeira compra.
      </p>

      {templates.length === 0 && (
        <p className="mt-6 rounded-xl border border-warning-200 bg-warning-50 p-4 text-sm text-warning-700">
          Nenhum modelo encontrado. Se você já aplicou a migration
          0004_customers.sql no Supabase, recarregue a página.
        </p>
      )}

      <div className="mt-6 flex flex-col gap-4">
        {TEMPLATE_TYPES.map((type) => (
          <TemplateForm
            key={type}
            messageType={type}
            content={contentByType[type] ?? FALLBACK_CONTENT[type]}
          />
        ))}
      </div>
    </div>
  );
}
