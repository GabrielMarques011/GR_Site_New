import type { Metadata } from "next";

import { Alert } from "@/components/ui/alert";
import { updateSettingsAction } from "@/features/administration/settings/actions";
import { SettingsForm } from "@/features/administration/settings/settings-form";
import { getStoreSettingsRow } from "@/services/settings";

export const metadata: Metadata = { title: "Configurações" };

export default async function AdminSettingsPage() {
  const settings = await getStoreSettingsRow();

  if (!settings) {
    return (
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-900">
          Configurações
        </h1>
        <div className="mt-6">
          <Alert variant="danger">
            Nenhum registro encontrado em store_settings. Crie a linha inicial
            de configurações diretamente no Supabase antes de editar por aqui.
          </Alert>
        </div>
      </div>
    );
  }

  async function handleSubmit(formData: FormData) {
    "use server";
    return updateSettingsAction(settings!.id, { error: null }, formData);
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink-900">
        Configurações da loja
      </h1>
      <p className="mt-1 text-sm text-ink-500">
        Essas informações aparecem no site público (início, rodapé, contato).
      </p>

      <div className="mt-6 max-w-2xl rounded-2xl border border-ink-100 bg-white p-6">
        <SettingsForm settings={settings} onSubmitAction={handleSubmit} />
      </div>
    </div>
  );
}
