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
const MAX_DIMENSION = 1800;
const WEBP_QUALITY = 82;

export class ImageValidationError extends Error {}

function assertValidImageFile(file: File) {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new ImageValidationError(
      "Formato de imagem não permitido. Envie JPG, PNG, WEBP ou GIF.",
    );
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new ImageValidationError("A imagem deve ter no máximo 8MB.");
  }
  if (file.size === 0) {
    throw new ImageValidationError("Arquivo de imagem vazio.");
  }
}

/** Converte a imagem enviada para WebP, redimensionando para no máximo 1800px. */
async function optimizeToWebp(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  const input = Buffer.from(arrayBuffer);

  // Revalida o conteúdo real do arquivo (não apenas o MIME declarado pelo
  // navegador) deixando o sharp decodificar os bytes — formatos inválidos
  // ou arquivos disfarçados de imagem (ex: executáveis renomeados) falham
  // aqui antes de qualquer upload para o Storage.
  return sharp(input)
    .rotate()
    .resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
}

export interface UploadedProductImage {
  id: string;
  imageUrl: string;
  storagePath: string;
}

export async function uploadProductImage(
  productId: string,
  file: File,
  altText?: string,
): Promise<UploadedProductImage> {
  assertValidImageFile(file);

  let optimized: Buffer;
  try {
    optimized = await optimizeToWebp(file);
  } catch {
    throw new ImageValidationError(
      "Não foi possível processar a imagem enviada.",
    );
  }

  const supabase = await createClient();
  const storagePath = `products/${productId}/${randomUUID()}.webp`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, optimized, {
      contentType: "image/webp",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Falha ao enviar imagem: ${uploadError.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

  const { count } = await supabase
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);

  const { data, error } = await supabase
    .from("product_images")
    .insert({
      product_id: productId,
      storage_path: storagePath,
      image_url: publicUrl,
      alt_text: altText ?? null,
      display_order: count ?? 0,
    })
    .select("id")
    .single();

  if (error) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
    throw new Error(`Falha ao salvar imagem do produto: ${error.message}`);
  }

  return { id: data.id, imageUrl: publicUrl, storagePath };
}

export async function deleteProductImage(imageId: string): Promise<void> {
  const supabase = await createClient();

  const { data: image, error: fetchError } = await supabase
    .from("product_images")
    .select("storage_path")
    .eq("id", imageId)
    .maybeSingle();

  if (fetchError) {
    throw new Error(`Falha ao localizar imagem: ${fetchError.message}`);
  }

  if (!image) return;

  const { error: deleteRowError } = await supabase
    .from("product_images")
    .delete()
    .eq("id", imageId);

  if (deleteRowError) {
    throw new Error(`Falha ao excluir imagem: ${deleteRowError.message}`);
  }

  await supabase.storage.from(BUCKET).remove([image.storage_path]);
}

export async function reorderProductImages(
  productId: string,
  orderedImageIds: string[],
): Promise<void> {
  const supabase = await createClient();

  await Promise.all(
    orderedImageIds.map((id, index) =>
      supabase
        .from("product_images")
        .update({ display_order: index })
        .eq("id", id)
        .eq("product_id", productId),
    ),
  );
}

/** Remove todas as imagens (storage + linhas) de um produto — usado antes de excluí-lo. */
export async function deleteAllProductImages(productId: string): Promise<void> {
  const supabase = await createClient();

  const { data: images } = await supabase
    .from("product_images")
    .select("id, storage_path")
    .eq("product_id", productId);

  if (!images || images.length === 0) return;

  await supabase.storage
    .from(BUCKET)
    .remove(images.map((image) => image.storage_path));
  await supabase.from("product_images").delete().eq("product_id", productId);
}
