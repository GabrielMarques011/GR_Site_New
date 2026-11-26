"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import type { z } from "zod";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { maskBrazilianPhone } from "@/lib/utils/phone";
import { fetchAddressByCep, maskCep } from "@/lib/utils/viacep";
import {
  customerRegistrationSchema,
  type CustomerRegistrationValues,
} from "@/lib/validations/customer";

import { registerCustomerAction } from "./actions";
import { RegistrationSuccessCard } from "./registration-success-card";

// `whatsapp_marketing_opt_in` tem `.default(false)` no schema, então o tipo
// "bruto" (antes da validação) difere do tipo validado — mesmo padrão já
// usado em product-form.tsx/category-form.tsx para o useForm repassar o
// valor já validado ao onSubmit.
type RegisterFormInput = z.input<typeof customerRegistrationSchema>;

const BRAZILIAN_STATES = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

function buildFormData(values: CustomerRegistrationValues): FormData {
  const formData = new FormData();
  formData.set("full_name", values.full_name);
  formData.set("phone", values.phone);
  formData.set("birth_date", values.birth_date);
  formData.set("zip_code", values.zip_code);
  formData.set("street", values.street);
  formData.set("number", values.number);
  formData.set("complement", values.complement ?? "");
  formData.set("neighborhood", values.neighborhood);
  formData.set("city", values.city);
  formData.set("state", values.state);
  if (values.whatsapp_marketing_opt_in) {
    formData.set("whatsapp_marketing_opt_in", "on");
  }
  return formData;
}

export function RegisterForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const [cepLoading, setCepLoading] = useState(false);
  const [success, setSuccess] = useState<{
    fullName: string;
    recoveryCode: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormInput, unknown, CustomerRegistrationValues>({
    resolver: zodResolver(customerRegistrationSchema),
    defaultValues: {
      full_name: "",
      phone: "",
      birth_date: "",
      zip_code: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "" as CustomerRegistrationValues["state"],
      whatsapp_marketing_opt_in: false,
    },
  });

  async function handleCepBlur() {
    const cep = watch("zip_code");
    if (!cep) return;

    setCepLoading(true);
    const address = await fetchAddressByCep(cep);
    setCepLoading(false);

    if (address) {
      setValue("street", address.street, { shouldValidate: true });
      setValue("neighborhood", address.neighborhood, { shouldValidate: true });
      setValue("city", address.city, { shouldValidate: true });
      if (BRAZILIAN_STATES.includes(address.state)) {
        setValue(
          "state",
          address.state as CustomerRegistrationValues["state"],
          {
            shouldValidate: true,
          },
        );
      }
    }
  }

  async function onSubmit(values: CustomerRegistrationValues) {
    setServerError(null);
    setFieldErrors({});
    startTransition(async () => {
      const result = await registerCustomerAction(
        { error: null },
        buildFormData(values),
      );
      if (result.error) {
        setServerError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      if (result.success) {
        setSuccess(result.success);
      }
    });
  }

  if (success) {
    return <RegistrationSuccessCard recoveryCode={success.recoveryCode} />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {serverError && <Alert variant="danger">{serverError}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Nome completo"
          htmlFor="full_name"
          error={errors.full_name?.message ?? fieldErrors.full_name}
          required
        >
          <Input id="full_name" {...register("full_name")} />
        </Field>

        <Field
          label="WhatsApp"
          htmlFor="phone"
          error={errors.phone?.message ?? fieldErrors.phone}
          hint="Com DDD"
          required
        >
          <Input
            id="phone"
            inputMode="tel"
            placeholder="(11) 91933-5496"
            {...register("phone", {
              onChange: (event) => {
                event.target.value = maskBrazilianPhone(event.target.value);
              },
            })}
          />
        </Field>
      </div>

      <Field
        label="Data de nascimento"
        htmlFor="birth_date"
        error={errors.birth_date?.message ?? fieldErrors.birth_date}
        required
      >
        <Input
          id="birth_date"
          type="date"
          className="sm:max-w-xs"
          {...register("birth_date")}
        />
      </Field>

      <div className="border-t border-ink-100 pt-5">
        <h3 className="mb-3 text-sm font-semibold text-ink-900">Endereço</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            label="CEP"
            htmlFor="zip_code"
            error={errors.zip_code?.message ?? fieldErrors.zip_code}
            hint={cepLoading ? "Buscando endereço…" : undefined}
            required
          >
            <div className="relative">
              <Input
                id="zip_code"
                inputMode="numeric"
                placeholder="00000-000"
                {...register("zip_code", {
                  onChange: (event) => {
                    event.target.value = maskCep(event.target.value);
                  },
                  onBlur: handleCepBlur,
                })}
              />
              {cepLoading && (
                <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-ink-400" />
              )}
            </div>
          </Field>

          <div className="sm:col-span-2">
            <Field
              label="Rua"
              htmlFor="street"
              error={errors.street?.message ?? fieldErrors.street}
              required
            >
              <Input id="street" {...register("street")} />
            </Field>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field
            label="Número"
            htmlFor="number"
            error={errors.number?.message ?? fieldErrors.number}
            required
          >
            <Input id="number" {...register("number")} />
          </Field>

          <div className="sm:col-span-2">
            <Field
              label="Complemento (opcional)"
              htmlFor="complement"
              error={errors.complement?.message}
            >
              <Input id="complement" {...register("complement")} />
            </Field>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field
            label="Bairro"
            htmlFor="neighborhood"
            error={errors.neighborhood?.message ?? fieldErrors.neighborhood}
            required
          >
            <Input id="neighborhood" {...register("neighborhood")} />
          </Field>

          <Field
            label="Cidade"
            htmlFor="city"
            error={errors.city?.message ?? fieldErrors.city}
            required
          >
            <Input id="city" {...register("city")} />
          </Field>

          <Field
            label="Estado"
            htmlFor="state"
            error={errors.state?.message ?? fieldErrors.state}
            required
          >
            <Select id="state" {...register("state")}>
              <option value="">Selecione</option>
              {BRAZILIAN_STATES.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </div>

      <div className="rounded-xl border border-ink-100 p-4">
        <label className="flex items-start gap-2 text-sm text-ink-900">
          <input
            type="checkbox"
            className="mt-0.5 size-4 rounded border-ink-300"
            {...register("whatsapp_marketing_opt_in")}
          />
          <span>
            Autorizo receber mensagens de aniversário e comunicações
            promocionais da GR Design pelo WhatsApp.
          </span>
        </label>
      </div>

      <Button type="submit" size="lg" isLoading={pending}>
        Concluir cadastro
      </Button>
    </form>
  );
}
