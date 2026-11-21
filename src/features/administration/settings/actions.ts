"use server";

import { revalidatePath } from "next/cache";

import { storeSettingsFormSchema } from "@/lib/validations/settings";
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
    logo_url: formData.get("logo_url"),
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
