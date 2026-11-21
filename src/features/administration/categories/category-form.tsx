"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/lib/utils/slugify";
import {
  categoryFormSchema,
  type CategoryFormValues,
} from "@/lib/validations/category";
import type { Category } from "@/types/domain";

import { CategoryImageUploader } from "./category-image-uploader";

type CategoryFormInput = z.input<typeof categoryFormSchema>;

function buildFormData(values: CategoryFormValues): FormData {
  const formData = new FormData();
  formData.set("name", values.name);
  formData.set("slug", values.slug);
  formData.set("description", values.description ?? "");
  formData.set("image_url", values.image_url ?? "");
  formData.set("display_order", String(values.display_order));
  if (values.active) formData.set("active", "on");
  return formData;
}

export function CategoryForm({
  category,
  onSubmitAction,
}: {
  category?: Category;
  onSubmitAction: (
    formData: FormData,
  ) => Promise<{ error: string | null; fieldErrors?: Record<string, string> }>;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [slugEdited, setSlugEdited] = useState(Boolean(category));

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CategoryFormInput, unknown, CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: category
      ? {
          name: category.name,
          slug: category.slug,
          description: category.description ?? "",
          image_url: category.image_url,
          display_order: category.display_order,
          active: category.active,
        }
      : {
          name: "",
          slug: "",
          description: "",
          image_url: null,
          display_order: 0,
          active: true,
        },
  });

  const nameValue = watch("name");

  function handleNameChange(value: string) {
    setValue("name", value);
    if (!slugEdited) {
      setValue("slug", slugify(value));
    }
  }

  async function onSubmit(values: CategoryFormValues) {
    setServerError(null);
    startTransition(async () => {
      const result = await onSubmitAction(buildFormData(values));
      if (result.error) {
        setServerError(result.error);
        return;
      }
      router.push("/administracao/categorias");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {serverError && <Alert variant="danger">{serverError}</Alert>}

      <Field label="Nome" htmlFor="name" error={errors.name?.message} required>
        <Input
          id="name"
          value={nameValue}
          onChange={(event) => handleNameChange(event.target.value)}
        />
      </Field>

      <Field
        label="URL amigável (slug)"
        htmlFor="slug"
        error={errors.slug?.message}
        required
      >
        <Input
          id="slug"
          {...register("slug", { onChange: () => setSlugEdited(true) })}
        />
      </Field>

      <Field
        label="Descrição"
        htmlFor="description"
        error={errors.description?.message}
      >
        <Textarea id="description" rows={3} {...register("description")} />
      </Field>

      {category ? (
        <div>
          <span className="mb-1.5 block text-sm font-medium text-ink-900">
            Imagem de capa
          </span>
          <CategoryImageUploader
            categoryId={category.id}
            currentImageUrl={watch("image_url") ?? null}
          />
          <input type="hidden" {...register("image_url")} />
        </div>
      ) : (
        <Field
          label="URL da imagem de capa (opcional)"
          htmlFor="image_url"
          error={errors.image_url?.message}
          hint="Após criar a categoria você poderá fazer upload direto da imagem"
        >
          <Input id="image_url" {...register("image_url")} />
        </Field>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Ordem de exibição"
          htmlFor="display_order"
          error={errors.display_order?.message}
        >
          <Input
            id="display_order"
            type="number"
            min="0"
            step="1"
            {...register("display_order")}
          />
        </Field>

        <label className="flex items-center gap-2 pt-6 text-sm font-medium text-ink-900">
          <input
            type="checkbox"
            className="size-4 rounded border-ink-300"
            {...register("active")}
          />
          Categoria ativa (visível na loja)
        </label>
      </div>

      <div className="flex justify-end gap-3 border-t border-ink-100 pt-6">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={pending}>
          {category ? "Salvar alterações" : "Criar categoria"}
        </Button>
      </div>
    </form>
  );
}
