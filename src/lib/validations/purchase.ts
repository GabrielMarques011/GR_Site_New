import { z } from "zod";

export const purchaseItemSchema = z.object({
  product_id: z.string().uuid("Selecione um produto"),
  product_name: z.string().trim().min(1),
  quantity: z.coerce
    .number()
    .int("A quantidade precisa ser um número inteiro")
    .positive("A quantidade precisa ser maior que zero"),
  unit_price: z.coerce
    .number()
    .nonnegative("O valor unitário não pode ser negativo"),
});

export type PurchaseItemValues = z.infer<typeof purchaseItemSchema>;

export const materialPurchaseSchema = z.object({
  category: z.string().trim().min(2, "Informe a categoria da compra").max(80),
  supplier_id: z.string().uuid().nullable(),
  supplier_name: z.string().trim().min(2, "Informe o fornecedor").max(160),
  items: z
    .array(purchaseItemSchema)
    .min(1, "Adicione pelo menos um item à compra"),
});

export type MaterialPurchaseValues = z.infer<typeof materialPurchaseSchema>;

/** Cadastro rápido de produto, dentro da tela de compras — só os campos
 * essenciais do `productFormSchema` (nome, slug, preço, categoria). */
export const quickProductSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do produto").max(160),
  slug: z
    .string()
    .trim()
    .min(2, "Informe a URL amigável")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use apenas letras minúsculas, números e hífens",
    ),
  price: z.coerce.number().positive("O preço deve ser maior que zero"),
  category_id: z.string().uuid().nullable(),
});

export type QuickProductValues = z.infer<typeof quickProductSchema>;

export const RECEIPT_ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const RECEIPT_MAX_SIZE_BYTES = 8 * 1024 * 1024;
