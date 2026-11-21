import { describe, expect, it } from "vitest";

import { computeProductPricing } from "@/features/promotions/pricing";

const NOW = new Date("2026-06-15T12:00:00.000Z");

describe("computeProductPricing", () => {
  it("retorna o preço normal quando não há preço promocional", () => {
    const result = computeProductPricing(
      {
        price: 50,
        promotional_price: null,
        promotion_start: null,
        promotion_end: null,
      },
      NOW,
    );

    expect(result).toEqual({
      basePrice: 50,
      finalPrice: 50,
      isPromotionActive: false,
    });
  });

  it("ativa a promoção sem datas definidas", () => {
    const result = computeProductPricing(
      {
        price: 100,
        promotional_price: 80,
        promotion_start: null,
        promotion_end: null,
      },
      NOW,
    );

    expect(result.isPromotionActive).toBe(true);
    expect(result.finalPrice).toBe(80);
  });

  it("ignora promoção que ainda não começou", () => {
    const result = computeProductPricing(
      {
        price: 100,
        promotional_price: 80,
        promotion_start: "2026-07-01T00:00:00.000Z",
        promotion_end: null,
      },
      NOW,
    );

    expect(result.isPromotionActive).toBe(false);
    expect(result.finalPrice).toBe(100);
  });

  it("ignora promoção já encerrada", () => {
    const result = computeProductPricing(
      {
        price: 100,
        promotional_price: 80,
        promotion_start: null,
        promotion_end: "2026-01-01T00:00:00.000Z",
      },
      NOW,
    );

    expect(result.isPromotionActive).toBe(false);
    expect(result.finalPrice).toBe(100);
  });

  it("ativa promoção dentro da janela de datas", () => {
    const result = computeProductPricing(
      {
        price: 100,
        promotional_price: 80,
        promotion_start: "2026-06-01T00:00:00.000Z",
        promotion_end: "2026-06-30T00:00:00.000Z",
      },
      NOW,
    );

    expect(result.isPromotionActive).toBe(true);
    expect(result.finalPrice).toBe(80);
  });

  it("ignora preço promocional maior ou igual ao preço normal", () => {
    const result = computeProductPricing(
      {
        price: 50,
        promotional_price: 60,
        promotion_start: null,
        promotion_end: null,
      },
      NOW,
    );

    expect(result.isPromotionActive).toBe(false);
    expect(result.finalPrice).toBe(50);
  });
});
