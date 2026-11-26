import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { formatPhoneDisplay } from "@/lib/utils/phone";
import { renderWhatsAppTemplate } from "@/lib/utils/whatsapp-templates";
import { BenefitPanel } from "@/features/administration/customers/benefit-panel";
import { CustomerEditForm } from "@/features/administration/customers/customer-edit-form";
import { DeleteCustomerButton } from "@/features/administration/customers/delete-customer-button";
import { MessageHistory } from "@/features/administration/customers/message-history";
import { PersonalizedMessageForm } from "@/features/administration/customers/personalized-message-form";
import { WhatsAppSendButton } from "@/features/administration/customers/whatsapp-send-button";
import { getCustomerBenefit } from "@/services/customer-benefits";
import { getAdminCustomerById } from "@/services/customers";
import { getWhatsAppTemplates } from "@/services/whatsapp-templates";
import { getMessageLogsByCustomer } from "@/services/whatsapp-message-logs";

export const metadata: Metadata = { title: "Detalhes do cliente" };

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({
  params,
}: CustomerDetailPageProps) {
  const { id } = await params;

  const customer = await getAdminCustomerById(id);
  if (!customer) {
    notFound();
  }

  const [benefit, templates, messageLogs] = await Promise.all([
    getCustomerBenefit(id),
    getWhatsAppTemplates(),
    getMessageLogsByCustomer(id),
  ]);

  const templateByType = Object.fromEntries(
    templates.map((template) => [template.message_type, template.content]),
  );

  const vars = {
    nome: customer.full_name,
    telefone: formatPhoneDisplay(customer.phone_normalized),
    data_nascimento: new Date(
      `${customer.birth_date}T00:00:00`,
    ).toLocaleDateString("pt-BR"),
  };

  return (
    <div>
      <Link
        href="/administracao/clientes"
        className="focus-ring mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-lilac-700"
      >
        <ArrowLeft className="size-4" /> Voltar
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900">
            {customer.full_name}
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Cliente desde{" "}
            {new Date(customer.created_at).toLocaleDateString("pt-BR")}
          </p>
        </div>
        <DeleteCustomerButton
          customerId={customer.id}
          customerName={customer.full_name}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-ink-100 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-ink-900">
            Dados cadastrais
          </h2>
          <CustomerEditForm customer={customer} />
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-ink-100 bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold text-ink-900">
              Benefício de primeira compra
            </h2>
            <BenefitPanel customerId={customer.id} benefit={benefit} />
          </div>

          <div className="rounded-2xl border border-ink-100 bg-white p-6">
            <h2 className="mb-1 text-sm font-semibold text-ink-900">
              Mensagens pelo WhatsApp
            </h2>
            <p className="mb-4 text-xs text-ink-500">
              O link abre a conversa já preenchida — o envio é sempre manual,
              dentro do próprio WhatsApp.
            </p>

            <div className="flex flex-col gap-3">
              <WhatsAppSendButton
                customerId={customer.id}
                phone={customer.phone_normalized}
                messageType="boas_vindas"
                message={renderWhatsAppTemplate(
                  templateByType.boas_vindas ?? "Olá, {nome}!",
                  vars,
                )}
                label="Enviar boas-vindas"
              />

              <WhatsAppSendButton
                customerId={customer.id}
                phone={customer.phone_normalized}
                messageType="aniversario"
                message={renderWhatsAppTemplate(
                  templateByType.aniversario ?? "Feliz aniversário, {nome}!",
                  vars,
                )}
                label="Enviar parabéns"
              />

              {!customer.whatsapp_marketing_opt_in && (
                <p className="text-xs text-warning-600">
                  Este cliente não autorizou mensagens promocionais — use o bom
                  senso ao enviar aniversário/promoções.
                </p>
              )}

              <WhatsAppSendButton
                customerId={customer.id}
                phone={customer.phone_normalized}
                messageType="primeira_compra"
                message={renderWhatsAppTemplate(
                  templateByType.primeira_compra ??
                    "Você tem 5% de desconto na primeira compra!",
                  vars,
                )}
                label="Enviar benefício de primeira compra"
              />
            </div>

            <div className="mt-5 border-t border-ink-100 pt-5">
              <PersonalizedMessageForm
                customerId={customer.id}
                phone={customer.phone_normalized}
                customerName={customer.full_name}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-ink-100 bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold text-ink-900">
              Histórico de mensagens
            </h2>
            <MessageHistory logs={messageLogs} />
          </div>
        </div>
      </div>
    </div>
  );
}
