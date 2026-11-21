"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { storeSettingsFormSchema } from "@/lib/validations/settings";
import { uploadStoreLogo } from "@/services/branding";
import { logAuditEvent } from "@/services/audit";
import { updateStoreSettings } from "@/services/settings";

export interface SettingsFormState {
  error: string | null;
  fieldErrors?: Record<string, string>;
}

export async function updateSettingsAction(
  settingsId: string,
  _prevState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const parsed = storeSettingsFormSchema.safeParse({
    store_name: formData.get("store_name"),
    slogan: formData.get("slogan"),
    about_text: formData.get("about_text"),
    whatsapp: formData.get("whatsapp"),
    instagram_url: formData.get("instagram_url"),
    address: formData.get("address"),
    maps_url: formData.get("maps_url"),
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

  await updateStoreSettings(settingsId, parsed.data);
  await logAuditEvent("settings.update", "store_settings", settingsId);

  revalidatePath("/", "layout");
  return { error: null };
}

export interface LogoUploadState {
  error: string | null;
}

export async function uploadStoreLogoAction(
  settingsId: string,
  _prevState: LogoUploadState,
  formData: FormData,
): Promise<LogoUploadState> {
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return { error: "Selecione um arquivo de imagem." };
  }

  try {
    const logoUrl = await uploadStoreLogo(settingsId, file);
    const supabase = await createClient();
    await supabase
      .from("store_settings")
      .update({ logo_url: logoUrl })
      .eq("id", settingsId);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Falha ao enviar a logo.",
    };
  }

  await logAuditEvent("settings.update", "store_settings", settingsId, {
    logoUpdated: true,
  });
  revalidatePath("/", "layout");
  return { error: null };
}

export async function removeStoreLogoAction(settingsId: string): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("store_settings")
    .update({ logo_url: null })
    .eq("id", settingsId);

  await logAuditEvent("settings.update", "store_settings", settingsId, {
    logoRemoved: true,
  });
  revalidatePath("/", "layout");
}
