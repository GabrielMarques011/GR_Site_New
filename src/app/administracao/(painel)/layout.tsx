import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AdminSidebar } from "@/components/admin/sidebar";
import { getCurrentAdmin } from "@/features/auth/get-current-admin";

export default async function AdminPanelLayout({
  children,
}: {
  children: ReactNode;
}) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/administracao/login");
  }

  return (
    <div className="flex min-h-screen bg-ink-50/40">
      <AdminSidebar adminName={admin.profile.name} />
      <div className="flex-1 overflow-x-hidden">
        <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
