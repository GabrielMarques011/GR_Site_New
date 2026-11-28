import { z } from "zod";

export const productOptionSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da opção").max(120),
  quantity: z.coerce
    .number()
    .int("A quantidade precisa ser um número inteiro")
    .positive("A quantidade precisa ser maior que zero"),
  price: z.coerce.number().nonnegative("O preço não pode ser negativo"),
  active: z.boolean().default(true),
  display_order: z.coerce.number().int().min(0).default(0),
});

export type ProductOptionValues = z.infer<typeof productOptionSchema>;
