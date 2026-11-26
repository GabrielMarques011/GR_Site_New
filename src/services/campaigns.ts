import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isCampaignCurrentlyActive } from "@/features/campaigns/is-active";
import type { Product, SeasonalCampaign } from "@/types/domain";

import { getPublicProducts } from "./products";

const CAMPAIGN_SELECT =
  "id, slug, name, active, active_until, is_default, display_order, created_at, updated_at";

/**
 * Só os temas em vigor agora (ligados e dentro do prazo) — usada na home.
 * Devolve [] (em vez de lançar) se a tabela ainda não existir: a migration
 * 0003_seasonal_campaigns.sql depende de aprovação manual, e a home (que já
 * funcionava antes dessa funcionalidade) não pode parar de carregar por
 * causa disso.
 */
export async function getActiveCampaigns(): Promise<SeasonalCampaign[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("seasonal_campaigns")
    .select(CAMPAIGN_SELECT)
    .eq("active", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error(
      "Falha ao carregar campanhas sazonais ativas:",
      error.message,
    );
    return [];
  }

  return (data ?? []).filter(isCampaignCurrentlyActive);
}

/**
 * Todos os temas (para o painel administrativo) — também degrada para []
 * em vez de lançar, porque esta função é usada tanto pela tela nova de
 * "Campanhas" quanto pelo formulário de produto já existente (para montar
 * o seletor de tema); o cadastro/edição de produto nunca pode parar de
 * funcionar por causa de uma tabela nova ainda não migrada.
 */
export async function getAdminCampaigns(): Promise<SeasonalCampaign[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("seasonal_campaigns")
    .select(CAMPAIGN_SELECT)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Falha ao carregar campanhas (admin):", error.message);
    return [];
  }

  return data ?? [];
}

export async function createCampaign(values: {
  name: string;
  slug: string;
}): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("seasonal_campaigns")
    .insert({
      name: values.name,
      slug: values.slug,
      active: false,
      is_default: false,
      display_order: 1000,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Falha ao criar campanha: ${error.message}`);
  }

  return data.id;
}

export async function setCampaignStatus(
  id: string,
  active: boolean,
  activeUntil: string | null,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("seasonal_campaigns")
    .update({ active, active_until: activeUntil })
    .eq("id", id);

  if (error) {
    throw new Error(`Falha ao atualizar campanha: ${error.message}`);
  }
}

/**
 * Exclui uma campanha personalizada (nunca um dos 11 temas fixos — só
 * podem ser desativados, nunca excluídos). Produtos vinculados não são
 * excluídos: o campaign_id deles é limpo, igual ao que já acontece ao
 * excluir uma categoria.
 */
export async function deleteCampaign(id: string): Promise<void> {
  const supabase = await createClient();

  const { data: campaign, error: fetchError } = await supabase
    .from("seasonal_campaigns")
    .select("is_default")
    .eq("id", id)
    .single();

  if (fetchError) {
    throw new Error(`Falha ao verificar campanha: ${fetchError.message}`);
  }

  if (campaign.is_default) {
    throw new Error(
      "Os temas padrão não podem ser excluídos, apenas desativados.",
    );
  }

  const { error: unlinkError } = await supabase
    .from("products")
    .update({ campaign_id: null })
    .eq("campaign_id", id);

  if (unlinkError) {
    throw new Error(
      `Falha ao desvincular produtos da campanha: ${unlinkError.message}`,
    );
  }

  const { error } = await supabase
    .from("seasonal_campaigns")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Falha ao excluir campanha: ${error.message}`);
  }
}

export interface CampaignShowcase {
  campaign: SeasonalCampaign;
  products: Product[];
}

/**
 * Monta a(s) seção(ões) em destaque da home: um grupo de produtos para
 * cada tema sazonal em vigor agora. Hoje só retorna "Natal" (único tema
 * ativo por padrão), mas funciona para qualquer tema que a administradora
 * ligar no painel, sem precisar de código novo.
 *
 * Nunca lança: qualquer falha (tabela/coluna ainda não migrada, erro de
 * rede etc.) só remove a seção da home, que é uma página que já funcionava
 * antes desta funcionalidade existir.
 */
export async function getActiveCampaignsShowcase(
  productsPerCampaign = 8,
): Promise<CampaignShowcase[]> {
  try {
    const campaigns = await getActiveCampaigns();
    if (campaigns.length === 0) return [];

    const showcases = await Promise.all(
      campaigns.map(async (campaign) => {
        const { items } = await getPublicProducts({
          campaignSlug: campaign.slug,
          pageSize: productsPerCampaign,
        });
        return { campaign, products: items };
      }),
    );

    return showcases.filter((showcase) => showcase.products.length > 0);
  } catch (error) {
    console.error("Falha ao montar a vitrine de campanhas sazonais:", error);
    return [];
  }
}
