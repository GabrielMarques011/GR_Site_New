"use server";

import { revalidatePath } from "next/cache";

import { productFormSchema } from "@/lib/validations/product";
import { productOptionSchema } from "@/lib/validations/product-option";
import { logAuditEvent } from "@/services/audit";
import {
  createProduct,
  deleteProduct,
  setProductActive,
  updateProduct,
} from "@/services/products";
import {
  deleteProductImage,
  uploadProductImage,
} from "@/services/product-images";
import {
  bulkCreateProductOptions,
  createProductOption,
  deleteProductOption,
  setProductOptionActive,
  updateProductOption,
} from "@/services/product-options";
import type { ProductKind } from "@/types/domain";

export interface ProductFormState {
  error: string | null;
  fieldErrors?: Record<string, string>;
  productId?: string;
}

function parseProductForm(formData: FormData) {
  const raw = {
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    category_id: formData.get("category_id") || null,
    campaign_id: formData.get("campaign_id") || null,
    price: formData.get("price"),
    promotional_price: formData.get("promotional_price") || null,
    promotion_start: formData.get("promotion_start") || null,
    promotion_end: formData.get("promotion_end") || null,
    sku: formData.get("sku"),
    stock_quantity: formData.get("stock_quantity") || null,
    featured: formData.get("featured") === "on",
    active: formData.get("active") === "on",
    display_order: formData.get("display_order") || 0,
  };

  return productFormSchema.safeParse(raw);
}

function revalidateProductPaths() {
  revalidatePath("/administracao/produtos");
  revalidatePath("/produtos");
  revalidatePath("/administracao/produtos-loja");
  revalidatePath("/loja");
}

export async function createProductAction(
  _prevState: ProductFormState,
  formData: FormData,
  kind: ProductKind = "personalizado",
): Promise<ProductFormState> {
  const parsed = parseProductForm(formData);

  if (!parsed.success) {
    return {
      error: "Revise os campos destacados.",
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((issue) => [
          issue.path.join("."),
          issue.message,
        ]),
      ),
    };
  }

  const id = await createProduct(parsed.data, kind);

  // O produto já existe neste ponto — se alguma imagem falhar ao enviar,
  // o erro não deve impedir a criação. As imagens que derem certo já ficam
  // salvas; o restante pode ser enviado depois, editando o produto.
  const imageFiles = formData
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  const imageErrors: string[] = [];
  for (const file of imageFiles) {
    try {
      await uploadProductImage(id, file);
    } catch (error) {
      imageErrors.push(error instanceof Error ? error.message : String(error));
    }
  }

  // Mesma lógica das imagens: o produto já existe, então uma opção de
  // compra que falhar não deve impedir a criação — o resto pode ser
  // cadastrado depois, editando o produto.
  let optionsCreated = 0;
  const optionsRaw = formData.get("options");
  if (typeof optionsRaw === "string" && optionsRaw) {
    try {
      const parsedOptions = JSON.parse(optionsRaw);
      if (Array.isArray(parsedOptions)) {
        const validOptions = parsedOptions
          .map((item) => productOptionSchema.safeParse(item))
          .filter((result) => result.success)
          .map((result) => result.data);
        await bulkCreateProductOptions(id, validOptions);
        optionsCreated = validOptions.length;
      }
    } catch (error) {
      console.error("Falha ao criar opções de compra do novo produto:", error);
    }
  }

  await logAuditEvent("product.create", "products", id, {
    name: parsed.data.name,
    imagesUploaded: imageFiles.length - imageErrors.length,
    imageErrors: imageErrors.length || undefined,
    optionsCreated: optionsCreated || undefined,
  });

  revalidateProductPaths();
  return { error: null, productId: id };
}

