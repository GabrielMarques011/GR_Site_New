import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { StoreSettingsFormValues } from "@/lib/validations/settings";
import type { PublicStoreSettings, StoreSettingsRow } from "@/types/domain";

const PUBLIC_FIELDS =
  "store_name, slogan, about_text, whatsapp, instagram_url, address, maps_url, logo_url";

const FALLBACK_SETTINGS: PublicStoreSettings = {
  store_name: "GR Design",
  slogan: "Sua ideia, nosso carinho em cada detalhe.",
  about_text:
    "A GR Design nasceu em 2023 com o propósito de transformar ideias em produtos " +
    "personalizados, criativos e únicos.",
  whatsapp: "5511919335496",
  instagram_url: "https://www.instagram.com/designers_gr",
  address: "Rua Mirante da Barra, 82 - Parque Mirante da Barra, Cotia - SP",
  maps_url: null,
  logo_url: null,
};

export async function getPublicStoreSettings(): Promise<PublicStoreSettings> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("store_settings")
    .select(PUBLIC_FIELDS)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Falha ao carregar configurações da loja: ${error.message}`,
    );
  }

  return data ?? FALLBACK_SETTINGS;
}

export async function getStoreSettingsRow(): Promise<StoreSettingsRow | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("store_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Falha ao carregar configurações (admin): ${error.message}`,
    );
  }

  return data;
}

export async function updateStoreSettings(
  id: string,
  values: StoreSettingsFormValues,
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("store_settings")
    .update({
      store_name: values.store_name,
      slogan: values.slogan || null,
      about_text: values.about_text || null,
      whatsapp: values.whatsapp || null,
      instagram_url: values.instagram_url || null,
      address: values.address || null,
      maps_url: values.maps_url || null,
      logo_url: values.logo_url || null,
    })
    .eq("id", id);

  if (error) {
    throw new Error(`Falha ao atualizar configurações: ${error.message}`);
  }
}
