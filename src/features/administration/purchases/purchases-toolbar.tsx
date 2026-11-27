"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function PurchasesToolbar({
  admins,
}: {
  admins: { userId: string; name: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("busca") ?? "");
  const [category, setCategory] = useState(searchParams.get("categoria") ?? "");

  function updateParams(entries: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(entries)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    router.push(`/administracao/compras?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <form
        className="relative flex-1 sm:min-w-[220px]"
        onSubmit={(event) => {
          event.preventDefault();
          updateParams({ busca: search });
        }}
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-500" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por fornecedor ou categoria..."
          className="pl-9"
        />
      </form>

      <form
        className="sm:min-w-[160px]"
        onSubmit={(event) => {
          event.preventDefault();
          updateParams({ categoria: category });
        }}
      >
        <Input
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          onBlur={() => updateParams({ categoria: category })}
          placeholder="Filtrar categoria..."
        />
      </form>

      {admins.length > 0 && (
        <Select
          value={searchParams.get("admin") ?? ""}
          onChange={(event) => updateParams({ admin: event.target.value })}
          className="sm:w-48"
          aria-label="Filtrar por administradora responsável"
        >
          <option value="">Todas as administradoras</option>
          {admins.map((admin) => (
            <option key={admin.userId} value={admin.userId}>
              {admin.name}
            </option>
          ))}
        </Select>
      )}

      <div className="flex items-center gap-2 text-sm text-ink-600">
        <label className="flex items-center gap-1.5">
          De
          <input
            type="date"
            defaultValue={searchParams.get("de") ?? ""}
            onChange={(event) => updateParams({ de: event.target.value })}
            className="focus-ring rounded-lg border border-ink-200 px-2 py-1.5 text-sm"
          />
        </label>
        <label className="flex items-center gap-1.5">
          Até
          <input
            type="date"
            defaultValue={searchParams.get("ate") ?? ""}
            onChange={(event) => updateParams({ ate: event.target.value })}
            className="focus-ring rounded-lg border border-ink-200 px-2 py-1.5 text-sm"
          />
        </label>
      </div>
    </div>
  );
}
