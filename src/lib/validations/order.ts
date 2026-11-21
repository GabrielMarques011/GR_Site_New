import { z } from "zod";

/** Mesmo padrão já usado para o WhatsApp da loja em settings.ts. */
export const checkoutCustomerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe seu nome")
    .max(120, "Nome muito longo"),
  phone: z
    .string()
    .trim()
    .regex(/^\+?\d{10,15}$/, "Informe um número de WhatsApp válido, com DDD"),
});

export type CheckoutCustomerValues = z.infer<typeof checkoutCustomerSchema>;

export const orderStatusValues = [
  "em_andamento",
  "concluido",
  "recusado",
] as const;

export const orderStatusSchema = z.enum(orderStatusValues);
