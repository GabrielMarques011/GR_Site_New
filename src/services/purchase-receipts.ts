import "server-only";

import { randomUUID } from "node:crypto";

import { createClient } from "@/lib/supabase/server";
import {
  RECEIPT_ALLOWED_MIME_TYPES,
  RECEIPT_MAX_SIZE_BYTES,
} from "@/lib/validations/purchase";

const BUCKET = "purchase-receipts";
const SIGNED_URL_TTL_SECONDS = 60 * 10;

const EXTENSION_BY_MIME: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export class ReceiptValidationError extends Error {}

function assertValidReceiptFile(file: File) {
  if (
    !RECEIPT_ALLOWED_MIME_TYPES.includes(
      file.type as (typeof RECEIPT_ALLOWED_MIME_TYPES)[number],
    )
  ) {
    throw new ReceiptValidationError(
      "Formato não permitido. Envie PDF, JPG, PNG ou WEBP.",
    );
  }
  if (file.size > RECEIPT_MAX_SIZE_BYTES) {
    throw new ReceiptValidationError("O arquivo deve ter no máximo 8MB.");
  }
  if (file.size === 0) {
    throw new ReceiptValidationError("Arquivo vazio.");
  }
}

/**
 * Envia o comprovante para o bucket PRIVADO `purchase-receipts` — nunca o
 * `products-images` (público). Só guarda o caminho no storage; a URL para
 * visualizar é sempre assinada e gerada na hora (ver `getReceiptSignedUrl`),
 * nunca uma URL pública direta.
 */
export async function uploadPurchaseReceipt(
  purchaseId: string,
  file: File,
): Promise<string> {
  assertValidReceiptFile(file);

  const supabase = await createClient();
  const extension = EXTENSION_BY_MIME[file.type] ?? "bin";
  const storagePath = `receipts/${purchaseId}/${randomUUID()}.${extension}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, Buffer.from(arrayBuffer), {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    throw new Error(`Falha ao enviar comprovante: ${error.message}`);
  }

  return storagePath;
}

export async function getReceiptSignedUrl(
  storagePath: string,
): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);

  if (error) {
    console.error("Falha ao gerar link do comprovante:", error.message);
    return null;
  }

  return data.signedUrl;
}

export async function deletePurchaseReceipt(
  storagePath: string,
): Promise<void> {
  const supabase = await createClient();
  await supabase.storage.from(BUCKET).remove([storagePath]);
}
