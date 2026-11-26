import type { SeasonalCampaign } from "@/types/domain";

/**
 * Um tema sazonal nunca é "ativo" só pelo booleano `active`: ele também
 * precisa estar dentro do prazo (`active_until`). Isso deixa o tema vencer
 * sozinho quando a data passa, sem precisar de nenhum job agendado — mesmo
 * princípio já usado para o preço promocional em `computeProductPricing`.
 */
export function isCampaignCurrentlyActive(
  campaign: Pick<SeasonalCampaign, "active" | "active_until">,
): boolean {
  if (!campaign.active) return false;
  if (!campaign.active_until) return true;
  const todayIso = new Date().toISOString().slice(0, 10);
  return campaign.active_until >= todayIso;
}
