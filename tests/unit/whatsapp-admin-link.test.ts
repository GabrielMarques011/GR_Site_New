import { describe, expect, it } from "vitest";

import { buildAdminWhatsAppLink } from "@/lib/utils/whatsapp-admin-link";
import { renderWhatsAppTemplate } from "@/lib/utils/whatsapp-templates";

describe("buildAdminWhatsAppLink", () => {
  it("usa o formato api.whatsapp.com/send/ exigido, nunca wa.me", () => {
    const link = buildAdminWhatsAppLink("+5511999999999", "Olá!");

    expect(link.startsWith("https://api.whatsapp.com/send/?phone=")).toBe(
      true,
    );
    expect(link).not.toContain("wa.me");
  });

  it("inclui os parâmetros obrigatórios", () => {
    const link = buildAdminWhatsAppLink("+5511999999999", "Olá!");

    expect(link).toContain("phone=5511999999999");
    expect(link).toContain("type=phone_number");
    expect(link).toContain("app_absent=0");
  });

  it("codifica acentos e emojis na mensagem", () => {
    const link = buildAdminWhatsAppLink(
      "+5511999999999",
      "Feliz aniversário! 🎉💜",
    );

    expect(link).toContain(encodeURIComponent("Feliz aniversário! 🎉💜"));
  });
});

describe("renderWhatsAppTemplate", () => {
  it("substitui {nome} pelo nome do cliente", () => {
    const result = renderWhatsAppTemplate("Olá, {nome}!", {
      nome: "Maria Oliveira",
    });

    expect(result).toBe("Olá, Maria Oliveira!");
  });

  it("substitui todas as variáveis conhecidas", () => {
    const result = renderWhatsAppTemplate(
      "{nome} - {telefone} - {data_nascimento}",
      {
        nome: "Maria",
        telefone: "(11) 91933-5496",
        data_nascimento: "01/01/1990",
      },
    );

    expect(result).toBe("Maria - (11) 91933-5496 - 01/01/1990");
  });
});
