"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Category, Product } from "@/types/domain";

import { ProductsTable } from "./products-table";

const AVAILABILITY_OPTIONS = [
  { value: "", label: "Todas" },
  { value: "em_estoque", label: "Em estoque" },
  { value: "esgotado", label: "Esgotado" },
  { value: "sem_controle", label: "Sem controle de estoque" },
] as const;

/** Busca por nome, categoria e disponibilidade — client-side, mesmo padrão
 * simples já usado no resto do painel (catálogos pequenos o suficiente para
 * não precisar de filtro no servidor). */
export function StoreProductsFilters({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [availability, setAvailability] = useState("");

  const filtered = useMemo(() => {
    return products.filter((product) => {
      if (
        search &&
        !product.name.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      if (categoryId && product.category_id !== categoryId) {
        return false;
      }
      if (availability === "sem_controle" && product.stock_quantity != null) {
        return false;
      }
      if (
        availability === "em_estoque" &&
        !(product.stock_quantity == null || product.stock_quantity > 0)
      ) {
        return false;
      }
      if (
        availability === "esgotado" &&
        !(product.stock_quantity != null && product.stock_quantity <= 0)
      ) {
        return false;
      }
      return true;
    });
  }, [products, search, categoryId, availability]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-500" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome..."
            className="pl-9"
            aria-label="Buscar produtos da loja"
          />
        </div>

        <Select
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          className="sm:w-52"
          aria-label="Filtrar por categoria"
        >
          <option value="">Todas as categorias</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>

        <Select
          value={availability}
          onChange={(event) => setAvailability(event.target.value)}
          className="sm:w-52"
          aria-label="Filtrar por disponibilidade"
        >
          {AVAILABILITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      <p className="text-sm text-ink-500">
        {filtered.length} de {products.length} produto(s)
      </p>

      <ProductsTable
        products={filtered}
        basePath="/administracao/produtos-loja"
      />
    </div>
  );
}
