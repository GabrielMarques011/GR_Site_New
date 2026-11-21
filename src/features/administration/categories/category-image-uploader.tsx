"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { isAllowedImageUrl } from "@/lib/utils/image-host";

import {
  removeCategoryImageAction,
  uploadCategoryImageAction,
} from "./actions";

export function CategoryImageUploader({
  categoryId,
  currentImageUrl,
}: {
  categoryId: string;
  currentImageUrl: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    const formData = new FormData();
    formData.set("file", file);

    startTransition(async () => {
      const result = await uploadCategoryImageAction(
        categoryId,
        { error: null },
        formData,
      );
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  function handleRemove() {
    setError(null);
    startTransition(async () => {
      await removeCategoryImageAction(categoryId);
      router.refresh();
    });
  }

  const hasValidImage = isAllowedImageUrl(currentImageUrl);
  const hasInvalidImage = Boolean(currentImageUrl) && !hasValidImage;

  return (
    <div className="flex items-center gap-4">
      <div className="relative size-24 shrink-0 overflow-hidden rounded-xl border border-ink-100 bg-lilac-50">
        {hasValidImage && (
          <Image
            src={currentImageUrl}
            alt="Capa da categoria"
            fill
            sizes="96px"
            className="object-cover"
          />
        )}
      </div>

      <div>
        {hasInvalidImage && (
          <Alert variant="warning" className="mb-2">
            A imagem salva não é um link válido do Storage (provavelmente um
            link colado manualmente, como uma URL do Instagram). Envie um
            arquivo abaixo para substituir.
          </Alert>
        )}

        <div className="flex flex-wrap gap-2">
          <label className="focus-ring inline-flex cursor-pointer items-center gap-2 rounded-lg border border-ink-300 px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50">
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ImagePlus className="size-4" />
            )}
            Enviar imagem de capa
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleFileChange}
              disabled={pending}
            />
          </label>

          {currentImageUrl && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={pending}
              className="focus-ring inline-flex items-center gap-2 rounded-lg border border-ink-300 px-3 py-2 text-sm font-medium text-danger-600 hover:bg-danger-100 disabled:opacity-60"
            >
              <Trash2 className="size-4" />
              Remover imagem
            </button>
          )}
        </div>

        {error && (
          <div className="mt-2">
            <Alert variant="danger">{error}</Alert>
          </div>
        )}
      </div>
    </div>
  );
}
