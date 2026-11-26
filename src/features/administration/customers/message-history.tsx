import { Badge } from "@/components/ui/badge";
import type { WhatsAppMessageLog } from "@/types/domain";

const TYPE_LABEL: Record<string, string> = {
  boas_vindas: "Boas-vindas",
  aniversario: "Aniversário",
  primeira_compra: "Primeira compra",
  personalizada: "Personalizada",
};

const STATUS_LABEL: Record<string, string> = {
  preparada: "Preparada",
  enviada_manualmente: "Enviada manualmente",
  cancelada: "Cancelada",
};

const STATUS_VARIANT: Record<string, "success" | "warning" | "neutral"> = {
  preparada: "warning",
  enviada_manualmente: "success",
  cancelada: "neutral",
};

export function MessageHistory({ logs }: { logs: WhatsAppMessageLog[] }) {
  if (logs.length === 0) {
    return (
      <p className="text-sm text-ink-500">
        Nenhuma mensagem preparada para este cliente ainda.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {logs.map((log) => (
        <li
          key={log.id}
          className="rounded-xl border border-ink-100 p-3 text-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium text-ink-900">
              {TYPE_LABEL[log.message_type] ?? log.message_type}
            </span>
            <Badge variant={STATUS_VARIANT[log.status] ?? "neutral"}>
              {STATUS_LABEL[log.status] ?? log.status}
            </Badge>
          </div>
          <p className="mt-1 whitespace-pre-line text-ink-700">
            {log.message_content}
          </p>
          <p className="mt-1 text-xs text-ink-500">
            Preparada em {new Date(log.prepared_at).toLocaleString("pt-BR")}
            {log.manually_confirmed_at &&
              ` · Confirmada em ${new Date(log.manually_confirmed_at).toLocaleString("pt-BR")}`}
          </p>
        </li>
      ))}
    </ul>
  );
}
