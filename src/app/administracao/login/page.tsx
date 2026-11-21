import type { Metadata } from "next";

import { LoginForm } from "@/features/auth/login-form";

export const metadata: Metadata = {
  title: "Login administrativo",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-lilac-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-ink-100 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <span className="inline-flex size-12 items-center justify-center rounded-full bg-lilac-100 font-display text-lg font-semibold text-lilac-700">
            GR
          </span>
          <h1 className="mt-4 font-display text-xl font-semibold text-ink-900">
            Painel administrativo
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Acesso restrito à equipe GR Design
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
