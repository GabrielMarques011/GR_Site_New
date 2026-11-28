"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ImageOff, Minus, Plus, Trash2 } from "lucide-react";

import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils/currency";
import type { CartItem } from "@/types/domain";

import { useCart } from "./cart-context";

export function CartItemRow({ item }: { item: CartItem }) {
  const { updateQuantity, updateNote, removeItem } = useCart();
  const [showNote, setShowNote] = useState(Boolean(item.note));

  return (
    <div className="flex items-center gap-4 border-b border-ink-100 py-4 last:border-b-0">
      <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-lilac-50">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-300">
            <ImageOff className="size-6" />
          </div>
        )}
      </div>

      <div className="flex-1">
        <Link
          href={`/produtos/${item.slug}`}
          className="font-medium text-ink-900 hover:text-lilac-700"
        >
          {item.name}
        </Link>
        {item.packageSize > 1 ? (
          <p className="mt-1 text-sm text-ink-500">
            {formatCurrency(item.unitPrice)} / pacote · {item.packageSize} un.
            cada · {item.quantity * item.packageSize} un. no total
          </p>
        ) : (
          <p className="mt-1 text-sm text-ink-500">
            {formatCurrency(item.unitPrice)} / unidade
          </p>
        )}

        <div className="mt-2 flex items-center gap-3">
          <div className="flex items-center rounded-lg border border-ink-300">
            <button
              type="button"
              onClick={() =>
                updateQuantity(item.productId, item.optionId, item.quantity - 1)
              }
              className="focus-ring flex size-8 items-center justify-center text-ink-700 hover:bg-ink-50"
              aria-label="Diminuir quantidade"
            >
              <Minus className="size-3.5" />
            </button>
            <span className="w-8 text-center text-sm font-medium">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() =>
                updateQuantity(item.productId, item.optionId, item.quantity + 1)
              }
              className="focus-ring flex size-8 items-center justify-center text-ink-700 hover:bg-ink-50"
              aria-label="Aumentar quantidade"
            >
              <Plus className="size-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => removeItem(item.productId, item.optionId)}
            className="focus-ring flex items-center gap-1 text-sm text-danger-600 hover:underline"
          >
            <Trash2 className="size-3.5" /> Remover
          </button>
        </div>

        <div className="mt-2">
          {showNote ? (
            <Textarea
              value={item.note ?? ""}
              onChange={(event) =>
                updateNote(item.productId, item.optionId, event.target.value)
              }
              placeholder="Ex: Gostaria desta caneca com a arte do Stitch e fundo azul"
              rows={2}
              className="text-sm"
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowNote(true)}
              className="focus-ring text-sm font-medium text-lilac-700 hover:underline"
            >
              + Adicionar observação (opcional)
            </button>
          )}
        </div>
      </div>

      <div className="font-display font-semibold text-ink-900">
        {formatCurrency(item.unitPrice * item.quantity)}
      </div>
    </div>
  );
}
