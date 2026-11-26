"use client";

import { useState } from "react";

import { cn } from "@/lib/utils/cn";

import { PhoneLoginForm } from "./phone-login-form";
import { RegisterForm } from "./register-form";

export function CadastroTabs() {
  const [mode, setMode] = useState<"register" | "login">("register");

  return (
    <div>
      <div className="mb-6 flex rounded-xl border border-ink-100 bg-ink-50 p-1">
        <button
          type="button"
          onClick={() => setMode("register")}
          className={cn(
            "focus-ring flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            mode === "register"
              ? "bg-white text-lilac-800 shadow-sm"
              : "text-ink-600 hover:text-ink-900",
          )}
        >
          Criar cadastro
        </button>
        <button
          type="button"
          onClick={() => setMode("login")}
          className={cn(
            "focus-ring flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            mode === "login"
              ? "bg-white text-lilac-800 shadow-sm"
              : "text-ink-600 hover:text-ink-900",
          )}
        >
          Já sou cliente GR Design
        </button>
      </div>

      {mode === "register" ? <RegisterForm /> : <PhoneLoginForm />}
    </div>
  );
}
