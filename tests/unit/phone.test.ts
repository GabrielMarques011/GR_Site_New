import { describe, expect, it } from "vitest";

import {
  formatPhoneDisplay,
  maskBrazilianPhone,
  normalizePhoneE164,
} from "@/lib/utils/phone";

describe("normalizePhoneE164", () => {
  it("adiciona o DDI 55 quando o número não o inclui", () => {
    expect(normalizePhoneE164("11919335496")).toBe("+5511919335496");
  });

  it("aceita o número já com o DDI 55", () => {
    expect(normalizePhoneE164("5511919335496")).toBe("+5511919335496");
  });

  it("aceita o número formatado com máscara", () => {
    expect(normalizePhoneE164("(11) 91933-5496")).toBe("+5511919335496");
  });

  it("devolve null para quantidade de dígitos inválida", () => {
    expect(normalizePhoneE164("123")).toBeNull();
    expect(normalizePhoneE164("119193354961234")).toBeNull();
  });
});

describe("maskBrazilianPhone", () => {
  it("formata progressivamente enquanto o usuário digita", () => {
    expect(maskBrazilianPhone("11")).toBe("(11");
    expect(maskBrazilianPhone("1191933")).toBe("(11) 9193");
    expect(maskBrazilianPhone("11919335496")).toBe("(11) 91933-5496");
  });
});

describe("formatPhoneDisplay", () => {
  it("mostra um telefone em E.164 já mascarado, sem o DDI", () => {
    expect(formatPhoneDisplay("+5511919335496")).toBe("(11) 91933-5496");
  });
});
