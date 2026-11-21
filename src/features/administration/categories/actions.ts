"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { categoryFormSchema } from "@/lib/validations/category";
import { logAuditEvent } from "@/services/audit";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/services/categories";
import { uploadCategoryImage } from "@/services/category-images";

export interface CategoryFormState {
  error: string | null;
  fieldErrors?: Record<string, string>;
}

function parseCategoryForm(formData: FormData) {
  return categoryFormSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    display_order: formData.get("display_order") || 0,
    active: formData.get("active") === "on",
  });
}

function revalidateCategoryPaths() {
  revalidatePath("/administracao/categorias");
  revalidatePath("/categorias");
  revalidatePath("/produtos");
}

export async function createCategoryAction(
  _prevState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const parsed = parseCategoryForm(formData);

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

  const id = await createCategory(parsed.data);

  // A categoria já existe neste ponto — se o upload da imagem falhar, o
  // erro é só registrado na auditoria, nunca bloqueia a criação. A imagem
  // pode ser enviada (ou reenviada) depois, na edição da categoria.
  const imageFile = formData.get("image");
  if (imageFile instanceof File && imageFile.size > 0) {
    try {
      const imageUrl = await uploadCategoryImage(id, imageFile);
      const supabase = await createClient();
      await supabase
        .from("categories")
        .update({ image_url: imageUrl })
        .eq("id", id);
    } catch (error) {
      await logAuditEvent("category.create", "categories", id, {
        name: parsed.data.name,
        imageError: error instanceof Error ? error.message : String(error),
      });
      revalidateCategoryPaths();
      return { error: null };
    }
  }

  await logAuditEvent("category.create", "categories", id, {
    name: parsed.data.name,
  });
  revalidateCategoryPaths();
  return { error: null };
}

export async function updateCategoryAction(
  categoryId: string,
  _prevState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const parsed = parseCategoryForm(formData);

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

  await updateCategory(categoryId, parsed.data);
  await logAuditEvent("category.update", "categories", categoryId, {
    name: parsed.data.name,
  });
  revalidateCategoryPaths();
  return { error: null };
}

export async function deleteCategoryAction(categoryId: string): Promise<void> {
  await deleteCategory(categoryId);
  await logAuditEvent("category.delete", "categories", categoryId);
  revalidateCategoryPaths();
}

export interface CategoryImageUploadState {
  error: string | null;
  imageUrl?: string;
}

export async function uploadCategoryImageAction(
  categoryId: string,
  _prevState: CategoryImageUploadState,
  formData: FormData,
): Promise<CategoryImageUploadState> {
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return { error: "Selecione um arquivo de imagem." };
  }

  try {
    const imageUrl = await uploadCategoryImage(categoryId, file);
    const supabase = await createClient();
    await supabase
      .from("categories")
      .update({ image_url: imageUrl })
      .eq("id", categoryId);

    revalidateCategoryPaths();
    return { error: null, imageUrl };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Falha ao enviar imagem.",
    };
  }
}

export async function removeCategoryImageAction(
  categoryId: string,
): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("categories")
    .update({ image_url: null })
    .eq("id", categoryId);

  await logAuditEvent("category.update", "categories", categoryId, {
    imageRemoved: true,
  });
  revalidateCategoryPaths();
}
