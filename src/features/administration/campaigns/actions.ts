"use server";

import { revalidatePath } from "next/cache";

import { newCampaignSchema } from "@/lib/validations/campaign";
import { slugify } from "@/lib/utils/slugify";
import { logAuditEvent } from "@/services/audit";
import {
  createCampaign,
  deleteCampaign,
  setCampaignStatus,
} from "@/services/campaigns";

export interface CampaignFormState {
  error: string | null;
  fieldErrors?: Record<string, string>;
}

function revalidateCampaignPaths() {
  revalidatePath("/administracao/campanhas");
  revalidatePath("/administracao/produtos");
  revalidatePath("/");
  revalidatePath("/produtos");
}

export async function createCampaignAction(
  _prevState: CampaignFormState,
  formData: FormData,
): Promise<CampaignFormState> {
  const parsed = newCampaignSchema.safeParse({ name: formData.get("name") });

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
    const slug = slugify(parsed.data.name);
    const id = await createCampaign({ name: parsed.data.name, slug });
    await logAuditEvent("campaign.create", "seasonal_campaigns", id, {
      name: parsed.data.name,
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Falha ao criar tema.",
    };
  }

  revalidateCampaignPaths();
  return { error: null };
}

export async function toggleCampaignAction(
  id: string,
  active: boolean,
  activeUntil: string | null,
): Promise<{ error: string | null }> {
  try {
    await setCampaignStatus(id, active, activeUntil);
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Falha ao atualizar tema.",
    };
  }

  await logAuditEvent(
    active ? "campaign.activate" : "campaign.deactivate",
    "seasonal_campaigns",
    id,
    { activeUntil },
  );
  revalidateCampaignPaths();
  return { error: null };
}

export async function deleteCampaignAction(
  id: string,
): Promise<{ error: string | null }> {
  try {
    await deleteCampaign(id);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Falha ao excluir tema.",
    };
  }

  await logAuditEvent("campaign.delete", "seasonal_campaigns", id);
  revalidateCampaignPaths();
  return { error: null };
}
