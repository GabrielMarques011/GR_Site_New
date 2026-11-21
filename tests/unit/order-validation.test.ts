import { describe, expect, it } from "vitest";

import {
  checkoutCustomerSchema,
  orderStatusSchema,
} from "@/lib/validations/order";

describe("checkoutCustomerSchema", () => {
  it("aceita nome e telefone válidos", () => {
    const result = checkoutCustomerSchema.safeParse({
      name: "Rebeca",
      phone: "11919335496",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita telefone com letras ou curto demais", () => {
    expect(
      checkoutCustomerSchema.safeParse({ name: "Rebeca", phone: "abc" })
        .success,
    ).toBe(false);
    expect(
      checkoutCustomerSchema.safeParse({ name: "Rebeca", phone: "123" })
        .success,
    ).toBe(false);
  });

  it("rejeita nome vazio", () => {
    const result = checkoutCustomerSchema.safeParse({
      name: "",
      phone: "11919335496",
    });
    expect(result.success).toBe(false);
  });
});

describe("orderStatusSchema", () => {
  it("aceita só os três status conhecidos", () => {
    expect(orderStatusSchema.safeParse("em_andamento").success).toBe(true);
    expect(orderStatusSchema.safeParse("concluido").success).toBe(true);
    expect(orderStatusSchema.safeParse("recusado").success).toBe(true);
    expect(orderStatusSchema.safeParse("cancelado").success).toBe(false);
  });
});
