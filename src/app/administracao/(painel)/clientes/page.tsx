import type { Metadata } from "next";
import Link from "next/link";
import { Cake, Gift, PartyPopper, UserPlus, Users } from "lucide-react";

import { Pagination } from "@/components/store/pagination";
import { CustomersTable } from "@/features/administration/customers/customers-table";
import { CustomersToolbar } from "@/features/administration/customers/customers-toolbar";
import { getAdminCustomers, getCustomerIndicators } from "@/services/customers";
import type { CustomerBenefitStatus } from "@/types/domain";

export const metadata: Metadata = { title: "Clientes" };

const PAGE_SIZE = 20;
const VALID_BENEFIT_STATUSES: CustomerBenefitStatus[] = [
  "disponivel",
  "reservado",
  "utilizado",
  "cancelado",
];

interface AdminClientesPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function AdminClientesPage({
  searchParams,
}: AdminClientesPageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.pagina ?? "1") || 1);
  const benefitStatus = VALID_BENEFIT_STATUSES.includes(
    params.beneficio as CustomerBenefitStatus,
  )
    ? (params.beneficio as CustomerBenefitStatus)
    : undefined;

  const [indicators, { items, total }] = await Promise.all([
    getCustomerIndicators(),
    getAdminCustomers({
      search: params.busca,
      benefitStatus,
      birthdayMonth:
        params.aniversario === "1" ? new Date().getMonth() + 1 : undefined,
      page,
      pageSize: PAGE_SIZE,
    }),
  ]);

  const cards = [
    {
      label: "Total de clientes",
      value: indicators.totalCustomers,
      icon: Users,
    },
    {
      label: "Novos este mês",
      value: indicators.newCustomersThisMonth,
      icon: UserPlus,
    },
    {
      label: "Aniversariantes hoje",
      value: indicators.birthdaysToday,
      icon: Cake,
    },
    {
      label: "Aniversariantes no mês",
      value: indicators.birthdaysThisMonth,
      icon: PartyPopper,
    },
    {
      label: "Benefício disponível",
      value: indicators.benefitsAvailable,
      icon: Gift,
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900">
            Clientes
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            {indicators.totalCustomers} cliente(s) cadastrado(s)
          </p>
        </div>
        <Link
          href="/administracao/clientes/modelos"
          className="text-sm font-medium text-lilac-700 hover:underline"
        >
          Modelos de mensagem
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-2xl border border-ink-100 bg-white p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-ink-500">{label}</span>
              <Icon className="size-4 text-lilac-600" />
            </div>
            <p className="mt-2 font-display text-2xl font-semibold text-ink-900">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <CustomersToolbar />
      </div>

      {total === 0 &&
        !params.busca &&
        !params.beneficio &&
        !params.aniversario && (
          <p className="mt-4 rounded-xl border border-warning-200 bg-warning-50 p-4 text-sm text-warning-700">
            Nenhum cliente encontrado. Se você já aplicou a migration
            0004_customers.sql no Supabase, recarregue a página.
          </p>
        )}

      <div className="mt-4">
        <CustomersTable customers={items} />
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          basePath="/administracao/clientes"
          searchParams={params}
        />
      </div>
    </div>
  );
}
