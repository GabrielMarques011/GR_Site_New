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
  customerAdminUpdateSchema,
  type CustomerAdminUpdateValues,
} from "@/lib/validations/customer";
import type { Customer } from "@/types/domain";

import { updateCustomerAction } from "./actions";

type CustomerEditFormInput = z.input<typeof customerAdminUpdateSchema>;

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

function buildFormData(values: CustomerAdminUpdateValues): FormData {
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

export function CustomerEditForm({ customer }: { customer: Customer }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();
  const [cepLoading, setCepLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CustomerEditFormInput, unknown, CustomerAdminUpdateValues>({
    resolver: zodResolver(customerAdminUpdateSchema),
    defaultValues: {
      full_name: customer.full_name,
      phone: customer.phone,
      birth_date: customer.birth_date,
      zip_code: customer.zip_code,
      street: customer.street,
      number: customer.number,
      complement: customer.complement ?? "",
      neighborhood: customer.neighborhood,
      city: customer.city,
      state: customer.state as CustomerAdminUpdateValues["state"],
      whatsapp_marketing_opt_in: customer.whatsapp_marketing_opt_in,
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
        setValue("state", address.state as CustomerAdminUpdateValues["state"], {
          shouldValidate: true,
        });
      }
    }
  }

  async function onSubmit(values: CustomerAdminUpdateValues) {
    setServerError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await updateCustomerAction(
        customer.id,
        { error: null },
        buildFormData(values),
      );
      if (result.error) {
        setServerError(result.error);
        return;
      }
      setSuccess(true);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {serverError && <Alert variant="danger">{serverError}</Alert>}
      {success && <Alert variant="success">Cadastro atualizado.</Alert>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Nome completo"
          htmlFor="edit_full_name"
          error={errors.full_name?.message}
          required
        >
          <Input id="edit_full_name" {...register("full_name")} />
        </Field>

        <Field
          label="WhatsApp"
          htmlFor="edit_phone"
          error={errors.phone?.message}
          required
        >
          <Input
            id="edit_phone"
            inputMode="tel"
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
        htmlFor="edit_birth_date"
        error={errors.birth_date?.message}
        required
      >
        <Input
          id="edit_birth_date"
          type="date"
          className="sm:max-w-xs"
          {...register("birth_date")}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          label="CEP"
          htmlFor="edit_zip_code"
          error={errors.zip_code?.message}
          hint={cepLoading ? "Buscando endereço…" : undefined}
          required
        >
          <div className="relative">
            <Input
              id="edit_zip_code"
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
            htmlFor="edit_street"
            error={errors.street?.message}
            required
          >
            <Input id="edit_street" {...register("street")} />
          </Field>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          label="Número"
          htmlFor="edit_number"
          error={errors.number?.message}
          required
        >
          <Input id="edit_number" {...register("number")} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Complemento (opcional)" htmlFor="edit_complement">
            <Input id="edit_complement" {...register("complement")} />
          </Field>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          label="Bairro"
          htmlFor="edit_neighborhood"
          error={errors.neighborhood?.message}
          required
        >
          <Input id="edit_neighborhood" {...register("neighborhood")} />
        </Field>
        <Field
          label="Cidade"
          htmlFor="edit_city"
          error={errors.city?.message}
          required
        >
          <Input id="edit_city" {...register("city")} />
        </Field>
        <Field
          label="Estado"
          htmlFor="edit_state"
          error={errors.state?.message}
          required
        >
          <Select id="edit_state" {...register("state")}>
            {BRAZILIAN_STATES.map((uf) => (
              <option key={uf} value={uf}>
                {uf}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink-900">
        <input
          type="checkbox"
          className="size-4 rounded border-ink-300"
          {...register("whatsapp_marketing_opt_in")}
        />
        Autoriza mensagens de aniversário e promocionais pelo WhatsApp
      </label>

      <div className="flex justify-end border-t border-ink-100 pt-4">
        <Button type="submit" isLoading={pending}>
          Salvar alterações
        </Button>
      </div>
    </form>
  );
}
