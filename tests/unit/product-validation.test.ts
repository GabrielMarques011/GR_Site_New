import { describe, expect, it } from "vitest";

import { productFormSchema } from "@/lib/validations/product";

const BASE_INPUT = {
  name: "Caneca Personalizada",
  slug: "caneca-personalizada",
  description: "",
  category_id: null,
  price: 50,
  promotional_price: null,
  promotion_start: null,
  promotion_end: null,
  sku: "",
  stock_quantity: null,
  featured: false,
  active: true,
  display_order: 0,
};

describe("productFormSchema", () => {
  it("aceita um produto válido sem promoção", () => {
    const result = productFormSchema.safeParse(BASE_INPUT);
    expect(result.success).toBe(true);
  });

  it("rejeita preço promocional maior ou igual ao preço normal", () => {
    const result = productFormSchema.safeParse({
      ...BASE_INPUT,
      promotional_price: 60,
    });

    expect(result.success).toBe(false);
  });

  it("rejeita slug com letras maiúsculas ou espaços", () => {
    const result = productFormSchema.safeParse({
      ...BASE_INPUT,
      slug: "Caneca Rosa",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita data de término de promoção anterior à de início", () => {
    const result = productFormSchema.safeParse({
      ...BASE_INPUT,
      promotional_price: 40,
      promotion_start: "2026-06-10T00:00",
      promotion_end: "2026-06-01T00:00",
    });

    expect(result.success).toBe(false);
  });

  it("aceita preço promocional e estoque vazios (string) sem exigir valor", () => {
    // Regressão: <input type="number"> vazio manda "" para o form, e
    // z.coerce.number() transforma "" em 0, que falhava em .positive().
    const result = productFormSchema.safeParse({
      ...BASE_INPUT,
      promotional_price: "",
      stock_quantity: "",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.promotional_price).toBeNull();
      expect(result.data.stock_quantity).toBeNull();
    }
  });
});
