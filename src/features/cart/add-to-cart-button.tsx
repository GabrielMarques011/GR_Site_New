"use client";

import { useState } from "react";
import { Check, Minus, Plus, ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/cn";
import type { ProductKind, ProductOption } from "@/types/domain";

import { useCart } from "./cart-context";

export function AddToCartButton({
  productId,
  kind,
  name,
  slug,
  unitPrice,
  imageUrl,
  maxQuantity,
  options = [],
}: {
  productId: string;
  kind: ProductKind;
  name: string;
  slug: string;
  unitPrice: number;
  imageUrl: string | null;
  maxQuantity?: number | null;
  options?: ProductOption[];
}) {
  const { addItem } = useCart();
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const selectedOption =
    options.find((option) => option.id === selectedOptionId) ?? null;

  // Preço e tamanho do "pacote" dessa linha: uma opção (kit) tem preço
  // próprio e quantidade fixa — nunca multiplica o preço unitário do
  // produto pela quantidade do kit.
  const lineUnitPrice = selectedOption ? selectedOption.price : unitPrice;
  const packageSize = selectedOption ? selectedOption.quantity : 1;

  const limit = selectedOption
    ? maxQuantity && maxQuantity > 0
      ? Math.max(1, Math.floor(maxQuantity / selectedOption.quantity))
      : 99
    : maxQuantity && maxQuantity > 0
      ? maxQuantity
      : 99;
  const disabled = maxQuantity != null && maxQuantity <= 0;

  function handleSelectOption(optionId: string | null) {
    setSelectedOptionId(optionId);
    setQuantity(1);
  }

  function handleAdd() {
    const displayName = selectedOption
      ? `${name} — ${selectedOption.name}`
      : name;

    addItem(
      {
        productId,
        kind,
        optionId: selectedOption?.id ?? null,
        name: displayName,
        slug,
        unitPrice: lineUnitPrice,
        packageSize,
        imageUrl,
      },
      quantity,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <div className="flex flex-col gap-3">
      {options.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-ink-900">Opção de compra</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleSelectOption(null)}
              className={cn(
                "focus-ring rounded-lg border px-3 py-2 text-left text-sm",
                selectedOptionId === null
                  ? "border-lilac-500 bg-lilac-50 text-lilac-800"
                  : "border-ink-200 text-ink-700 hover:bg-ink-50",
              )}
            >
              <span className="block font-medium">Unidade</span>
              <span className="block text-xs text-ink-500">
                {formatCurrency(unitPrice)}
              </span>
            </button>

            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelectOption(option.id)}
                className={cn(
                  "focus-ring rounded-lg border px-3 py-2 text-left text-sm",
                  selectedOptionId === option.id
                    ? "border-lilac-500 bg-lilac-50 text-lilac-800"
                    : "border-ink-200 text-ink-700 hover:bg-ink-50",
                )}
              >
                <span className="block font-medium">{option.name}</span>
                <span className="block text-xs text-ink-500">
                  {option.quantity} un. · {formatCurrency(option.price)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex w-fit items-center self-center rounded-lg border border-ink-300 sm:self-auto">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="focus-ring flex size-10 items-center justify-center text-ink-700 hover:bg-ink-50"
            aria-label="Diminuir quantidade"
          >
            <Minus className="size-4" />
          </button>
          <span
            className="w-10 text-center text-sm font-medium"
            aria-live="polite"
          >
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(limit, q + 1))}
            className="focus-ring flex size-10 items-center justify-center text-ink-700 hover:bg-ink-50"
            aria-label="Aumentar quantidade"
          >
            <Plus className="size-4" />
          </button>
        </div>

        <Button
          size="lg"
          onClick={handleAdd}
          disabled={disabled}
          className="w-full sm:flex-1"
        >
          {added ? (
            <>
              <Check className="size-4" /> Adicionado
            </>
          ) : (
            <>
              <ShoppingBag className="size-4" />
              {disabled ? "Indisponível" : "Adicionar ao carrinho"}
            </>
          )}
        </Button>
      </div>

      {selectedOption && (
        <p className="text-xs text-ink-500">
          {quantity} pacote(s) de {selectedOption.name} ={" "}
          {quantity * selectedOption.quantity} unidades — total{" "}
          {formatCurrency(quantity * lineUnitPrice)}
        </p>
      )}
    </div>
  );
}
