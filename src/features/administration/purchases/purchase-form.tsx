"use client";

import { useState, useTransition } from "react";
import { Paperclip, Plus, Trash2 } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils/currency";
import type { Category, MaterialPurchaseWithItems } from "@/types/domain";

import { createPurchaseAction, updatePurchaseAction } from "./actions";
import { ProductPicker, type PickerProduct } from "./product-picker";
import { SupplierInput } from "./supplier-input";

interface ItemRow {
  key: string;
  productId: string;
  productName: string;
  quantity: string;
  unitPrice: string;
}

/** `key` vem de quem chama (nunca gerado aqui) — a primeira linha nasce
 * junto com o `useState` inicial, que roda tanto no servidor (SSR) quanto
 * no cliente (hidratação); usar `crypto.randomUUID()" ali geraria valores
 * diferentes nos dois lados e quebraria a hidratação. Linhas adicionadas
 * depois (clique em "Adicionar item") só acontecem no navegador, aí sim
 * `crypto.randomUUID()` é seguro. */
function emptyRow(key: string): ItemRow {
  return {
    key,
    productId: "",
    productName: "",
    quantity: "1",
    unitPrice: "",
  };
}

export function PurchaseForm({
  mode,
  purchase,
  products,
  categories,
  suppliers,
  onSaved,
}: {
  mode: "create" | "edit";
  purchase?: MaterialPurchaseWithItems;
  products: PickerProduct[];
  categories: Category[];
  suppliers: { id: string; name: string }[];
  onSaved: (purchaseId: string) => void;
}) {
  const [availableProducts, setAvailableProducts] = useState(products);
  const [category, setCategory] = useState(purchase?.category ?? "");
  const [supplierName, setSupplierName] = useState(
    purchase?.supplier_name_snapshot ?? "",
  );
  const [supplierId, setSupplierId] = useState<string | null>(
    purchase?.supplier_id ?? null,
  );
  const [rows, setRows] = useState<ItemRow[]>(
    purchase && purchase.items.length > 0
      ? purchase.items.map((item) => ({
          key: item.id,
          productId: item.product_id ?? "",
          productName: item.product_name_snapshot,
          quantity: String(item.quantity),
          unitPrice: String(item.unit_price),
        }))
      : [emptyRow("row-0")],
  );
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  const total = rows.reduce((sum, row) => {
    const qty = Number(row.quantity) || 0;
    const price = Number(row.unitPrice) || 0;
    return sum + qty * price;
  }, 0);

  function updateRow(key: string, patch: Partial<ItemRow>) {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  }

  function addRow() {
    setRows((current) => [...current, emptyRow(crypto.randomUUID())]);
  }

  function removeRow(key: string) {
    setRows((current) =>
      current.length > 1 ? current.filter((row) => row.key !== key) : current,
    );
  }

  function handleSupplierSelect(name: string) {
    setSupplierName(name);
    const existing = suppliers.find(
      (s) => s.name.toLowerCase() === name.toLowerCase(),
    );
    setSupplierId(existing?.id ?? null);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!category.trim()) {
      setFieldErrors({ category: "Informe a categoria da compra" });
      return;
    }
    if (!supplierName.trim()) {
      setFieldErrors({ supplier_name: "Informe o fornecedor" });
      return;
    }

    const items = rows
      .filter((row) => row.productId)
      .map((row) => ({
        product_id: row.productId,
        product_name: row.productName,
        quantity: Number(row.quantity),
        unit_price: Number(row.unitPrice),
      }));

    if (items.length === 0) {
      setError("Adicione pelo menos um item com produto selecionado.");
      return;
    }

    const formData = new FormData();
    formData.set("category", category.trim());
    formData.set("supplier_id", supplierId ?? "");
    formData.set("supplier_name", supplierName.trim());
    formData.set("items", JSON.stringify(items));
    if (receiptFile) formData.set("receipt", receiptFile);

    startTransition(async () => {
      const action =
        mode === "create"
          ? createPurchaseAction
          : (
              prevState: Parameters<typeof updatePurchaseAction>[1],
              fd: FormData,
            ) => updatePurchaseAction(purchase!.id, prevState, fd);

      const result = await action({ error: null }, formData);

      if (result.error && !result.success) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      if (result.success) {
        if (result.error) setError(result.error);
        onSaved(result.success.purchaseId);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && <Alert variant="danger">{error}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Categoria da compra"
          htmlFor="purchase-category"
          error={fieldErrors.category}
          hint="Ex: Papelaria, Embalagens, Equipamentos"
          required
        >
          <Input
            id="purchase-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            placeholder="Ex: Papelaria"
          />
        </Field>

        <Field
          label="Fornecedor"
          htmlFor="purchase-supplier"
          error={fieldErrors.supplier_name}
          required
        >
          <SupplierInput
            suppliers={suppliers.map((s) => ({
              id: s.id,
              name: s.name,
              created_at: "",
            }))}
            value={supplierName}
            onChange={handleSupplierSelect}
          />
        </Field>
      </div>

      <div className="border-t border-ink-100 pt-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink-900">Produtos</h3>
          <Button type="button" variant="outline" size="sm" onClick={addRow}>
            <Plus className="size-3.5" /> Adicionar item
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          {rows.map((row) => {
            const qty = Number(row.quantity) || 0;
            const price = Number(row.unitPrice) || 0;
            return (
              <div
                key={row.key}
                className="flex flex-col gap-3 rounded-xl border border-ink-100 p-3 sm:flex-row sm:items-end"
              >
                <div className="sm:flex-1">
                  <Field label="Produto" htmlFor={`product-${row.key}`}>
                    <ProductPicker
                      products={availableProducts}
                      categories={categories}
                      value={
                        row.productId
                          ? {
                              productId: row.productId,
                              productName: row.productName,
                            }
                          : null
                      }
                      onSelect={(selected) =>
                        updateRow(row.key, {
                          productId: selected.productId,
                          productName: selected.productName,
                        })
                      }
                      onProductCreated={(created) =>
                        setAvailableProducts((current) => [created, ...current])
                      }
                    />
                  </Field>
                </div>

                <div className="flex gap-3">
                  <Field
                    label="Qtd."
                    htmlFor={`qty-${row.key}`}
                    className="w-20"
                  >
                    <Input
                      id={`qty-${row.key}`}
                      type="number"
                      min="1"
                      step="1"
                      value={row.quantity}
                      onChange={(event) =>
                        updateRow(row.key, { quantity: event.target.value })
                      }
                      className="w-20"
                    />
                  </Field>

                  <Field
                    label="Valor unit."
                    htmlFor={`price-${row.key}`}
                    className="w-28"
                  >
                    <Input
                      id={`price-${row.key}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.unitPrice}
                      onChange={(event) =>
                        updateRow(row.key, { unitPrice: event.target.value })
                      }
                      className="w-28"
                    />
                  </Field>

                  <div className="flex flex-col items-end justify-end gap-1 pb-2">
                    <span className="text-xs text-ink-500">Subtotal</span>
                    <span className="text-sm font-medium text-ink-900">
                      {formatCurrency(qty * price)}
                    </span>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRow(row.key)}
                    aria-label="Remover item"
                    className="mb-1 self-end"
                  >
                    <Trash2 className="size-4 text-danger-600" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-4 border-t border-ink-100 pt-5 sm:flex-row sm:items-end sm:justify-between">
        <Field
          label="Comprovante (opcional)"
          htmlFor="purchase-receipt"
          hint="PDF, JPG, PNG ou WEBP, até 8MB"
        >
          <label className="flex max-w-xs cursor-pointer items-center gap-2 rounded-lg border border-dashed border-ink-300 px-3 py-2 text-sm text-ink-600 hover:bg-ink-50">
            <Paperclip className="size-4 shrink-0" />
            <span className="truncate">
              {receiptFile ? receiptFile.name : "Escolher arquivo"}
            </span>
            <input
              id="purchase-receipt"
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) =>
                setReceiptFile(event.target.files?.[0] ?? null)
              }
            />
          </label>
        </Field>

        <div className="text-right">
          <p className="text-sm text-ink-500">Total geral da compra</p>
          <p className="font-display text-2xl font-semibold text-ink-900">
            {formatCurrency(total)}
          </p>
        </div>
      </div>

      <Button type="submit" size="lg" isLoading={pending}>
        {mode === "create" ? "Registrar compra" : "Salvar alterações"}
      </Button>
    </form>
  );
}
