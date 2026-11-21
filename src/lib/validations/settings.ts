import { z } from "zod";

export const storeSettingsFormSchema = z.object({
  store_name: z.string().trim().min(2).max(120),
  slogan: z.string().trim().max(200).optional().or(z.literal("")),
  about_text: z.string().trim().max(4000).optional().or(z.literal("")),
  whatsapp: z
    .string()
    .trim()
    .regex(/^\+?\d{10,15}$/, "Use o formato internacional, ex: 5511919335496")
    .optional()
    .or(z.literal("")),
  instagram_url: z.string().url().optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  maps_url: z.string().url().optional().or(z.literal("")),
  logo_url: z.string().url().optional().or(z.literal("")),
});

export type StoreSettingsFormValues = z.infer<typeof storeSettingsFormSchema>;

export const loginFormSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;
