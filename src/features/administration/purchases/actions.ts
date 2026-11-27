"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  materialPurchaseSchema,
  quickProductSchema,
} from "@/lib/validations/purchase";
import { logAuditEvent } from "@/services/audit";
import {
  cancelMaterialPurchase,
  createMaterialPurchase,
  updateMaterialPurchase,
  updatePurchaseReceiptPath,
} from "@/services/material-purchases";
import {
  ReceiptValidationError,
  uploadPurchaseReceipt,
} from "@/services/purchase-receipts";
import { createProduct } from "@/services/products";
import { slugify } from "@/lib/utils/slugify";

function revalidatePurchasePaths(id?: string) {
  revalidatePath("/administracao/compras");
  if (id) revalidatePath(`/administracao/compras/${id}`);
}

export interface PurchaseFormState {
  error: string | null;
  fieldErrors?: Record<string, string>;
  success?: { purchaseId: string };
}

async function parsePurchaseForm(formData: FormData) {
  const itemsRaw = formData.get("items");
  let items: unknown = [];
  try {
    items = JSON.parse(String(itemsRaw ?? "[]"));
  } catch {
    items = [];
  }

  return materialPurchaseSchema.safeParse({
    category: formData.get("category"),
    supplier_id: formData.get("supplier_id") || null,
    supplier_name: formData.get("supplier_name"),
    items,
  });
}

export async function createPurchaseAction(
  _prevState: PurchaseFormState,
  formData: FormData,
): Promise<PurchaseFormState> {
  const parsed = await parsePurchaseForm(formData);

  if (!parsed.success) {
    return {
      error: "Revise os campos destacados.",
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((issue) => [
          issue.path.join(".") || "items",
          issue.message,
        ]),
      ),
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let purchaseId: string;
  try {
    purchaseId = await createMaterialPurchase({
      category: parsed.data.category,
      supplierId: parsed.data.supplier_id,
      supplierName: parsed.data.supplier_name,
      items: parsed.data.items.map((item) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
      })),
      receiptPath: null,
      administratorId: user?.id ?? null,
    });
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Falha ao registrar compra.",
    };
  }

  const receiptFile = formData.get("receipt");
  if (receiptFile instanceof File && receiptFile.size > 0) {
    try {
      const path = await uploadPurchaseReceipt(purchaseId, receiptFile);
      await updatePurchaseReceiptPath(purchaseId, path);
    } catch (error) {
      // A compra já foi registrada e o estoque já foi atualizado — não
      // desfaz nada por causa do comprovante, só avisa que ele não anexou.
      const message =
        error instanceof ReceiptValidationError
          ? error.message
          : "Falha ao anexar o comprovante.";
      await logAuditEvent("purchase.create", "material_purchases", purchaseId, {
        category: parsed.data.category,
        receiptError: message,
      });
      revalidatePurchasePaths(purchaseId);
      return {
        error: `Compra registrada, mas ${message.toLowerCase()} Você pode anexar depois editando a compra.`,
        success: { purchaseId },
      };
    }
  }

  await logAuditEvent("purchase.create", "material_purchases", purchaseId, {
    category: parsed.data.category,
    supplier: parsed.data.supplier_name,
    itemCount: parsed.data.items.length,
  });
  revalidatePurchasePaths(purchaseId);

  return { error: null, success: { purchaseId } };
}

export async function updatePurchaseAction(
  purchaseId: string,
  _prevState: PurchaseFormState,
  formData: FormData,
): Promise<PurchaseFormState> {
  const parsed = await parsePurchaseForm(formData);

  if (!parsed.success) {
    return {
      error: "Revise os campos destacados.",
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((issue) => [
          issue.path.join(".") || "items",
          issue.message,
        ]),
      ),
    };
  }

  try {
    await updateMaterialPurchase({
      purchaseId,
      category: parsed.data.category,
      supplierId: parsed.data.supplier_id,
      supplierName: parsed.data.supplier_name,
      items: parsed.data.items.map((item) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
      })),
      receiptPath: null,
    });
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Falha ao atualizar compra.",
    };
  }

  const receiptFile = formData.get("receipt");
  if (receiptFile instanceof File && receiptFile.size > 0) {
    try {
      const path = await uploadPurchaseReceipt(purchaseId, receiptFile);
      await updatePurchaseReceiptPath(purchaseId, path);
    } catch (error) {
      const message =
        error instanceof ReceiptValidationError
          ? error.message
          : "Falha ao anexar o comprovante.";
      revalidatePurchasePaths(purchaseId);
      return {
        error: `Compra atualizada, mas ${message.toLowerCase()}`,
        success: { purchaseId },
      };
    }
  }

  await logAuditEvent("purchase.update", "material_purchases", purchaseId, {
    category: parsed.data.category,
  });
  revalidatePurchasePaths(purchaseId);

  return { error: null, success: { purchaseId } };
}

export async function cancelPurchaseAction(
  purchaseId: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    await cancelMaterialPurchase(purchaseId, user?.id ?? null);
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Falha ao estornar compra.",
    };
  }

  await logAuditEvent("purchase.cancel", "material_purchases", purchaseId);
  revalidatePurchasePaths(purchaseId);
  return { error: null };
}

export interface QuickProductState {
  error: string | null;
  fieldErrors?: Record<string, string>;
  success?: { productId: string; name: string };
}

export async function createQuickProductAction(
  _prevState: QuickProductState,
  formData: FormData,
): Promise<QuickProductState> {
  const name = String(formData.get("name") ?? "");
  const parsed = quickProductSchema.safeParse({
    name,
    slug: formData.get("slug") || slugify(name),
    price: formData.get("price"),
    category_id: formData.get("category_id") || null,
  });

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
    const productId = await createProduct({
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: "",
      category_id: parsed.data.category_id,
      campaign_id: null,
      price: parsed.data.price,
      promotional_price: null,
      promotion_start: null,
      promotion_end: null,
      sku: "",
      stock_quantity: 0,
      featured: false,
      // Nasce inativo de propósito: criado rápido, sem foto/descrição —
      // fica visível pra clientes só quando a admin revisar e ativar pela
      // tela de Produtos (o estoque já entra correto independente disso).
      active: false,
      display_order: 0,
    });

    await logAuditEvent("product.create", "products", productId, {
      name: parsed.data.name,
      source: "purchase_quick_create",
    });
    revalidatePurchasePaths();

    return { error: null, success: { productId, name: parsed.data.name } };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Falha ao criar produto.",
    };
  }
}
