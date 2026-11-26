import { z } from "zod";

import { normalizePhoneE164 } from "@/lib/utils/phone";

/** Versão do texto de autorização de mensagens — mude ao alterar o texto. */
export const CONSENT_VERSION = "2026-11-v1";

const BRAZILIAN_STATES = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
] as const;

const phoneField = z
  .string()
  .trim()
  .refine(
    (value) => normalizePhoneE164(value) !== null,
    "Informe um WhatsApp válido, com DDD",
  );

export const customerRegistrationSchema = z.object({
  full_name: z.string().trim().min(3, "Informe seu nome completo").max(160),
  phone: phoneField,
  birth_date: z
    .string()
    .refine(
      (value) => !Number.isNaN(Date.parse(value)),
      "Informe uma data de nascimento válida",
    )
    .refine(
      (value) => new Date(value) <= new Date(),
      "A data de nascimento não pode ser no futuro",
    ),
  zip_code: z
    .string()
    .trim()
    .regex(/^\d{5}-?\d{3}$/, "Informe um CEP válido"),
  street: z.string().trim().min(2, "Informe a rua").max(160),
  number: z.string().trim().min(1, "Informe o número").max(20),
  complement: z.string().trim().max(120).optional().or(z.literal("")),
  neighborhood: z.string().trim().min(2, "Informe o bairro").max(120),
  city: z.string().trim().min(2, "Informe a cidade").max(120),
  state: z.enum(BRAZILIAN_STATES, { message: "Selecione o estado" }),
  whatsapp_marketing_opt_in: z.boolean().default(false),
});

export type CustomerRegistrationValues = z.infer<
  typeof customerRegistrationSchema
>;

export const customerRecoverySchema = z.object({
  phone: phoneField,
  recovery_code: z
    .string()
    .trim()
    .min(10, "Informe o código de recuperação")
    .max(20, "Código inválido"),
});

export type CustomerRecoveryValues = z.infer<typeof customerRecoverySchema>;

export const customerAdminUpdateSchema = z.object({
  full_name: z.string().trim().min(3, "Informe o nome completo").max(160),
  phone: phoneField,
  birth_date: z
    .string()
    .refine(
      (value) => !Number.isNaN(Date.parse(value)),
      "Informe uma data de nascimento válida",
    ),
  zip_code: z
    .string()
    .trim()
    .regex(/^\d{5}-?\d{3}$/, "Informe um CEP válido"),
  street: z.string().trim().min(2, "Informe a rua").max(160),
  number: z.string().trim().min(1, "Informe o número").max(20),
  complement: z.string().trim().max(120).optional().or(z.literal("")),
  neighborhood: z.string().trim().min(2, "Informe o bairro").max(120),
  city: z.string().trim().min(2, "Informe a cidade").max(120),
  state: z.enum(BRAZILIAN_STATES, { message: "Selecione o estado" }),
  whatsapp_marketing_opt_in: z.boolean().default(false),
});

export type CustomerAdminUpdateValues = z.infer<
  typeof customerAdminUpdateSchema
>;
