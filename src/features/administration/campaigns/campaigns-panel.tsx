"use client";

import { useState, useTransition } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { isCampaignCurrentlyActive } from "@/features/campaigns/is-active";
import type { SeasonalCampaign } from "@/types/domain";

import {
  createCampaignAction,
  deleteCampaignAction,
  toggleCampaignAction,
} from "./actions";

function CampaignRow({ campaign }: { campaign: SeasonalCampaign }) {
  const [activeUntil, setActiveUntil] = useState(campaign.active_until ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const currentlyActive = isCampaignCurrentlyActive(campaign);
  const expired = campaign.active && !currentlyActive;

  function handleToggle() {
    setError(null);
    const nextActive = !campaign.active;

    if (nextActive && !activeUntil) {
      setError("Defina uma data de validade antes de ativar.");
      return;
    }

    startTransition(async () => {
      const result = await toggleCampaignAction(
        campaign.id,
        nextActive,
        activeUntil || null,
      );
      if (result.error) setError(result.error);
    });
  }

  function handleDelete() {
    if (
      !window.confirm(
        `Excluir o tema "${campaign.name}"? Produtos vinculados continuam existindo, só ficam sem tema.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await deleteCampaignAction(campaign.id);
      if (result.error) setError(result.error);
    });
  }

  return (
    <tr className="border-b border-ink-100 last:border-b-0">
      <td className="px-4 py-3">
        <p className="font-medium text-ink-900">{campaign.name}</p>
        {!campaign.is_default && (
          <span className="text-xs text-ink-500">Personalizado</span>
        )}
      </td>
      <td className="px-4 py-3">
        <Badge
          variant={
            currentlyActive ? "success" : expired ? "warning" : "neutral"
          }
        >
          {currentlyActive ? "Ativo" : expired ? "Expirado" : "Inativo"}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <Input
          type="date"
          value={activeUntil}
          onChange={(event) => setActiveUntil(event.target.value)}
          className="w-40"
        />
        {error && <p className="mt-1 text-xs text-danger-600">{error}</p>}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            size="sm"
            variant={campaign.active ? "outline" : "primary"}
            onClick={handleToggle}
            disabled={pending}
          >
            {pending && <Loader2 className="size-3.5 animate-spin" />}
            {campaign.active ? "Desativar" : "Ativar"}
          </Button>
          {!campaign.is_default && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={pending}
              className="focus-ring flex size-8 items-center justify-center rounded-lg text-danger-600 hover:bg-danger-100"
              aria-label="Excluir tema"
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export function CampaignsPanel({
  campaigns,
}: {
  campaigns: SeasonalCampaign[];
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.set("name", name);

    startTransition(async () => {
      const result = await createCampaignAction({ error: null }, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setName("");
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {campaigns.length === 0 ? (
        <Alert variant="warning">
          Nenhum tema encontrado. Se você já aplicou a migration
          0003_seasonal_campaigns.sql no Supabase, recarregue a página.
        </Alert>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ink-100 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-3">Tema</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Válido até</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <CampaignRow key={campaign.id} campaign={campaign} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <form
        onSubmit={handleAdd}
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-dashed border-ink-300 p-4"
      >
        <div className="min-w-[200px] flex-1">
          <Field label="Novo tema personalizado" htmlFor="new-campaign-name">
            <Input
              id="new-campaign-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex: Black Friday"
            />
          </Field>
        </div>
        <Button type="submit" isLoading={pending}>
          <Plus className="size-4" /> Adicionar
        </Button>
      </form>

      {error && <Alert variant="danger">{error}</Alert>}
    </div>
  );
}
