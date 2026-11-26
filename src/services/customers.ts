import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { CustomerAdminUpdateValues } from "@/lib/validations/customer";
import type {
  Customer,
  CustomerBenefitStatus,
  CustomerWithBirthday,
} from "@/types/domain";

const CUSTOMER_FIELDS =
  "id, full_name, phone, phone_normalized, birth_date, zip_code, street, " +
  "number, complement, neighborhood, city, state, whatsapp_marketing_opt_in, " +
  "consent_date, consent_version, first_purchase_discount_used, " +
  "first_purchase_discount_used_at, created_at, updated_at";

// ---------------------------------------------------------------------------
// Cadastro público / reconhecimento (via funções SECURITY DEFINER — nunca
// acesso direto à tabela `customers`, que não tem SELECT/INSERT público)
// ---------------------------------------------------------------------------

export interface RegisterCustomerInput {
  fullName: string;
  phone: string;
  phoneNormalized: string;
  birthDate: string;
  zipCode: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  whatsappOptIn: boolean;
  consentVersion: string | null;
  sessionTokenHash: string;
  sessionExpiresAt: string;
  recoveryCodeHash: string;
}

export async function registerCustomer(
  input: RegisterCustomerInput,
): Promise<{ customerId: string; fullName: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("register_customer", {
    p_full_name: input.fullName,
    p_phone: input.phone,
    p_phone_normalized: input.phoneNormalized,
    p_birth_date: input.birthDate,
    p_zip_code: input.zipCode,
    p_street: input.street,
    p_number: input.number,
    p_complement: input.complement,
    p_neighborhood: input.neighborhood,
    p_city: input.city,
    p_state: input.state,
    p_whatsapp_opt_in: input.whatsappOptIn,
    p_consent_version: input.consentVersion,
    p_session_token_hash: input.sessionTokenHash,
    p_session_expires_at: input.sessionExpiresAt,
    p_recovery_code_hash: input.recoveryCodeHash,
  });

  if (error) {
    if (
      error.code === "23505" ||
      /já existe um cadastro/i.test(error.message)
    ) {
      throw new Error("Já existe um cadastro com este telefone.");
    }
    throw new Error(`Falha ao concluir o cadastro: ${error.message}`);
  }

  const row = data?.[0];
  if (!row) {
    throw new Error("Falha ao concluir o cadastro.");
  }

  return { customerId: row.customer_id, fullName: row.full_name };
}

export interface RecognizedCustomer {
  customerId: string;
  fullName: string;
  phone: string;
  birthDate: string;
  zipCode: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  whatsappMarketingOptIn: boolean;
  benefitStatus: CustomerBenefitStatus | "indisponivel";
  benefitDiscountPercentage: number | null;
}

/**
 * Reconhece o cliente a partir do hash do token de sessão (cookie). Devolve
 * `null` em qualquer falha — sessão inexistente/expirada/revogada, ou a
 * migration 0004_customers.sql ainda não aplicada — nunca lança, porque
 * toda página pública que usa isso continua funcionando sem reconhecimento.
 */
export async function getCustomerBySessionToken(
  tokenHash: string,
): Promise<RecognizedCustomer | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_customer_session", {
    p_token_hash: tokenHash,
  });

  if (error) {
    console.error("Falha ao reconhecer sessão de cliente:", error.message);
    return null;
  }

  const row = data?.[0];
  if (!row) return null;

  return {
    customerId: row.customer_id,
    fullName: row.full_name,
    phone: row.phone,
    birthDate: row.birth_date,
    zipCode: row.zip_code,
    street: row.street,
    number: row.number,
    complement: row.complement,
    neighborhood: row.neighborhood,
    city: row.city,
    state: row.state,
    whatsappMarketingOptIn: row.whatsapp_marketing_opt_in,
    benefitStatus: row.benefit_status as CustomerBenefitStatus | "indisponivel",
    benefitDiscountPercentage: row.benefit_discount_percentage,
  };
}

export async function recoverCustomerSession(input: {
  phoneNormalized: string;
  codeHash: string;
  sessionTokenHash: string;
  sessionExpiresAt: string;
}): Promise<{ customerId: string; fullName: string } | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("recover_customer_session", {
    p_phone_normalized: input.phoneNormalized,
    p_code_hash: input.codeHash,
    p_session_token_hash: input.sessionTokenHash,
    p_session_expires_at: input.sessionExpiresAt,
  });

  if (error) {
    throw new Error(error.message || "Falha ao recuperar cadastro.");
  }

  const row = data?.[0];
  return row ? { customerId: row.customer_id, fullName: row.full_name } : null;
}

export async function revokeCustomerSession(tokenHash: string): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc("revoke_customer_session", { p_token_hash: tokenHash });
}

export async function rotateRecoveryCode(
  tokenHash: string,
  newCodeHash: string,
): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("rotate_recovery_code", {
    p_session_token_hash: tokenHash,
    p_new_code_hash: newCodeHash,
  });

  if (error) return false;
  return Boolean(data);
}

// ---------------------------------------------------------------------------
// Administração (requer sessão com role admin — reforçado por RLS no banco)
// ---------------------------------------------------------------------------

export interface CustomerFilters {
  search?: string;
  birthdayMonth?: number;
  registeredFrom?: string;
  registeredTo?: string;
  benefitStatus?: CustomerBenefitStatus;
  page?: number;
  pageSize?: number;
}

export interface AdminCustomersResult {
  items: CustomerWithBirthday[];
  total: number;
}

