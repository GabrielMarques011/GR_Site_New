"use server";

import { revalidatePath } from "next/cache";

import { productFormSchema } from "@/lib/validations/product";
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

export interface ProductFormState {
  error: string | null;
  fieldErrors?: Record<string, string>;
}

function parseProductForm(formData: FormData) {
  const raw = {
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    category_id: formData.get("category_id") || null,
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
}

export async function createProductAction(
  _prevState: ProductFormState,
  formData: FormData,
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

  const id = await createProduct(parsed.data);
  await logAuditEvent("product.create", "products", id, {
    name: parsed.data.name,
  });

  revalidateProductPaths();
  return { error: null };
}

export async function updateProductAction(
  productId: string,
  _prevState: ProductFormState,
  formData: FormData,
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
  revalidatePath(`/produtos/${parsed.data.slug}`);
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
