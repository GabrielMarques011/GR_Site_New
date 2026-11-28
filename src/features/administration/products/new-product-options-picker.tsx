"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils/currency";
import type { ProductOptionValues } from "@/lib/validations/product-option";

/**
 * Mesmo padrão de `NewProductImagesPicker`: guarda as opções localmente
 * (produto ainda não existe) para serem criadas de uma vez só depois que o
 * produto for salvo (ver `createProductAction`).
 */
export function NewProductOptionsPicker({
  onChange,
}: {
  onChange: (options: ProductOptionValues[]) => void;
}) {
  const [staged, setStaged] = useState<ProductOptionValues[]>([]);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");

  function addOption() {
    const parsedQuantity = Number(quantity);
    const parsedPrice = Number(price);
    if (!name.trim() || !parsedQuantity || parsedQuantity <= 0) return;

    const next = [
      ...staged,
      {
        name: name.trim(),
        quantity: parsedQuantity,
        price: Number.isFinite(parsedPrice) ? parsedPrice : 0,
        active: true,
        display_order: staged.length,
      },
    ];
    setStaged(next);
    onChange(next);
    setName("");
    setQuantity("");
    setPrice("");
  }

  function removeAt(index: number) {
    const next = staged.filter((_, i) => i !== index);
    setStaged(next);
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-3">
      {staged.length === 0 && (
        <p className="text-sm text-ink-500">
          Opcional — você também pode adicionar depois, editando o produto.
        </p>
      )}

      {staged.map((option, index) => (
        <div
          key={index}
          className="flex items-center justify-between gap-3 rounded-xl border border-ink-100 p-3 text-sm"
        >
          <span className="font-medium text-ink-900">{option.name}</span>
          <span className="text-ink-500">
            {option.quantity} un. · {formatCurrency(option.price)}
          </span>
          <button
            type="button"
            onClick={() => removeAt(index)}
            className="focus-ring flex size-8 items-center justify-center rounded-lg text-danger-600 hover:bg-danger-100"
            aria-label="Remover opção"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ))}

      <div className="flex flex-wrap items-end gap-2 rounded-xl border border-dashed border-lilac-300 bg-lilac-50/40 p-3">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Kit 5 lacinhos"
          className="min-w-[160px] flex-1"
          aria-label="Nome da opção"
        />
        <Input
          type="number"
          min="1"
          step="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="Qtd."
          className="w-20"
          aria-label="Quantidade fixa"
        />
        <Input
          type="number"
          min="0"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Preço"
          className="w-28"
          aria-label="Preço"
        />
        <Button type="button" size="sm" onClick={addOption}>
          <Plus className="size-3.5" /> Adicionar
        </Button>
      </div>
    </div>
  );
}
