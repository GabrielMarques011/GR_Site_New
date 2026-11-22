"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import type { Product } from "@/types/domain";

import { deleteProductImageAction, uploadProductImageAction } from "./actions";

export function ProductImageManager({ product }: { product: Product }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    const formData = new FormData();
    formData.set("file", file);

    startTransition(async () => {
      const result = await uploadProductImageAction(
        product.id,
        { error: null },
        formData,
      );
      if (result.error) {
        setError(result.error);
      }
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  function handleDelete(imageId: string) {
    setDeletingId(imageId);
    startTransition(async () => {
      await deleteProductImageAction(product.id, imageId);
      setDeletingId(null);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <Alert variant="danger">{error}</Alert>}

      <div className="flex flex-wrap gap-3">
        {product.images.map((image) => (
          <div
            key={image.id}
            className="group relative size-28 overflow-hidden rounded-xl border border-ink-100"
          >
            <Image
              src={image.image_url}
              alt={image.alt_text ?? product.name}
              fill
              sizes="112px"
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => handleDelete(image.id)}
              disabled={pending && deletingId === image.id}
              className="focus-ring absolute right-1 top-1 flex size-7 items-center justify-center rounded-full bg-ink-900/70 text-white shadow-sm transition-colors hover:bg-danger-600 disabled:opacity-60"
              aria-label="Excluir imagem"
            >
              {pending && deletingId === image.id ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Trash2 className="size-3.5" />
              )}
            </button>
          </div>
        ))}

        <label className="focus-ring flex size-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-ink-300 text-ink-500 hover:border-lilac-400 hover:text-lilac-600">
          {pending && !deletingId ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <>
              <ImagePlus className="size-5" />
              <span className="text-xs">Adicionar</span>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleFileChange}
            disabled={pending}
          />
        </label>
      </div>

      <p className="text-xs text-ink-500">
        A primeira imagem da lista é usada como capa do produto. JPG, PNG, WEBP
        ou GIF — até 8MB.
      </p>
    </div>
  );
}
