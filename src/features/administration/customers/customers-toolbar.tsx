"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const BENEFIT_OPTIONS = [
  { value: "", label: "Todas as situações" },
  { value: "disponivel", label: "Benefício disponível" },
  { value: "reservado", label: "Benefício reservado" },
  { value: "utilizado", label: "Benefício utilizado" },
  { value: "cancelado", label: "Benefício cancelado" },
];

export function CustomersToolbar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("busca") ?? "");

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("pagina");
    router.push(`/administracao/clientes?${params.toString()}`);
  }

  const birthdayMonthOnly = searchParams.get("aniversario") === "1";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <form
        className="relative flex-1 sm:min-w-[220px]"
        onSubmit={(event) => {
          event.preventDefault();
          updateParam("busca", search);
        }}
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-500" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nome ou telefone..."
          className="pl-9"
        />
      </form>

      <Select
        value={searchParams.get("beneficio") ?? ""}
        onChange={(event) => updateParam("beneficio", event.target.value)}
        className="sm:w-56"
        aria-label="Filtrar por situação do benefício"
      >
        {BENEFIT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>

      <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
        <input
          type="checkbox"
          className="size-4 rounded border-ink-300"
          checked={birthdayMonthOnly}
          onChange={(event) =>
            updateParam("aniversario", event.target.checked ? "1" : "")
          }
        />
        Aniversariantes do mês
      </label>
    </div>
  );
}
