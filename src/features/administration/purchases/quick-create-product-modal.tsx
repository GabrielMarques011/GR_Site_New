"use client";

import { useState, useTransition } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { slugify } from "@/lib/utils/slugify";
import type { Category } from "@/types/domain";

import { createQuickProductAction } from "./actions";

export function QuickCreateProductModal({
  open,
  onClose,
  categories,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  onCreated: (product: { productId: string; name: string }) => void;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  function reset() {
    setName("");
    setPrice("");
    setCategoryId("");
    setError(null);
    setFieldErrors({});
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    // O React propaga eventos sintéticos pela árvore de componentes React,
    // não pela árvore do DOM — então mesmo com o Modal renderizado via
    // portal (fora do <form> da compra no DOM), o submit daqui ainda
    // borbulharia até o <form onSubmit> de PurchaseForm (que é ancestral
    // deste modal na árvore React) se não for parado aqui.
    event.stopPropagation();
    setError(null);
    setFieldErrors({});

    const formData = new FormData();
    formData.set("name", name);
    formData.set("slug", slugify(name));
    formData.set("price", price);
    formData.set("category_id", categoryId);

    startTransition(async () => {
      const result = await createQuickProductAction({ error: null }, formData);
      if (result.error) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      if (result.success) {
        onCreated(result.success);
        reset();
      }
    });
  }

  return (
    <Modal open={open} onClose={handleClose} title="Criar produto rápido">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <Alert variant="danger">{error}</Alert>}

        <Field
          label="Nome do produto"
          htmlFor="quick-product-name"
          error={fieldErrors.name}
          required
        >
          <Input
            id="quick-product-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ex: Papel Fotográfico Glossy"
            required
          />
        </Field>

        <Field
          label="Preço de venda"
          htmlFor="quick-product-price"
          error={fieldErrors.price}
          hint="O preço cobrado dos clientes — pode ajustar depois pela tela de Produtos"
          required
        >
          <Input
            id="quick-product-price"
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            placeholder="0,00"
            required
          />
        </Field>

        <Field
          label="Categoria (opcional)"
          htmlFor="quick-product-category"
          error={fieldErrors.category_id}
        >
          <Select
            id="quick-product-category"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
          >
            <option value="">Sem categoria</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </Field>

        <p className="text-xs text-ink-500">
          O produto nasce inativo até você revisar os demais campos (imagens,
          descrição, estoque) na tela de Produtos — a quantidade comprada nesta
          tela já entra no estoque dele.
        </p>

        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={pending}>
            Criar produto
          </Button>
        </div>
      </form>
    </Modal>
  );
}
