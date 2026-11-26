import type { Metadata } from "next";
import { Heart } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { logoutCustomerAction } from "@/features/customers/actions";
import { CadastroTabs } from "@/features/customers/cadastro-tabs";
import { getRecognizedCustomer } from "@/features/customers/recognize";

export const metadata: Metadata = {
  title: "Cadastro",
  description:
    "Cadastre-se na GR Design e tenha seus dados prontos para facilitar seus próximos pedidos.",
};

const BENEFIT_LABEL: Record<string, string> = {
  disponivel: "Disponível",
  reservado: "Reservado em um pedido",
  utilizado: "Já utilizado",
  cancelado: "Cancelado",
  indisponivel: "Indisponível",
};

export default async function CadastroPage() {
  const customer = await getRecognizedCustomer();

  return (
    <div className="container-page max-w-2xl py-10">
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl font-semibold text-ink-900">
          {customer ? "Sua conta GR Design" : "Cadastro de cliente"}
        </h1>
        <p className="mt-1 text-ink-700">
          {customer
            ? "Seus dados já estão prontos para facilitar seus próximos pedidos."
            : "Cadastre-se uma única vez e a loja vai te reconhecer nos próximos acessos."}
        </p>
      </div>

      {customer ? (
        <div className="rounded-2xl border border-lilac-200 bg-lilac-50/60 p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-full bg-lilac-100 text-lilac-700">
              <Heart className="size-5" />
            </div>
            <div>
              <p className="font-display text-lg font-semibold text-ink-900">
                Que bom ter você de volta, {customer.fullName}! 💜
              </p>
              <p className="text-sm text-ink-700">{customer.phone}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="text-sm text-ink-700">
              Benefício de primeira compra:
            </span>
            <Badge
              variant={
                customer.benefitStatus === "disponivel" ? "success" : "neutral"
              }
            >
              {BENEFIT_LABEL[customer.benefitStatus] ?? customer.benefitStatus}
            </Badge>
          </div>

          <form action={logoutCustomerAction} className="mt-6">
            <button
              type="submit"
              className={buttonVariants({ variant: "outline" })}
            >
              Sair deste dispositivo
            </button>
          </form>
        </div>
      ) : (
        <div className="rounded-2xl border border-ink-100 bg-white p-6">
          <CadastroTabs />
        </div>
      )}
    </div>
  );
}
