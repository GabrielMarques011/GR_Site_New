import { describe, expect, it } from "vitest";

import { slugify } from "@/lib/utils/slugify";

describe("slugify", () => {
  it("remove acentos e espaços", () => {
    expect(slugify("Caneca Mágica Rosê")).toBe("caneca-magica-rose");
  });

  it("remove caracteres especiais", () => {
    expect(slugify("Topo de Bolo - 15 Anos!")).toBe("topo-de-bolo-15-anos");
  });

  it("colapsa hífens duplicados e remove das pontas", () => {
    expect(slugify("  -- Produto Teste -- ")).toBe("produto-teste");
  });
});
