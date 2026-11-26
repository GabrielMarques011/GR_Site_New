import Link from "next/link";
import { Eye } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatPhoneDisplay } from "@/lib/utils/phone";
import type { CustomerWithBirthday } from "@/types/domain";

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR");
}

export function CustomersTable({
  customers,
}: {
  customers: CustomerWithBirthday[];
}) {
  if (customers.length === 0) {
    return (
      <p className="py-10 text-center text-ink-500">
        Nenhum cliente encontrado com esses filtros.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-ink-100 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-500">
          <tr>
            <th className="px-4 py-3">Cliente</th>
            <th className="px-4 py-3">WhatsApp</th>
            <th className="px-4 py-3">Nascimento</th>
            <th className="px-4 py-3">Cidade</th>
            <th className="px-4 py-3">Cadastro</th>
            <th className="px-4 py-3">Benefício</th>
            <th className="px-4 py-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr
              key={customer.id}
              className="border-b border-ink-100 last:border-b-0"
            >
              <td className="px-4 py-3 font-medium text-ink-900">
                {customer.full_name}
              </td>
              <td className="px-4 py-3 text-ink-700">
                {formatPhoneDisplay(customer.phone_normalized)}
              </td>
              <td className="px-4 py-3 text-ink-700">
                {formatDate(customer.birth_date)}
              </td>
              <td className="px-4 py-3 text-ink-700">{customer.city}</td>
              <td className="px-4 py-3 text-ink-700">
                {new Date(customer.created_at).toLocaleDateString("pt-BR")}
              </td>
              <td className="px-4 py-3">
                <Badge
                  variant={
                    customer.first_purchase_discount_used
                      ? "neutral"
                      : "success"
                  }
                >
                  {customer.first_purchase_discount_used
                    ? "Utilizado"
                    : "Disponível"}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end">
                  <Link
                    href={`/administracao/clientes/${customer.id}`}
                    className="focus-ring flex size-8 items-center justify-center rounded-lg text-ink-700 hover:bg-ink-50"
                    aria-label="Ver detalhes do cliente"
                  >
                    <Eye className="size-4" />
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
