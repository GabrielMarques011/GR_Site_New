import { formatCurrency } from "./currency";

export interface WhatsAppOrderLine {
  name: string;
  quantity: number;
  unitPrice: number;
}

/** Monta o link wa.me já com a mensagem do pedido pronta para enviar. */
export function buildWhatsAppOrderUrl(
  phone: string,
  lines: WhatsAppOrderLine[],
): string {
  const digitsOnly = phone.replace(/\D/g, "");
  const message = buildOrderMessage(lines);
  return `https://wa.me/${digitsOnly}?text=${encodeURIComponent(message)}`;
}

export function buildOrderMessage(lines: WhatsAppOrderLine[]): string {
  const total = lines.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0,
  );

  const itemsText = lines
    .map((line, index) => {
      const subtotal = line.unitPrice * line.quantity;
      return (
        `${index + 1}. ${line.name}\n` +
        `   Qtd: ${line.quantity} x ${formatCurrency(line.unitPrice)} = ${formatCurrency(subtotal)}`
      );
    })
    .join("\n");

  return (
    `Olá! Gostaria de fazer um pedido na GR Design:\n\n` +
    `${itemsText}\n\n` +
    `Total: ${formatCurrency(total)}\n\n` +
    `Pode me confirmar a disponibilidade e as formas de pagamento?`
  );
}