export async function updateProductAction(
  productId: string,
  _prevState: ProductFormState,
  formData: FormData,
  kind: ProductKind = "personalizado",
): Promise<ProductFormState> {
  const parsed = parseProductForm(formData);

  if (!parsed.success) {
    return {
      error: "Revise os campos destacados.",
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((issue) => [
          issue.path.join("."),
          issue.message,
        ]),
      ),
    };
  }

  await updateProduct(productId, parsed.data);
  await logAuditEvent("product.update", "products", productId, {
    name: parsed.data.name,
  });

  revalidateProductPaths();
  revalidatePath(
    kind === "loja"
      ? `/loja/${parsed.data.slug}`
      : `/produtos/${parsed.data.slug}`,
  );
  return { error: null };
}

export async function toggleProductActiveAction(
  productId: string,
  active: boolean,
) {
  await setProductActive(productId, active);
  await logAuditEvent(
    active ? "product.activate" : "product.deactivate",
    "products",
    productId,
  );
  revalidateProductPaths();
}

export async function deleteProductAction(productId: string) {
  await deleteProduct(productId);
  await logAuditEvent("product.delete", "products", productId);
  revalidateProductPaths();
}

export interface ImageUploadState {
  error: string | null;
}

export async function uploadProductImageAction(
  productId: string,
  _prevState: ImageUploadState,
  formData: FormData,
): Promise<ImageUploadState> {
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return { error: "Selecione um arquivo de imagem." };
  }

  try {
    await uploadProductImage(productId, file);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Falha ao enviar imagem.",
    };
  }

  revalidatePath(`/administracao/produtos/${productId}`);
  return { error: null };
}

export async function deleteProductImageAction(
  productId: string,
  imageId: string,
) {
  await deleteProductImage(imageId);
  revalidatePath(`/administracao/produtos/${productId}`);
}

export interface ProductOptionFormState {
  error: string | null;
  fieldErrors?: Record<string, string>;
}

function parseProductOptionForm(formData: FormData) {
  return productOptionSchema.safeParse({
    name: formData.get("name"),
    quantity: formData.get("quantity"),
    price: formData.get("price"),
    active: formData.get("active") === "on",
    display_order: formData.get("display_order") || 0,
  });
}

export async function createProductOptionAction(
  productId: string,
  _prevState: ProductOptionFormState,
  formData: FormData,
): Promise<ProductOptionFormState> {
  const parsed = parseProductOptionForm(formData);

  if (!parsed.success) {
    return {
      error: "Revise os campos destacados.",
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((issue) => [
          issue.path.join("."),
          issue.message,
        ]),
      ),
    };
  }

  try {
    await createProductOption(productId, parsed.data);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Falha ao criar opção.",
    };
  }

  await logAuditEvent("product.update", "products", productId, {
    optionAdded: parsed.data.name,
  });
  revalidatePath(`/administracao/produtos/${productId}`);
  return { error: null };
}

export async function updateProductOptionAction(
  productId: string,
  optionId: string,
  _prevState: ProductOptionFormState,
  formData: FormData,
): Promise<ProductOptionFormState> {
  const parsed = parseProductOptionForm(formData);

  if (!parsed.success) {
    return {
      error: "Revise os campos destacados.",
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((issue) => [
          issue.path.join("."),
          issue.message,
        ]),
      ),
    };
  }

  try {
    await updateProductOption(optionId, parsed.data);
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Falha ao atualizar opção.",
    };
  }

  revalidatePath(`/administracao/produtos/${productId}`);
  return { error: null };
}

export async function deleteProductOptionAction(
  productId: string,
  optionId: string,
) {
  await deleteProductOption(optionId);
  await logAuditEvent("product.update", "products", productId, {
    optionDeleted: optionId,
  });
  revalidatePath(`/administracao/produtos/${productId}`);
}

export async function toggleProductOptionActiveAction(
  productId: string,
  optionId: string,
  active: boolean,
) {
  await setProductOptionActive(optionId, active);
  revalidatePath(`/administracao/produtos/${productId}`);
}
