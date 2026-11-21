"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { isAllowedImageUrl } from "@/lib/utils/image-host";

import { removeStoreLogoAction, uploadStoreLogoAction } from "./actions";

export function LogoUploader({
  settingsId,
  currentLogoUrl,
}: {
  settingsId: string;
  currentLogoUrl: string | null;
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
      const result = await uploadStoreLogoAction(
        settingsId,
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
      await removeStoreLogoAction(settingsId);
      router.refresh();
    });
  }

  const hasValidLogo = isAllowedImageUrl(currentLogoUrl);
  const hasInvalidLogo = Boolean(currentLogoUrl) && !hasValidLogo;

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-ink-100 bg-lilac-50">
        {hasValidLogo && (
          <Image
            src={currentLogoUrl}
            alt="Logo da loja"
            fill
            sizes="96px"
            className="object-contain p-2"
          />
        )}
      </div>

      <div>
        {hasInvalidLogo && (
          <Alert variant="warning" className="mb-2">
            A logo salva não é um link válido do Storage. Envie um arquivo
            abaixo para substituir.
          </Alert>
        )}

        <div className="flex flex-wrap gap-2">
          <label className="focus-ring inline-flex cursor-pointer items-center gap-2 rounded-lg border border-ink-300 px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50">
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ImagePlus className="size-4" />
            )}
            Enviar logo
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleFileChange}
              disabled={pending}
            />
          </label>

          {currentLogoUrl && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={pending}
              className="focus-ring inline-flex items-center gap-2 rounded-lg border border-ink-300 px-3 py-2 text-sm font-medium text-danger-600 hover:bg-danger-100 disabled:opacity-60"
            >
              <Trash2 className="size-4" />
              Remover
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
