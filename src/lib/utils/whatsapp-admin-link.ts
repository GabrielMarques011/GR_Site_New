/**
 * Monta o link oficial do WhatsApp para o painel abrir uma conversa com o
 * cliente já com a mensagem preenchida — o envio em si continua manual,
 * clicado pela administradora dentro do próprio WhatsApp.
 *
 * Formato exigido (nunca `wa.me` aqui): `api.whatsapp.com/send/?phone=...
 * &text=...&type=phone_number&app_absent=0`. Esse é um padrão diferente do
 * link `wa.me` usado em `lib/utils/whatsapp.ts` para o pedido do carrinho
 * (cliente → loja) — fluxo já existente e testado, que não deve mudar.
 */
export function buildAdminWhatsAppLink(
  phoneE164: string,
  message: string,
): string {
  const digitsOnly = phoneE164.replace(/\D/g, "");
  const encodedMessage = encodeURIComponent(message);

  return (
    `https://api.whatsapp.com/send/?phone=${digitsOnly}` +
    `&text=${encodedMessage}&type=phone_number&app_absent=0`
  );
}
