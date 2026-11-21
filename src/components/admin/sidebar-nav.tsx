"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ListTree,
  LogOut,
  Package,
  ScrollText,
  Settings,
} from "lucide-react";

import { logoutAction } from "@/features/auth/actions";
import { cn } from "@/lib/utils/cn";

const NAV_ITEMS = [
  {
    href: "/administracao",
    label: "Dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  { href: "/administracao/produtos", label: "Produtos", icon: Package },
  { href: "/administracao/categorias", label: "Categorias", icon: ListTree },
  {
    href: "/administracao/configuracoes",
    label: "Configurações",
    icon: Settings,
  },
  { href: "/administracao/auditoria", label: "Auditoria", icon: ScrollText },
];

/** Conteúdo da navegação do painel — sem o <aside> ao redor, para o
 * posicionamento (fixo no mobile, estático no desktop) ficar a cargo de
 * quem usa este componente (ver AdminShell). */
export function AdminSidebarNav({
  adminName,
  onNavigate,
}: {
  adminName: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      <div className="flex items-center gap-2 border-b border-ink-100 px-5 py-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/gr-monogram.svg" alt="" className="h-9 w-auto" />
        <div>
          <p className="text-sm font-semibold text-ink-900">GR Design</p>
          <p className="text-xs text-ink-500">Painel administrativo</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "focus-ring flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
                active
                  ? "bg-lilac-100 text-lilac-800"
                  : "text-ink-700 hover:bg-ink-50",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-ink-100 p-3">
        <p className="truncate px-3 text-xs text-ink-500">
          Logado como {adminName}
        </p>
        <form action={logoutAction}>
          <button
            type="submit"
            className="focus-ring mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50"
          >
            <LogOut className="size-4" />
            Sair
          </button>
        </form>
      </div>
    </>
  );
}
