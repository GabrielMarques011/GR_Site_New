import { describe, expect, it } from "vitest";

import { formatCurrency } from "@/lib/utils/currency";
import { buildOrderMessage, buildWhatsAppOrderUrl } from "@/lib/utils/whatsapp";

describe("buildOrderMessage", () => {
  it("lista itens com quantidade, preço unitário e subtotal", () => {
    const message = buildOrderMessage({
      lines: [
        { name: "Caneca personalizada", quantity: 2, unitPrice: 35 },
        { name: "Topo de bolo", quantity: 1, unitPrice: 20 },
      ],
    });

    expect(message).toContain("Caneca personalizada");
    expect(message).toContain("Qtd: 2 x");
    expect(message).toContain(`Total: ${formatCurrency(90)}`);
  });

  it("inclui o nome do cliente quando informado", () => {
    const message = buildOrderMessage({
      lines: [{ name: "Caneca", quantity: 1, unitPrice: 10 }],
      customerName: "Rebeca",
    });

    expect(message).toContain("Meu nome é Rebeca");
  });

  it("aplica o desconto de primeira compra no total", () => {
    const message = buildOrderMessage({
      lines: [{ name: "Caneca", quantity: 1, unitPrice: 100 }],
      discountPercent: 5,
    });

    expect(message).toContain(`Subtotal: ${formatCurrency(100)}`);
    expect(message).toContain(
      `Desconto de primeira compra (5%): -${formatCurrency(5)}`,
    );
    expect(message).toContain(`Total: ${formatCurrency(95)}`);
  });
});

describe("buildWhatsAppOrderUrl", () => {
  it("monta a URL wa.me apenas com dígitos do telefone", () => {
    const url = buildWhatsAppOrderUrl("+55 (11) 91933-5496", {
      lines: [{ name: "Caneca", quantity: 1, unitPrice: 10 }],
    });

    expect(url.startsWith("https://wa.me/5511919335496?text=")).toBe(true);
  });
});
