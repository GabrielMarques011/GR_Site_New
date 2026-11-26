import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { NewCustomerForm } from "@/features/administration/customers/new-customer-form";

export const metadata: Metadata = { title: "Novo cliente" };

export default function NewCustomerPage() {
  return (
    <div>
      <Link
        href="/administracao/clientes"
        className="focus-ring mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-lilac-700"
      >
        <ArrowLeft className="size-4" /> Voltar
      </Link>

      <h1 className="font-display text-2xl font-semibold text-ink-900">
        Novo cliente
      </h1>
      <p className="mt-1 text-sm text-ink-500">
        Use esta tela para cadastrar uma cliente atendida pessoalmente, que
        ainda não criou o próprio cadastro no site.
      </p>

      <div className="mt-6 max-w-2xl rounded-2xl border border-ink-100 bg-white p-6">
        <NewCustomerForm />
      </div>
    </div>
  );
}
