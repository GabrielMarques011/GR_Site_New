"use client";

import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import type { Supplier } from "@/types/domain";

/** Texto livre com sugestões dos fornecedores já cadastrados — sem modal de
 * cadastro separado: digitar um nome novo já cria o fornecedor ao salvar a
 * compra (ver `resolveOrCreateSupplier`), evitando duplicar o mesmo passo
 * de "buscar ou criar" que o produto já tem. */
export function SupplierInput({
  suppliers,
  value,
  onChange,
}: {
  suppliers: Supplier[];
  value: string;
  onChange: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const suggestions = useMemo(() => {
    const term = value.trim().toLowerCase();
    if (!term) return suppliers.slice(0, 8);
    return suppliers
      .filter((supplier) => supplier.name.toLowerCase().includes(term))
      .slice(0, 8);
  }, [suppliers, value]);

  const isNewSupplier =
    value.trim().length > 0 &&
    !suppliers.some(
      (supplier) => supplier.name.toLowerCase() === value.trim().toLowerCase(),
    );

  return (
    <div className="relative">
      <Input
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Nome do fornecedor"
      />

      {open && suggestions.length > 0 && (
        <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-ink-100 bg-white py-1 shadow-lg shadow-ink-900/10">
          {suggestions.map((supplier) => (
            <button
              key={supplier.id}
              type="button"
              onClick={() => {
                onChange(supplier.name);
                setOpen(false);
              }}
              className="block w-full px-3 py-2 text-left text-sm text-ink-900 hover:bg-lilac-50"
            >
              {supplier.name}
            </button>
          ))}
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {isNewSupplier && (
        <p className="mt-1 text-xs text-ink-500">
          Fornecedor novo — vai ser cadastrado automaticamente ao salvar.
        </p>
      )}
    </div>
  );
}
