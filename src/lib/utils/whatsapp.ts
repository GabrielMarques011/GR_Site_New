import { formatCurrency } from "./currency";

export interface WhatsAppOrderLine {
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface WhatsAppOrderDetails {
  lines: WhatsAppOrderLine[];
  customerName?: string;
  discountPercent?: number;
}

/** Monta o link wa.me já com a mensagem do pedido pronta para enviar. */
export function buildWhatsAppOrderUrl(
  phone: string,
  details: WhatsAppOrderDetails,
): string {
  const digitsOnly = phone.replace(/\D/g, "");
  const message = buildOrderMessage(details);
  return `https://wa.me/${digitsOnly}?text=${encodeURIComponent(message)}`;
}

export function buildOrderMessage({
  lines,
  customerName,
  discountPercent = 0,
}: WhatsAppOrderDetails): string {
  const subtotal = lines.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0,
  );
  const total = subtotal * (1 - discountPercent / 100);

  const itemsText = lines
    .map((line, index) => {
      const lineSubtotal = line.unitPrice * line.quantity;
      return (
        `${index + 1}. ${line.name}\n` +
        `   Qtd: ${line.quantity} x ${formatCurrency(line.unitPrice)} = ${formatCurrency(lineSubtotal)}`
      );
    })
    .join("\n");

  const greeting = customerName
    ? `Olá! Meu nome é ${customerName} e gostaria de fazer um pedido na GR Design:`
    : `Olá! Gostaria de fazer um pedido na GR Design:`;

  const totalsText =
    discountPercent > 0
      ? `Subtotal: ${formatCurrency(subtotal)}\n` +
        `Desconto de primeira compra (${discountPercent}%): -${formatCurrency(subtotal - total)}\n` +
        `Total: ${formatCurrency(total)}`
      : `Total: ${formatCurrency(total)}`;

  return (
    `${greeting}\n\n` +
    `${itemsText}\n\n` +
    `${totalsText}\n\n` +
    `Pode me confirmar a disponibilidade e as formas de pagamento?`
  );
}
