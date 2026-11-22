"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";

interface StagedImage {
  file: File;
  previewUrl: string;
}

/**
 * Seleciona imagens localmente (ainda sem produto criado) para serem
 * enviadas junto com o formulário de criação. O upload de verdade só
 * acontece no servidor, depois que o produto existe.
 */
export function NewProductImagesPicker({
  onChange,
}: {
  onChange: (files: File[]) => void;
}) {
  const [staged, setStaged] = useState<StagedImage[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      for (const image of staged) URL.revokeObjectURL(image.previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    const next = [
      ...staged,
      ...Array.from(files).map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    ];
    setStaged(next);
    onChange(next.map((image) => image.file));
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeAt(index: number) {
    const target = staged[index];
    if (target) URL.revokeObjectURL(target.previewUrl);
    const next = staged.filter((_, i) => i !== index);
    setStaged(next);
    onChange(next.map((image) => image.file));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        {staged.map((image, index) => (
          <div
            key={image.previewUrl}
            className="group relative size-28 overflow-hidden rounded-xl border border-ink-100"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.previewUrl}
              alt={image.file.name}
              className="size-full object-cover"
            />
            <button
              type="button"
              onClick={() => removeAt(index)}
              className="focus-ring absolute right-1 top-1 flex size-7 items-center justify-center rounded-full bg-ink-900/70 text-white shadow-sm transition-colors hover:bg-danger-600"
              aria-label="Remover imagem"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}

        <label className="focus-ring flex size-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-ink-300 text-ink-500 hover:border-lilac-400 hover:text-lilac-600">
          <ImagePlus className="size-5" />
          <span className="text-xs">Adicionar</span>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={(event) => addFiles(event.target.files)}
          />
        </label>
      </div>

      <p className="text-xs text-ink-500">
        A primeira imagem da lista é usada como capa do produto. JPG, PNG, WEBP
        ou GIF — até 8MB cada. Opcional — você também pode adicionar depois,
        editando o produto.
      </p>
    </div>
  );
}
