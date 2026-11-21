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
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  productFormSchema,
  type ProductFormValues,
} from "@/lib/validations/product";
import { slugify } from "@/lib/utils/slugify";
import type { Category } from "@/types/domain";
import type { Product } from "@/types/domain";

import { NewProductImagesPicker } from "./new-product-images-picker";
import { ProductImageManager } from "./product-image-manager";

// zod usa `coerce`/`preprocess` para campos numéricos vindos de <input>, então o
// tipo "bruto" (pré-validação) difere do tipo validado — useForm recebe os dois
// via generics para o react-hook-form repassar o valor já validado ao onSubmit.
type ProductFormInput = z.input<typeof productFormSchema>;

function toDatetimeLocal(value: string | null): string {
  if (!value) return "";
  return value.slice(0, 16);
}

function buildFormData(values: ProductFormValues, newImages: File[]): FormData {
  const formData = new FormData();
  formData.set("name", values.name);
  formData.set("slug", values.slug);
  formData.set("description", values.description ?? "");
  formData.set("category_id", values.category_id ?? "");
  formData.set("price", String(values.price));
  formData.set(
    "promotional_price",
    values.promotional_price ? String(values.promotional_price) : "",
  );
  formData.set("promotion_start", values.promotion_start ?? "");
  formData.set("promotion_end", values.promotion_end ?? "");
  formData.set("sku", values.sku ?? "");
  formData.set(
    "stock_quantity",
    values.stock_quantity != null ? String(values.stock_quantity) : "",
  );
  if (values.featured) formData.set("featured", "on");
  if (values.active) formData.set("active", "on");
  formData.set("display_order", String(values.display_order));
  for (const file of newImages) formData.append("images", file);
  return formData;
}

export function ProductForm({
  categories,
  product,
  onSubmitAction,
}: {
  categories: Category[];
  product?: Product;
  onSubmitAction: (
    formData: FormData,
  ) => Promise<{ error: string | null; fieldErrors?: Record<string, string> }>;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [slugEdited, setSlugEdited] = useState(Boolean(product));
  const [isPromotional, setIsPromotional] = useState(
    Boolean(product?.promotional_price),
  );
  const [newImages, setNewImages] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: product
      ? {
          name: product.name,
          slug: product.slug,
          description: product.description ?? "",
          category_id: product.category_id,
          price: product.price,
          promotional_price: product.promotional_price,
          promotion_start: toDatetimeLocal(product.promotion_start),
          promotion_end: toDatetimeLocal(product.promotion_end),
          sku: product.sku ?? "",
          stock_quantity: product.stock_quantity,
          featured: product.featured,
          active: product.active,
          display_order: product.display_order,
        }
      : {
          name: "",
          slug: "",
          description: "",
          category_id: null,
          price: 0,
          promotional_price: null,
          promotion_start: "",
          promotion_end: "",
          sku: "",
          stock_quantity: null,
          featured: false,
          active: true,
          display_order: 0,
        },
  });

  const nameValue = watch("name");

  function handleNameChange(value: string) {
    setValue("name", value);
    if (!slugEdited) {
      setValue("slug", slugify(value));
    }
  }

  function handleTogglePromotional(checked: boolean) {
    setIsPromotional(checked);
    if (!checked) {
      // Garante que nenhum valor digitado antes de desmarcar seja enviado —
      // sem promoção ativa, o produto usa só o preço normal.
      setValue("promotional_price", null);
      setValue("promotion_start", "");
      setValue("promotion_end", "");
    }
  }

  async function onSubmit(values: ProductFormValues) {
    setServerError(null);
    startTransition(async () => {
      const result = await onSubmitAction(buildFormData(values, newImages));
      if (result.error) {
        setServerError(result.error);
        return;
      }
      router.push("/administracao/produtos");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {serverError && <Alert variant="danger">{serverError}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Nome do produto"
          htmlFor="name"
          error={errors.name?.message}
          required
        >
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
      </div>

      <Field
        label="Descrição"
        htmlFor="description"
        error={errors.description?.message}
      >
        <Textarea id="description" rows={5} {...register("description")} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Categoria"
          htmlFor="category_id"
          error={errors.category_id?.message}
        >
          <Select
            id="category_id"
            {...register("category_id")}
            value={watch("category_id") ?? ""}
          >
            <option value="">Sem categoria</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="SKU (opcional)" htmlFor="sku" error={errors.sku?.message}>
          <Input id="sku" {...register("sku")} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Preço (R$)"
          htmlFor="price"
          error={errors.price?.message}
          required
        >
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            {...register("price")}
          />
        </Field>

        <Field
          label="Estoque (opcional)"
          htmlFor="stock_quantity"
          error={errors.stock_quantity?.message}
        >
          <Input
            id="stock_quantity"
            type="number"
            min="0"
            step="1"
            {...register("stock_quantity")}
          />
        </Field>
      </div>

      <div className="rounded-xl border border-ink-100 p-4">
        <label className="flex items-center gap-2 text-sm font-medium text-ink-900">
          <input
            type="checkbox"
            className="size-4 rounded border-ink-300"
            checked={isPromotional}
            onChange={(event) => handleTogglePromotional(event.target.checked)}
          />
          Este produto está em promoção?
        </label>
        <p className="mt-1 text-xs text-ink-500">
          Se não marcado, o produto usa só o preço normal, sem selo de promoção.
        </p>

        {isPromotional && (
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Field
              label="Preço promocional (R$)"
              htmlFor="promotional_price"
              error={errors.promotional_price?.message}
              required
            >
              <Input
                id="promotional_price"
                type="number"
                step="0.01"
                min="0"
                required={isPromotional}
                {...register("promotional_price")}
              />
            </Field>

            <Field
              label="Início da promoção"
              htmlFor="promotion_start"
              error={errors.promotion_start?.message}
              hint="Deixe em branco para começar imediatamente"
            >
              <Input
                id="promotion_start"
                type="datetime-local"
                {...register("promotion_start")}
              />
            </Field>

            <Field
              label="Término da promoção"
              htmlFor="promotion_end"
              error={errors.promotion_end?.message}
              hint="Deixe em branco para não ter data de término"
            >
              <Input
                id="promotion_end"
                type="datetime-local"
                {...register("promotion_end")}
              />
            </Field>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
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
            {...register("featured")}
          />
          Produto em destaque
        </label>

        <label className="flex items-center gap-2 pt-6 text-sm font-medium text-ink-900">
          <input
            type="checkbox"
            className="size-4 rounded border-ink-300"
            {...register("active")}
          />
          Produto ativo (visível na loja)
        </label>
      </div>

      <div className="border-t border-ink-100 pt-6">
        <h2 className="mb-3 text-sm font-semibold text-ink-900">
          Imagens do produto
        </h2>
        {product ? (
          <ProductImageManager product={product} />
        ) : (
          <NewProductImagesPicker onChange={setNewImages} />
        )}
      </div>

      <div className="flex justify-end gap-3 border-t border-ink-100 pt-6">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={pending}>
          {product ? "Salvar alterações" : "Criar produto"}
        </Button>
      </div>
    </form>
  );
}
