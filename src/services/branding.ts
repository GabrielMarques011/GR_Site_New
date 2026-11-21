import "server-only";

import { randomUUID } from "node:crypto";

import sharp from "sharp";

import { createClient } from "@/lib/supabase/server";

const BUCKET = "products-images";
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;

export class ImageValidationError extends Error {}

/** Upload da logo da loja (reaproveita o bucket products-images, prefixo branding/). */
export async function uploadStoreLogo(
  settingsId: string,
  file: File,
): Promise<string> {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new ImageValidationError(
      "Formato de imagem não permitido. Envie JPG, PNG, WEBP ou GIF.",
    );
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new ImageValidationError("A imagem deve ter no máximo 8MB.");
  }

  const arrayBuffer = await file.arrayBuffer();
  const optimized = await sharp(Buffer.from(arrayBuffer))
    .rotate()
    .resize({
      width: 600,
      height: 600,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 90 })
    .toBuffer();

  const supabase = await createClient();
  const storagePath = `branding/${settingsId}/${randomUUID()}.webp`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, optimized, {
      contentType: "image/webp",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Falha ao enviar logo: ${uploadError.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

  return publicUrl;
}
