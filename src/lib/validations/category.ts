import { z } from "zod";

export const categoryFormSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da categoria").max(120),
  slug: z
    .string()
    .trim()
    .min(2, "Informe a URL amigável")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use apenas letras minúsculas, números e hífens",
    ),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  image_url: z.string().url().nullable().optional(),
  display_order: z.coerce.number().int().min(0).default(0),
  active: z.boolean().default(true),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
