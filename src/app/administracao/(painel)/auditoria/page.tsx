import type { Metadata } from "next";

import { getAuditLogs } from "@/services/audit";

export const metadata: Metadata = { title: "Auditoria" };

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

export default async function AdminAuditPage() {
  const logs = await getAuditLogs();

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink-900">
        Auditoria
      </h1>
      <p className="mt-1 text-sm text-ink-500">
        Últimas {logs.length} ações administrativas registradas.
      </p>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-ink-100 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-500">
            <tr>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Ação</th>
              <th className="px-4 py-3">Entidade</th>
              <th className="px-4 py-3">Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-ink-500">
                  Nenhum registro de auditoria ainda.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-ink-100 last:border-b-0"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-ink-700">
                    {dateFormatter.format(new Date(log.created_at))}
                  </td>
                  <td className="px-4 py-3 font-medium text-ink-900">
                    {log.action}
                  </td>
                  <td className="px-4 py-3 text-ink-700">
                    {log.entity}
                    {log.entity_id ? ` · ${log.entity_id.slice(0, 8)}` : ""}
                  </td>
                  <td className="px-4 py-3 text-ink-500">
                    {log.details ? JSON.stringify(log.details) : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
