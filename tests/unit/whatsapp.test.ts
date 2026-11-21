import { describe, expect, it } from "vitest";

import { formatCurrency } from "@/lib/utils/currency";
import { buildOrderMessage, buildWhatsAppOrderUrl } from "@/lib/utils/whatsapp";

describe("buildOrderMessage", () => {
  it("lista itens com quantidade, preço unitário e subtotal", () => {
    const message = buildOrderMessage([
      { name: "Caneca personalizada", quantity: 2, unitPrice: 35 },
      { name: "Topo de bolo", quantity: 1, unitPrice: 20 },
    ]);

    expect(message).toContain("Caneca personalizada");
    expect(message).toContain("Qtd: 2 x");
    expect(message).toContain(`Total: ${formatCurrency(90)}`);
  });
});

describe("buildWhatsAppOrderUrl", () => {
  it("monta a URL wa.me apenas com dígitos do telefone", () => {
    const url = buildWhatsAppOrderUrl("+55 (11) 91933-5496", [
      { name: "Caneca", quantity: 1, unitPrice: 10 },
    ]);

    expect(url.startsWith("https://wa.me/5511919335496?text=")).toBe(true);
  });
});
