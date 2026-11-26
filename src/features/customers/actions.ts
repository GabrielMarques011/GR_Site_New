"use server";

import { revalidatePath } from "next/cache";

import {
  clearCustomerSessionCookie,
  generateRecoveryCode,
  generateSessionToken,
  getCustomerSessionToken,
  hashRecoveryCode,
  hashSecret,
  sessionExpiryDate,
  setCustomerSessionCookie,
  setRegistrationFlashCookie,
} from "@/lib/customer-session";
import { normalizePhoneE164 } from "@/lib/utils/phone";
import {
  CONSENT_VERSION,
  customerRecoverySchema,
  customerRegistrationSchema,
} from "@/lib/validations/customer";
import {
  recoverCustomerSession,
  registerCustomer,
  revokeCustomerSession,
  rotateRecoveryCode,
} from "@/services/customers";

export interface RegisterCustomerState {
  error: string | null;
  fieldErrors?: Record<string, string>;
  success?: { fullName: string; recoveryCode: string };
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
  const recoveryCode = generateRecoveryCode();

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
      recoveryCodeHash: hashRecoveryCode(recoveryCode),
    });

    await setCustomerSessionCookie(sessionToken);
    await setRegistrationFlashCookie({
      fullName: result.fullName,
      recoveryCode,
    });
    revalidatePath("/");

    return {
      error: null,
      success: { fullName: result.fullName, recoveryCode },
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

export interface RecoverCustomerState {
  error: string | null;
  fieldErrors?: Record<string, string>;
  success?: { fullName: string };
}

export async function recoverCustomerAction(
  _prevState: RecoverCustomerState,
  formData: FormData,
): Promise<RecoverCustomerState> {
  const parsed = customerRecoverySchema.safeParse({
    phone: formData.get("phone"),
    recovery_code: formData.get("recovery_code"),
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
    const result = await recoverCustomerSession({
      phoneNormalized,
      codeHash: hashRecoveryCode(parsed.data.recovery_code),
      sessionTokenHash: hashSecret(sessionToken),
      sessionExpiresAt: sessionExpiryDate().toISOString(),
    });

    if (!result) {
      return { error: "Telefone ou código de recuperação inválidos." };
    }

    await setCustomerSessionCookie(sessionToken);
    revalidatePath("/");

    return { error: null, success: { fullName: result.fullName } };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Falha ao recuperar cadastro.",
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

export interface RotateRecoveryCodeState {
  error: string | null;
  newCode?: string;
}

export async function rotateRecoveryCodeAction(): Promise<RotateRecoveryCodeState> {
  const token = await getCustomerSessionToken();
  if (!token) {
    return {
      error:
        "Você precisa estar reconhecido neste dispositivo para gerar um novo código.",
    };
  }

  const newCode = generateRecoveryCode();
  const ok = await rotateRecoveryCode(
    hashSecret(token),
    hashRecoveryCode(newCode),
  );

  if (!ok) {
    return { error: "Não foi possível gerar um novo código. Tente novamente." };
  }

  return { error: null, newCode };
}
