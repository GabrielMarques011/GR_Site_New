"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";

/**
 * Seleciona uma imagem localmente (categoria ainda não existe) para ser
 * enviada junto com o formulário de criação. O upload de verdade só
 * acontece no servidor, depois que a categoria existe.
 */
export function NewCategoryImagePicker({
  onChange,
}: {
  onChange: (file: File | null) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleSelect(selected: File | null) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(selected);
    setPreviewUrl(selected ? URL.createObjectURL(selected) : null);
    onChange(selected);
  }

  function handleRemove() {
    handleSelect(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  if (previewUrl) {
    return (
      <div className="relative size-24 overflow-hidden rounded-xl border border-ink-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewUrl}
          alt={file?.name ?? ""}
          className="size-full object-cover"
        />
        <button
          type="button"
          onClick={handleRemove}
          className="focus-ring absolute right-1 top-1 flex size-7 items-center justify-center rounded-full bg-ink-900/70 text-white shadow-sm transition-colors hover:bg-danger-600"
          aria-label="Remover imagem"
        >
          <X className="size-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <label className="focus-ring inline-flex cursor-pointer items-center gap-2 rounded-lg border border-ink-300 px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50">
        <ImagePlus className="size-4" />
        Escolher imagem (do computador ou celular)
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(event) => handleSelect(event.target.files?.[0] ?? null)}
        />
      </label>
      <p className="mt-1.5 text-xs text-ink-500">
        Opcional — você também pode adicionar a imagem depois, editando a
        categoria.
      </p>
    </div>
  );
}
