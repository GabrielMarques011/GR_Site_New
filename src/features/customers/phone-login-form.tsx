"use client";

import { useState, useTransition } from "react";
import { HeartHandshake } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { maskBrazilianPhone } from "@/lib/utils/phone";

import { loginCustomerAction } from "./actions";

export function PhoneLoginForm() {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const [success, setSuccess] = useState<{ fullName: string } | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const formData = new FormData();
    formData.set("phone", phone);

    startTransition(async () => {
      const result = await loginCustomerAction({ error: null }, formData);
      if (result.error) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      if (result.success) {
        setSuccess(result.success);
      }
    });
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-lilac-200 bg-lilac-50/60 p-6 text-center">
        <HeartHandshake className="size-10 text-lilac-600" />
        <h2 className="font-display text-xl font-semibold text-ink-900">
          Bem-vindo de volta, {success.fullName}! 💜
        </h2>
        <p className="text-ink-700">
          Encontramos seu cadastro! Seus dados já estão disponíveis para
          facilitar suas compras.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <Alert variant="danger">{error}</Alert>}

      <p className="text-sm text-ink-700">
        Informe o WhatsApp que você usou no cadastro para acessar seus dados
        neste aparelho.
      </p>

      <Field
        label="WhatsApp"
        htmlFor="login-phone"
        error={fieldErrors.phone}
        required
      >
        <Input
          id="login-phone"
          inputMode="tel"
          placeholder="(11) 91933-5496"
          value={phone}
          onChange={(event) => setPhone(maskBrazilianPhone(event.target.value))}
        />
      </Field>

      <Button type="submit" size="lg" isLoading={pending}>
        Acessar meu cadastro
      </Button>
    </form>
  );
}
