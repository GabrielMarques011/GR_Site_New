import "server-only";

import { createHash, randomBytes, randomInt } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "gr_customer_session";
const SESSION_DAYS = 30;
const FLASH_COOKIE_NAME = "gr_registration_flash";
const FLASH_TTL_SECONDS = 20;

const RECOVERY_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem 0/O/1/I/L

/** Token aleatório (256 bits) — só ele fica no cookie, nunca no banco. */
export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Só o hash do token/código é persistido no banco. */
export function hashSecret(secret: string): string {
  return createHash("sha256").update(secret).digest("hex");
}

export function sessionExpiryDate(): Date {
  return new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
}

/**
 * Código de recuperação legível (sem caracteres ambíguos), mostrado uma
 * única vez ao cliente logo após o cadastro, no formato XXXX-XXXX-XXXX.
 */
export function generateRecoveryCode(): string {
  const raw = Array.from(
    { length: 12 },
    () => RECOVERY_CODE_ALPHABET[randomInt(RECOVERY_CODE_ALPHABET.length)],
  ).join("");
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
}

/** Normaliza antes de hashear, para aceitar o código com ou sem hífens/caixa. */
export function hashRecoveryCode(code: string): string {
  const normalized = code.replace(/[\s-]/g, "").toUpperCase();
  return hashSecret(normalized);
}

export async function setCustomerSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function getCustomerSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value ?? null;
}

export async function clearCustomerSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Guarda nome + código de recuperação por alguns segundos para a tela de
 * cadastro conseguir mostrá-los mesmo se a página recarregar sozinha logo
 * em seguida — o Next.js atualiza automaticamente a rota atual sempre que
 * uma Server Action grava um cookie (aqui, a própria sessão do cliente),
 * o que apagaria o estado local da tela de sucesso antes de a pessoa
 * conseguir copiar o código. Expira sozinho (sem precisar apagar depois —
 * um Server Component não pode alterar cookies, só uma Server Action).
 */
export async function setRegistrationFlashCookie(data: {
  fullName: string;
  recoveryCode: string;
}): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(FLASH_COOKIE_NAME, JSON.stringify(data), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/cadastro",
    maxAge: FLASH_TTL_SECONDS,
  });
}

export async function readRegistrationFlashCookie(): Promise<{
  fullName: string;
  recoveryCode: string;
} | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(FLASH_COOKIE_NAME)?.value;
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
