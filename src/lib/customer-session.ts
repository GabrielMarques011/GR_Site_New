import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "gr_customer_session";
const SESSION_DAYS = 30;

/** Token aleatório (256 bits) — só ele fica no cookie, nunca no banco. */
export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Só o hash do token é persistido no banco. */
export function hashSecret(secret: string): string {
  return createHash("sha256").update(secret).digest("hex");
}

export function sessionExpiryDate(): Date {
  return new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
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
