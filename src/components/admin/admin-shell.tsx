"use client";

import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";

import { cn } from "@/lib/utils/cn";

import { AdminSidebarNav } from "./sidebar-nav";

export function AdminShell({
  adminName,
  children,
}: {
  adminName: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);

  // Fecha a gaveta automaticamente ao navegar — ajustado durante a própria
  // renderização (padrão recomendado pelo React para "resetar estado quando
  // uma prop muda"), sem precisar de um useEffect extra.
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  return (
    <div className="flex min-h-screen bg-ink-50/40">
      {open && (
        <div
          className="fixed inset-0 z-40 bg-ink-900/40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-white shadow-xl transition-transform duration-200 lg:static lg:z-auto lg:w-64 lg:max-w-none lg:translate-x-0 lg:border-r lg:border-ink-100 lg:shadow-none",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="focus-ring absolute right-3 top-3 flex size-8 items-center justify-center rounded-full text-ink-500 hover:bg-ink-50 lg:hidden"
          aria-label="Fechar menu"
        >
          <X className="size-4" />
        </button>
        <AdminSidebarNav
          adminName={adminName}
          onNavigate={() => setOpen(false)}
        />
      </aside>

      <div className="min-w-0 flex-1 overflow-x-hidden">
        <header className="flex items-center gap-3 border-b border-ink-100 bg-white px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="focus-ring flex size-9 items-center justify-center rounded-lg text-ink-700 hover:bg-ink-50"
            aria-label="Abrir menu"
          >
            <Menu className="size-5" />
          </button>
          <span className="font-display text-sm font-semibold text-lilac-700">
            GR Design — Painel
          </span>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
