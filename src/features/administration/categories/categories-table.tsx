"use client";

import Image from "next/image";
import Link from "next/link";
import { useTransition } from "react";
import { ImageOff, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { isAllowedImageUrl } from "@/lib/utils/image-host";
import type { Category } from "@/types/domain";

import { deleteCategoryAction } from "./actions";

export function CategoriesTable({ categories }: { categories: Category[] }) {
  const [pending, startTransition] = useTransition();

  function handleDelete(id: string, name: string) {
    if (
      !window.confirm(
        `Excluir a categoria "${name}"? Produtos vinculados continuarão existindo, mas ficarão sem categoria.`,
      )
    ) {
      return;
    }
    startTransition(() => deleteCategoryAction(id));
  }

  if (categories.length === 0) {
    return (
      <p className="py-10 text-center text-ink-500">
        Nenhuma categoria cadastrada ainda.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-ink-100 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-500">
          <tr>
            <th className="px-4 py-3">Categoria</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <tr
              key={category.id}
              className="border-b border-ink-100 last:border-b-0"
            >
              <td className="flex items-center gap-3 px-4 py-3">
                <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-lilac-50">
                  {isAllowedImageUrl(category.image_url) ? (
                    <Image
                      src={category.image_url}
                      alt={category.name}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-ink-300">
                      <ImageOff className="size-4" />
                    </div>
                  )}
                </div>
                <p className="font-medium text-ink-900">{category.name}</p>
              </td>
              <td className="px-4 py-3">
                <Badge variant={category.active ? "success" : "neutral"}>
                  {category.active ? "Ativa" : "Inativa"}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <Link
                    href={`/administracao/categorias/${category.id}`}
                    className="focus-ring flex size-8 items-center justify-center rounded-lg text-ink-700 hover:bg-ink-50"
                    aria-label="Editar categoria"
                  >
                    <Pencil className="size-4" />
                  </Link>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => handleDelete(category.id, category.name)}
                    className="focus-ring flex size-8 items-center justify-center rounded-lg text-danger-600 hover:bg-danger-100"
                    aria-label="Excluir categoria"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
