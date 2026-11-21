import type { Metadata } from "next";
import {
  Package,
  PackageCheck,
  PackageX,
  Percent,
  Sparkles,
  Tags,
} from "lucide-react";

import { getDashboardStats } from "@/services/dashboard";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  const cards = [
    { label: "Total de produtos", value: stats.totalProducts, icon: Package },
    {
      label: "Produtos ativos",
      value: stats.activeProducts,
      icon: PackageCheck,
    },
    {
      label: "Produtos inativos",
      value: stats.inactiveProducts,
      icon: PackageX,
    },
    { label: "Categorias", value: stats.totalCategories, icon: Tags },
    { label: "Em promoção", value: stats.promotionalProducts, icon: Percent },
    { label: "Em destaque", value: stats.featuredProducts, icon: Sparkles },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink-900">
        Dashboard
      </h1>
      <p className="mt-1 text-sm text-ink-500">
        Visão geral da loja GR Design.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-2xl border border-ink-100 bg-white p-5"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-ink-500">{label}</span>
              <Icon className="size-5 text-lilac-600" />
            </div>
            <p className="mt-3 font-display text-3xl font-semibold text-ink-900">
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
