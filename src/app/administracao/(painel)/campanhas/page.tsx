import type { Metadata } from "next";

import { CampaignsPanel } from "@/features/administration/campaigns/campaigns-panel";
import { getAdminCampaigns } from "@/services/campaigns";

export const metadata: Metadata = { title: "Campanhas sazonais" };

export default async function AdminCampaignsPage() {
  const campaigns = await getAdminCampaigns();

  return (
    <div>
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-900">
          Campanhas sazonais
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Ative um tema com uma data de validade para destacar seus produtos
          marcados na página inicial. Ele desliga sozinho assim que a data
          passa.
        </p>
      </div>

      <div className="mt-6">
        <CampaignsPanel campaigns={campaigns} />
      </div>
    </div>
  );
}
