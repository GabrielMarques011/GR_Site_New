import { PartyPopper } from "lucide-react";

import { RecoveryCodeBox } from "./recovery-code-box";

/**
 * Tela de sucesso do cadastro + código de recuperação. É renderizada tanto
 * pelo formulário (estado local, aparece na hora) quanto pela própria
 * página `/cadastro` (a partir do cookie de flash) — o cadastro grava um
 * cookie de sessão, e o Next.js atualiza a rota atual sozinho sempre que
 * uma Server Action grava um cookie, o que apagaria o estado local do
 * formulário cedo demais para a pessoa copiar o código.
 */
export function RegistrationSuccessCard({
  recoveryCode,
}: {
  recoveryCode: string;
}) {
  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-lilac-200 bg-lilac-50/60 p-6 text-center">
      <PartyPopper className="mx-auto size-10 text-lilac-600" />
      <div>
        <h2 className="font-display text-xl font-semibold text-ink-900">
          Cadastro realizado com sucesso! 💜
        </h2>
        <p className="mt-2 text-ink-700">
          Agora você faz parte da família GR Design! Seus dados ficarão
          disponíveis para facilitar seus próximos pedidos e você ainda poderá
          aproveitar benefícios especiais.
        </p>
      </div>

      <div className="rounded-xl border border-ink-100 bg-white p-4">
        <p className="text-sm font-medium text-ink-900">
          Guarde seu código de recuperação
        </p>
        <p className="mt-1 text-xs text-ink-500">
          Use este código junto com seu WhatsApp para recuperar seu cadastro em
          outro celular ou computador.
        </p>
        <div className="mt-3">
          <RecoveryCodeBox recoveryCode={recoveryCode} />
        </div>
      </div>
    </div>
  );
}
