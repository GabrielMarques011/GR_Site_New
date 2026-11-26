"use server";

import { revalidatePath } from "next/cache";

import {
  clearCustomerSessionCookie,
  generateSessionToken,
  getCustomerSessionToken,
  hashSecret,
  sessionExpiryDate,
  setCustomerSessionCookie,
} from "@/lib/customer-session";
import { normalizePhoneE164 } from "@/lib/utils/phone";
import {
  CONSENT_VERSION,
  customerLoginSchema,
  customerRegistrationSchema,
} from "@/lib/validations/customer";
import {
  loginCustomerByPhone,
  registerCustomer,
  revokeCustomerSession,
} from "@/services/customers";

export interface RegisterCustomerState {
  error: string | null;
  fieldErrors?: Record<string, string>;
  success?: { fullName: string };
}

function parseRegisterForm(formData: FormData) {
  return customerRegistrationSchema.safeParse({
    full_name: formData.get("full_name"),
    phone: formData.get("phone"),
    birth_date: formData.get("birth_date"),
    zip_code: formData.get("zip_code"),
    street: formData.get("street"),
    number: formData.get("number"),
    complement: formData.get("complement"),
    neighborhood: formData.get("neighborhood"),
    city: formData.get("city"),
    state: formData.get("state"),
    whatsapp_marketing_opt_in:
      formData.get("whatsapp_marketing_opt_in") === "on",
  });
}

export async function registerCustomerAction(
  _prevState: RegisterCustomerState,
  formData: FormData,
): Promise<RegisterCustomerState> {
  const parsed = parseRegisterForm(formData);

  if (!parsed.success) {
    return {
      error: "Revise os campos destacados.",
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((issue) => [
          issue.path.join("."),
          issue.message,
        ]),
      ),
    };
  }

  const phoneNormalized = normalizePhoneE164(parsed.data.phone);
  if (!phoneNormalized) {
    return {
      error: "Revise os campos destacados.",
      fieldErrors: { phone: "Informe um WhatsApp válido, com DDD" },
    };
  }

  const sessionToken = generateSessionToken();

  try {
    const result = await registerCustomer({
      fullName: parsed.data.full_name,
      phone: parsed.data.phone,
      phoneNormalized,
      birthDate: parsed.data.birth_date,
      zipCode: parsed.data.zip_code,
      street: parsed.data.street,
      number: parsed.data.number,
      complement: parsed.data.complement || null,
      neighborhood: parsed.data.neighborhood,
      city: parsed.data.city,
      state: parsed.data.state,
      whatsappOptIn: parsed.data.whatsapp_marketing_opt_in,
      consentVersion: parsed.data.whatsapp_marketing_opt_in
        ? CONSENT_VERSION
        : null,
      sessionTokenHash: hashSecret(sessionToken),
      sessionExpiresAt: sessionExpiryDate().toISOString(),
    });

    await setCustomerSessionCookie(sessionToken);
    revalidatePath("/");

    return {
      error: null,
      success: { fullName: result.fullName },
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Falha ao concluir o cadastro.",
    };
  }
}

export interface LoginCustomerState {
  error: string | null;
  fieldErrors?: Record<string, string>;
  success?: { fullName: string };
}

/**
 * "Login" só pelo WhatsApp: localiza o cadastro e reconhece neste
 * dispositivo. Decisão deliberada de simplicidade sobre segurança (pedido
 * explícito) — não há verificação de posse do número. Ver SECURITY.md.
 */
export async function loginCustomerAction(
  _prevState: LoginCustomerState,
  formData: FormData,
): Promise<LoginCustomerState> {
  const parsed = customerLoginSchema.safeParse({
    phone: formData.get("phone"),
  });

  if (!parsed.success) {
    return {
      error: "Revise os campos destacados.",
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((issue) => [
          issue.path.join("."),
          issue.message,
        ]),
      ),
    };
  }

  const phoneNormalized = normalizePhoneE164(parsed.data.phone);
  if (!phoneNormalized) {
    return {
      error: "Revise os campos destacados.",
      fieldErrors: { phone: "Informe um WhatsApp válido, com DDD" },
    };
  }

  const sessionToken = generateSessionToken();

  try {
    const result = await loginCustomerByPhone({
      phoneNormalized,
      sessionTokenHash: hashSecret(sessionToken),
      sessionExpiresAt: sessionExpiryDate().toISOString(),
    });

    if (!result) {
      return {
        error: "Não encontramos nenhum cadastro com esse WhatsApp.",
      };
    }

    await setCustomerSessionCookie(sessionToken);
    revalidatePath("/");

    return { error: null, success: { fullName: result.fullName } };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Falha ao acessar o cadastro.",
    };
  }
}

export async function logoutCustomerAction(): Promise<void> {
  const token = await getCustomerSessionToken();
  if (token) {
    await revokeCustomerSession(hashSecret(token));
  }
  await clearCustomerSessionCookie();
  revalidatePath("/");
}
