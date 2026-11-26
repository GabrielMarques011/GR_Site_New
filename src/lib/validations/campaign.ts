import { z } from "zod";

export const newCampaignSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do tema").max(80),
});

export type NewCampaignFormValues = z.infer<typeof newCampaignSchema>;