/**
 * Devolve uma lista vazia (em vez de lançar) se as tabelas novas ainda não
 * existirem — a migration 0004_customers.sql depende de aprovação manual,
 * e esta é uma tela nova que pode simplesmente aparecer vazia até lá.
 */
export async function getAdminCustomers(
  filters: CustomerFilters = {},
): Promise<AdminCustomersResult> {
  const supabase = await createClient();

  let customerIdsForBenefit: string[] | null = null;
  if (filters.benefitStatus) {
    const { data, error } = await supabase
      .from("customer_benefits")
      .select("customer_id")
      .eq("benefit_type", "primeira_compra")
      .eq("status", filters.benefitStatus);

    if (error) {
      console.error("Falha ao filtrar clientes por benefício:", error.message);
      return { items: [], total: 0 };
    }
    customerIdsForBenefit = (data ?? []).map((row) => row.customer_id);
    if (customerIdsForBenefit.length === 0) {
      return { items: [], total: 0 };
    }
  }

  let query = supabase
    .from("customers_with_birthday")
    .select(CUSTOMER_FIELDS + ", birth_month, birth_day", { count: "exact" });

  if (filters.search) {
    const term = filters.search.replace(/[%,]/g, "");
    query = query.or(`full_name.ilike.%${term}%,phone.ilike.%${term}%`);
  }
  if (filters.birthdayMonth) {
    query = query.eq("birth_month", filters.birthdayMonth);
  }
  if (filters.registeredFrom) {
    query = query.gte("created_at", filters.registeredFrom);
  }
  if (filters.registeredTo) {
    query = query.lte("created_at", filters.registeredTo);
  }
  if (customerIdsForBenefit) {
    query = query.in("id", customerIdsForBenefit);
  }

  const pageSize = filters.pageSize ?? 20;
  const page = filters.page ?? 1;
  const start = (page - 1) * pageSize;

  query = query
    .order("created_at", { ascending: false })
    .range(start, start + pageSize - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error("Falha ao carregar clientes:", error.message);
    return { items: [], total: 0 };
  }

  return {
    items: (data ?? []) as unknown as CustomerWithBirthday[],
    total: count ?? 0,
  };
}

export async function getAdminCustomerById(
  id: string,
): Promise<Customer | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select(CUSTOMER_FIELDS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Falha ao carregar cliente: ${error.message}`);
  }

  return data as unknown as Customer | null;
}

export async function updateCustomer(
  id: string,
  values: CustomerAdminUpdateValues,
  phoneNormalized: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("customers")
    .update({
      full_name: values.full_name,
      phone: values.phone,
      phone_normalized: phoneNormalized,
      birth_date: values.birth_date,
      zip_code: values.zip_code,
      street: values.street,
      number: values.number,
      complement: values.complement || null,
      neighborhood: values.neighborhood,
      city: values.city,
      state: values.state,
      whatsapp_marketing_opt_in: values.whatsapp_marketing_opt_in,
    })
    .eq("id", id);

  if (error) {
    throw new Error(`Falha ao atualizar cliente: ${error.message}`);
  }
}

export async function deleteCustomer(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("customers").delete().eq("id", id);

  if (error) {
    throw new Error(`Falha ao excluir cliente: ${error.message}`);
  }
}

export interface CustomerIndicators {
  totalCustomers: number;
  newCustomersThisMonth: number;
  birthdaysToday: number;
  birthdaysThisMonth: number;
  benefitsAvailable: number;
  benefitsUsed: number;
}

/**
 * Devolve zeros (em vez de lançar) se as tabelas novas ainda não
 * existirem — a migration 0004_customers.sql depende de aprovação manual,
 * e o dashboard/listagem de clientes é uma tela nova que pode simplesmente
 * aparecer vazia até lá.
 */
export async function getCustomerIndicators(): Promise<CustomerIndicators> {
  const supabase = await createClient();

  const now = new Date();
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  ).toISOString();

  const saoPauloNow = new Date(
    now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }),
  );
  const todayMonth = saoPauloNow.getMonth() + 1;
  const todayDay = saoPauloNow.getDate();

  const [
    totalResult,
    newResult,
    birthdaysTodayResult,
    birthdaysMonthResult,
    availableResult,
    usedResult,
  ] = await Promise.all([
    supabase.from("customers").select("id", { count: "exact", head: true }),
    supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .gte("created_at", monthStart),
    supabase
      .from("customers_with_birthday")
      .select("id", { count: "exact", head: true })
      .eq("birth_month", todayMonth)
      .eq("birth_day", todayDay),
    supabase
      .from("customers_with_birthday")
      .select("id", { count: "exact", head: true })
      .eq("birth_month", todayMonth),
    supabase
      .from("customer_benefits")
      .select("id", { count: "exact", head: true })
      .eq("benefit_type", "primeira_compra")
      .eq("status", "disponivel"),
    supabase
      .from("customer_benefits")
      .select("id", { count: "exact", head: true })
      .eq("benefit_type", "primeira_compra")
      .eq("status", "utilizado"),
  ]);

  return {
    totalCustomers: totalResult.count ?? 0,
    newCustomersThisMonth: newResult.count ?? 0,
    birthdaysToday: birthdaysTodayResult.count ?? 0,
    birthdaysThisMonth: birthdaysMonthResult.count ?? 0,
    benefitsAvailable: availableResult.count ?? 0,
    benefitsUsed: usedResult.count ?? 0,
  };
}
