"use client";

import { useState, useTransition } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils/currency";
import type { Product, ProductOption } from "@/types/domain";

import {
  createProductOptionAction,
  deleteProductOptionAction,
  toggleProductOptionActiveAction,
  updateProductOptionAction,
} from "./actions";

interface Draft {
  name: string;
  quantity: string;
  price: string;
  display_order: string;
}

function toDraft(option: ProductOption): Draft {
  return {
    name: option.name,
    quantity: String(option.quantity),
    price: String(option.price),
    display_order: String(option.display_order),
  };
}

const EMPTY_DRAFT: Draft = {
  name: "",
  quantity: "",
  price: "",
  display_order: "0",
};

function OptionRow({
  productId,
  option,
}: {
  productId: string;
  option: ProductOption;
}) {
  const [draft, setDraft] = useState<Draft>(toDraft(option));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function buildFormData() {
    const formData = new FormData();
    formData.set("name", draft.name);
    formData.set("quantity", draft.quantity);
    formData.set("price", draft.price);
    formData.set("display_order", draft.display_order);
    if (option.active) formData.set("active", "on");
    return formData;
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updateProductOptionAction(
        productId,
        option.id,
        { error: null },
        buildFormData(),
      );
      if (result.error) setError(result.error);
    });
  }

  function handleToggleActive() {
    startTransition(() =>
      toggleProductOptionActiveAction(productId, option.id, !option.active),
    );
  }

  function handleDelete() {
    if (!confirm(`Excluir a opção "${option.name}"?`)) return;
    startTransition(() => deleteProductOptionAction(productId, option.id));
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-ink-100 p-3">
      {error && <Alert variant="danger">{error}</Alert>}
      <div className="flex flex-wrap items-end gap-2">
        <Input
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          placeholder="Nome da opção"
          className="min-w-[160px] flex-1"
          aria-label="Nome da opção"
        />
        <Input
          type="number"
          min="1"
          step="1"
          value={draft.quantity}
          onChange={(e) => setDraft({ ...draft, quantity: e.target.value })}
          placeholder="Qtd."
          className="w-20"
          aria-label="Quantidade fixa"
        />
        <Input
          type="number"
          min="0"
          step="0.01"
          value={draft.price}
          onChange={(e) => setDraft({ ...draft, price: e.target.value })}
          placeholder="Preço"
          className="w-28"
          aria-label="Preço da opção"
        />
        <Input
          type="number"
          min="0"
          step="1"
          value={draft.display_order}
          onChange={(e) =>
            setDraft({ ...draft, display_order: e.target.value })
          }
          placeholder="Ordem"
          className="w-20"
          aria-label="Ordem de exibição"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleSave}
          isLoading={pending}
        >
          Salvar
        </Button>
        <Button
          type="button"
          size="sm"
          variant={option.active ? "ghost" : "secondary"}
          onClick={handleToggleActive}
          disabled={pending}
        >
          {option.active ? "Ativa" : "Inativa"}
        </Button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={pending}
          className="focus-ring flex size-9 items-center justify-center rounded-lg text-danger-600 hover:bg-danger-100 disabled:opacity-60"
          aria-label="Excluir opção"
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Trash2 className="size-4" />
          )}
        </button>
      </div>
      <p className="text-xs text-ink-500">
        {draft.quantity || 0} un. por {formatCurrency(Number(draft.price) || 0)}
      </p>
    </div>
  );
}

export function ProductOptionManager({ product }: { product: Product }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleAdd() {
    setError(null);
    const formData = new FormData();
    formData.set("name", draft.name);
    formData.set("quantity", draft.quantity);
    formData.set("price", draft.price);
    formData.set("display_order", draft.display_order || "0");
    formData.set("active", "on");

    startTransition(async () => {
      const result = await createProductOptionAction(
        product.id,
        { error: null },
        formData,
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      setDraft(EMPTY_DRAFT);
      setAdding(false);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {product.options.length === 0 && !adding && (
        <p className="text-sm text-ink-500">
          Nenhuma opção de compra cadastrada — o produto continua vendido
          normalmente por unidade.
        </p>
      )}

      {product.options.map((option) => (
        <OptionRow key={option.id} productId={product.id} option={option} />
      ))}

      {adding ? (
        <div className="flex flex-col gap-2 rounded-xl border border-dashed border-lilac-300 bg-lilac-50/40 p-3">
          {error && <Alert variant="danger">{error}</Alert>}
          <div className="flex flex-wrap items-end gap-2">
            <Input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="Ex: Kit 5 lacinhos"
              className="min-w-[160px] flex-1"
              aria-label="Nome da nova opção"
            />
            <Input
              type="number"
              min="1"
              step="1"
              value={draft.quantity}
              onChange={(e) => setDraft({ ...draft, quantity: e.target.value })}
              placeholder="Qtd."
              className="w-20"
              aria-label="Quantidade fixa da nova opção"
            />
            <Input
              type="number"
              min="0"
              step="0.01"
              value={draft.price}
              onChange={(e) => setDraft({ ...draft, price: e.target.value })}
              placeholder="Preço"
              className="w-28"
              aria-label="Preço da nova opção"
            />
            <Button
              type="button"
              size="sm"
              onClick={handleAdd}
              isLoading={pending}
            >
              Adicionar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setAdding(false);
                setError(null);
                setDraft(EMPTY_DRAFT);
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setAdding(true)}
          className="self-start"
        >
          <Plus className="size-3.5" /> Adicionar opção de compra
        </Button>
      )}
    </div>
  );
}
