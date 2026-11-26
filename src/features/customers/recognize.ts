import "server-only";

import { getCustomerSessionToken, hashSecret } from "@/lib/customer-session";
import {
  getCustomerBySessionToken,
  type RecognizedCustomer,
} from "@/services/customers";

/**
 * Reconhece o cliente a partir do cookie de sessão, para uso em Server
 * Components (home, carrinho/checkout). Devolve `null` sem lançar sempre
 * que não houver cookie, a sessão estiver expirada/revogada, ou a migration
 * 0004_customers.sql ainda não tiver sido aplicada.
 */
export async function getRecognizedCustomer(): Promise<RecognizedCustomer | null> {
  const token = await getCustomerSessionToken();
  if (!token) return null;

  return getCustomerBySessionToken(hashSecret(token));
}
