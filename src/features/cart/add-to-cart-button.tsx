"use client";

import { useState } from "react";
import { Check, Minus, Plus, ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useCart } from "./cart-context";

export function AddToCartButton({
  productId,
  name,
  slug,
  unitPrice,
  imageUrl,
  maxQuantity,
}: {
  productId: string;
  name: string;
  slug: string;
  unitPrice: number;
  imageUrl: string | null;
  maxQuantity?: number | null;
}) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const limit = maxQuantity && maxQuantity > 0 ? maxQuantity : 99;
  const disabled = maxQuantity != null && maxQuantity <= 0;

  function handleAdd() {
    addItem({ productId, name, slug, unitPrice, imageUrl }, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
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
  );
}
