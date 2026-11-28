"use client";

import Image from "next/image";
import Link from "next/link";
import { useTransition } from "react";
import { ImageOff, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils/currency";
import { isAllowedImageUrl } from "@/lib/utils/image-host";
import type { Product } from "@/types/domain";

import { deleteProductAction, toggleProductActiveAction } from "./actions";

export function ProductsTable({
  products,
  basePath = "/administracao/produtos",
}: {
  products: Product[];
  basePath?: string;
}) {
  const [pending, startTransition] = useTransition();

  function handleToggle(id: string, active: boolean) {
    startTransition(() => toggleProductActiveAction(id, active));
  }

  function handleDelete(id: string, name: string) {
    if (!window.confirm(`Excluir "${name}"? Esta ação não pode ser desfeita.`))
      return;
    startTransition(() => deleteProductAction(id));
  }

  if (products.length === 0) {
    return (
      <p className="py-10 text-center text-ink-500">
        Nenhum produto cadastrado ainda.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-ink-100 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-500">
          <tr>
            <th className="px-4 py-3">Produto</th>
            <th className="px-4 py-3">Categoria</th>
            <th className="px-4 py-3">Preço</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr
              key={product.id}
              className="border-b border-ink-100 last:border-b-0"
            >
              <td className="flex items-center gap-3 px-4 py-3">
                <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-lilac-50">
                  {isAllowedImageUrl(product.images[0]?.image_url) ? (
                    <Image
                      src={product.images[0].image_url}
                      alt={product.name}
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
                <div>
                  <p className="font-medium text-ink-900">{product.name}</p>
                  {product.featured && (
                    <Badge variant="warning">Destaque</Badge>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-ink-700">
                {product.category?.name ?? "—"}
              </td>
              <td className="px-4 py-3 text-ink-700">
                {formatCurrency(product.price)}
              </td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => handleToggle(product.id, !product.active)}
                  className="focus-ring"
                >
                  <Badge variant={product.active ? "success" : "neutral"}>
                    {product.active ? "Ativo" : "Inativo"}
                  </Badge>
                </button>
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <Link
                    href={`${basePath}/${product.id}`}
                    className="focus-ring flex size-8 items-center justify-center rounded-lg text-ink-700 hover:bg-ink-50"
                    aria-label="Editar produto"
                  >
                    <Pencil className="size-4" />
                  </Link>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => handleDelete(product.id, product.name)}
                    className="focus-ring flex size-8 items-center justify-center rounded-lg text-danger-600 hover:bg-danger-100"
                    aria-label="Excluir produto"
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
