"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Category } from "@/types/domain";

import { QuickCreateProductModal } from "./quick-create-product-modal";

export interface PickerProduct {
  id: string;
  name: string;
  stock_quantity: number | null;
}

/** Lista filtrável simples (sem biblioteca de combobox no projeto) — o
 * catálogo é pequeno o bastante (dezenas de produtos) pra filtrar no
 * cliente sem busca no servidor. */
export function ProductPicker({
  products,
  categories,
  value,
  onSelect,
  onProductCreated,
}: {
  products: PickerProduct[];
  categories: Category[];
  value: { productId: string; productName: string } | null;
  onSelect: (product: { productId: string; productName: string }) => void;
  onProductCreated: (product: PickerProduct) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return products.slice(0, 20);
    return products
      .filter((product) => product.name.toLowerCase().includes(term))
      .slice(0, 20);
  }, [products, query]);

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
          <Input
            value={open ? query : (value?.productName ?? query)}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Buscar produto..."
            className="pl-9"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setCreateOpen(true)}
          aria-label="Criar produto novo"
        >
          <Plus className="size-4" />
        </Button>
      </div>

      {open && (
        <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-ink-100 bg-white py-1 shadow-lg shadow-ink-900/10">
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-sm text-ink-500">
              Nenhum produto encontrado.
            </p>
          ) : (
            filtered.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => {
                  onSelect({
                    productId: product.id,
                    productName: product.name,
                  });
                  setQuery("");
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-lilac-50"
              >
                <span className="text-ink-900">{product.name}</span>
                <span className="shrink-0 text-xs text-ink-500">
                  Estoque: {product.stock_quantity ?? 0}
                </span>
              </button>
            ))
          )}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setCreateOpen(true);
            }}
            className="flex w-full items-center gap-2 border-t border-ink-100 px-3 py-2 text-left text-sm font-medium text-lilac-700 hover:bg-lilac-50"
          >
            <Plus className="size-3.5" /> Criar produto novo
          </button>
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <QuickCreateProductModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        categories={categories}
        onCreated={(created) => {
          onProductCreated({
            id: created.productId,
            name: created.name,
            stock_quantity: 0,
          });
          onSelect({ productId: created.productId, productName: created.name });
          setCreateOpen(false);
        }}
      />
    </div>
  );
}
