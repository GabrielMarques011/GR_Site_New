"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { normalizePhoneE164 } from "@/lib/utils/phone";
import {
  CONSENT_VERSION,
  customerAdminUpdateSchema,
  customerRegistrationSchema,
} from "@/lib/validations/customer";
import { logAuditEvent } from "@/services/audit";
import {
  cancelBenefitReservation,
  confirmBenefitUsage,
  revokeBenefit,
} from "@/services/customer-benefits";
import {
  createCustomerByAdmin,
  deleteCustomer,
  updateCustomer,
} from "@/services/customers";
import { updateWhatsAppTemplate } from "@/services/whatsapp-templates";
import {
  cancelPreparedMessage,
  confirmMessageSent,
  logPreparedMessage,
} from "@/services/whatsapp-message-logs";
import type {
  WhatsAppMessageTemplateType,
  WhatsAppMessageType,
} from "@/types/domain";

export interface CustomerFormState {
  error: string | null;
  fieldErrors?: Record<string, string>;
}

function revalidateCustomerPaths(id?: string) {
  revalidatePath("/administracao/clientes");
  if (id) revalidatePath(`/administracao/clientes/${id}`);
}

export interface CreateCustomerState {
  error: string | null;
  fieldErrors?: Record<string, string>;
  success?: { customerId: string; fullName: string };
}

export async function createCustomerAction(
  _prevState: CreateCustomerState,
  formData: FormData,
): Promise<CreateCustomerState> {
  const parsed = customerRegistrationSchema.safeParse({
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

  try {
    const result = await createCustomerByAdmin({
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
    });

    await logAuditEvent(
      "customer.create_by_admin",
      "customers",
      result.customerId,
      {
        name: result.fullName,
      },
    );
    revalidateCustomerPaths();

    return {
      error: null,
      success: {
        customerId: result.customerId,
        fullName: result.fullName,
      },
    };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Falha ao cadastrar cliente.",
    };
  }
}

function parseCustomerForm(formData: FormData) {
  return customerAdminUpdateSchema.safeParse({
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

export async function updateCustomerAction(
  customerId: string,
  _prevState: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const parsed = parseCustomerForm(formData);

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

  try {
    await updateCustomer(customerId, parsed.data, phoneNormalized);
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Falha ao atualizar cliente.",
    };
  }

  await logAuditEvent("customer.update", "customers", customerId, {
    name: parsed.data.full_name,
  });
  revalidateCustomerPaths(customerId);
  return { error: null };
}

export async function deleteCustomerAction(customerId: string): Promise<void> {
  await deleteCustomer(customerId);
  await logAuditEvent("customer.delete", "customers", customerId);
  revalidateCustomerPaths();
}

export async function confirmBenefitUsageAction(
  customerId: string,
): Promise<void> {
  await confirmBenefitUsage(customerId);
  await logAuditEvent(
    "customer.benefit_confirm",
    "customer_benefits",
    customerId,
  );
  revalidateCustomerPaths(customerId);
}

export async function cancelBenefitReservationAction(
  customerId: string,
): Promise<void> {
  await cancelBenefitReservation(customerId);
  await logAuditEvent(
    "customer.benefit_cancel",
    "customer_benefits",
    customerId,
  );
  revalidateCustomerPaths(customerId);
}

export async function revokeBenefitAction(customerId: string): Promise<void> {
  await revokeBenefit(customerId);
  await logAuditEvent(
    "customer.benefit_revoke",
    "customer_benefits",
    customerId,
  );
  revalidateCustomerPaths(customerId);
}

export async function prepareMessageAction(input: {
  customerId: string;
  messageType: WhatsAppMessageType;
  content: string;
}): Promise<{ error: string | null; logId?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const logId = await logPreparedMessage({
      customerId: input.customerId,
      messageType: input.messageType,
      messageContent: input.content,
      administratorId: user?.id ?? null,
    });

    await logAuditEvent(
      "customer.message_prepared",
      "whatsapp_message_logs",
      logId,
      { messageType: input.messageType },
    );
    revalidateCustomerPaths(input.customerId);
    return { error: null, logId };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Falha ao preparar mensagem.",
    };
  }
}

export async function confirmMessageSentAction(
  logId: string,
  customerId: string,
): Promise<void> {
  await confirmMessageSent(logId);
  await logAuditEvent(
    "customer.message_confirmed",
    "whatsapp_message_logs",
    logId,
  );
  revalidateCustomerPaths(customerId);
}

export async function cancelPreparedMessageAction(
  logId: string,
  customerId: string,
): Promise<void> {
  await cancelPreparedMessage(logId);
  await logAuditEvent(
    "customer.message_cancelled",
    "whatsapp_message_logs",
    logId,
  );
  revalidateCustomerPaths(customerId);
}

export async function updateWhatsAppTemplateAction(
  messageType: WhatsAppMessageTemplateType,
  _prevState: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const content = String(formData.get("content") ?? "").trim();

  if (!content) {
    return { error: "O conteúdo da mensagem não pode ficar vazio." };
  }

  try {
    await updateWhatsAppTemplate(messageType, content);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Falha ao salvar modelo.",
    };
  }

  await logAuditEvent(
    "whatsapp_template.update",
    "whatsapp_message_templates",
    null,
    { messageType },
  );
  revalidatePath("/administracao/clientes/modelos");
  return { error: null };
}
