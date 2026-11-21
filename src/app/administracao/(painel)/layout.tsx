import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
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

  return <AdminShell adminName={admin.profile.name}>{children}</AdminShell>;
}
