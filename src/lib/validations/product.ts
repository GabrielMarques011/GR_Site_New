import { z } from "zod";

/**
 * Campos numéricos opcionais vêm de <input type="number"> como "" quando o
 * usuário deixa em branco. `z.coerce.number()` transforma "" em 0, o que
 * fazia um preço promocional vazio falhar em `.positive()` como se fosse
 * obrigatório. Aqui "" (e null/undefined) viram `null` antes da validação,
 * então o campo fica realmente opcional.
 */
function blankToNull(value: unknown) {
  if (value === "" || value === null || value === undefined) return null;
  return value;
}

const optionalPositiveNumber = z.preprocess(
  blankToNull,
  z.coerce.number().positive().nullable(),
);

const optionalNonNegativeInt = z.preprocess(
  blankToNull,
  z.coerce.number().int().min(0).nullable(),
);

export const productFormSchema = z
  .object({
    name: z.string().trim().min(2, "Informe o nome do produto").max(160),
    slug: z
      .string()
      .trim()
      .min(2, "Informe a URL amigável")
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Use apenas letras minúsculas, números e hífens",
      ),
    description: z.string().trim().max(5000).optional().or(z.literal("")),
    category_id: z.string().uuid("Selecione uma categoria").nullable(),
    price: z.coerce.number().positive("O preço deve ser maior que zero"),
    promotional_price: optionalPositiveNumber,
    promotion_start: z.string().nullable().optional(),
    promotion_end: z.string().nullable().optional(),
    sku: z.string().trim().max(60).optional().or(z.literal("")),
    stock_quantity: optionalNonNegativeInt,
    featured: z.boolean().default(false),
    active: z.boolean().default(true),
    display_order: z.coerce.number().int().min(0).default(0),
  })
  .superRefine((data, ctx) => {
    if (
      data.promotional_price != null &&
      data.promotional_price >= data.price
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["promotional_price"],
        message: "O preço promocional deve ser menor que o preço normal",
      });
    }

    if (data.promotion_start && data.promotion_end) {
      if (new Date(data.promotion_start) > new Date(data.promotion_end)) {
        ctx.addIssue({
          code: "custom",
          path: ["promotion_end"],
          message: "A data de término deve ser posterior à data de início",
        });
      }
    }
  });

export type ProductFormValues = z.infer<typeof productFormSchema>;
