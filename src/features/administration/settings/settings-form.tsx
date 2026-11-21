"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  storeSettingsFormSchema,
  type StoreSettingsFormValues,
} from "@/lib/validations/settings";
import type { StoreSettingsRow } from "@/types/database";

import { LogoUploader } from "./logo-uploader";

function buildFormData(values: StoreSettingsFormValues): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value ?? "");
  }
  return formData;
}

export function SettingsForm({
  settings,
  onSubmitAction,
}: {
  settings: StoreSettingsRow;
  onSubmitAction: (
    formData: FormData,
  ) => Promise<{ error: string | null; fieldErrors?: Record<string, string> }>;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StoreSettingsFormValues>({
    resolver: zodResolver(storeSettingsFormSchema),
    defaultValues: {
      store_name: settings.store_name,
      slogan: settings.slogan ?? "",
      about_text: settings.about_text ?? "",
      whatsapp: settings.whatsapp ?? "",
      instagram_url: settings.instagram_url ?? "",
      address: settings.address ?? "",
      maps_url: settings.maps_url ?? "",
    },
  });

  async function onSubmit(values: StoreSettingsFormValues) {
    setServerError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await onSubmitAction(buildFormData(values));
      if (result.error) {
        setServerError(result.error);
        return;
      }
      setSuccess(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {serverError && <Alert variant="danger">{serverError}</Alert>}
      {success && (
        <Alert variant="success">Configurações atualizadas com sucesso.</Alert>
      )}

      <Field
        label="Nome da loja"
        htmlFor="store_name"
        error={errors.store_name?.message}
        required
      >
        <Input id="store_name" {...register("store_name")} />
      </Field>

      <Field label="Slogan" htmlFor="slogan" error={errors.slogan?.message}>
        <Input id="slogan" {...register("slogan")} />
      </Field>

      <Field
        label="Texto institucional (Sobre nós)"
        htmlFor="about_text"
        error={errors.about_text?.message}
      >
        <Textarea id="about_text" rows={6} {...register("about_text")} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="WhatsApp"
          htmlFor="whatsapp"
          error={errors.whatsapp?.message}
          hint="Formato internacional, ex: 5511919335496"
        >
          <Input id="whatsapp" {...register("whatsapp")} />
        </Field>

        <Field
          label="Instagram (URL)"
          htmlFor="instagram_url"
          error={errors.instagram_url?.message}
        >
          <Input id="instagram_url" {...register("instagram_url")} />
        </Field>
      </div>

      <Field label="Endereço" htmlFor="address" error={errors.address?.message}>
        <Input id="address" {...register("address")} />
      </Field>

      <Field
        label="URL do mapa (incorporar)"
        htmlFor="maps_url"
        error={errors.maps_url?.message}
        hint="Link de incorporação do Google Maps (Compartilhar > Incorporar mapa)"
      >
        <Input id="maps_url" {...register("maps_url")} />
      </Field>

      <div>
        <span className="mb-1.5 block text-sm font-medium text-ink-900">
          Logo
        </span>
        <LogoUploader
          settingsId={settings.id}
          currentLogoUrl={settings.logo_url}
        />
      </div>

      <div className="flex justify-end border-t border-ink-100 pt-6">
        <Button type="submit" isLoading={pending}>
          Salvar configurações
        </Button>
      </div>
    </form>
  );
}
