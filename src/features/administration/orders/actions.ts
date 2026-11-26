"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  orderPaymentStatusSchema,
  orderStatusSchema,
} from "@/lib/validations/order";
import { logAuditEvent } from "@/services/audit";
import {
  cancelPreparedCharge,
  confirmChargeSent,
  logPreparedCharge,
} from "@/services/order-charge-logs";
import { updateOrderPaymentStatus, updateOrderStatus } from "@/services/orders";
import type { OrderPaymentStatus, OrderStatus } from "@/types/domain";

function revalidateOrderPaths() {
  revalidatePath("/administracao/historico");
  revalidatePath("/administracao/pagamentos");
}

export async function updateOrderStatusAction(
  orderId: string,
  status: OrderStatus,
): Promise<void> {
  const parsed = orderStatusSchema.safeParse(status);
  if (!parsed.success) return;

  await updateOrderStatus(orderId, parsed.data);
  await logAuditEvent("order.status_update", "orders", orderId, {
    status: parsed.data,
  });
  revalidateOrderPaths();
}

export async function updateOrderPaymentStatusAction(
  orderId: string,
  paymentStatus: OrderPaymentStatus,
): Promise<void> {
  const parsed = orderPaymentStatusSchema.safeParse(paymentStatus);
  if (!parsed.success) return;

  await updateOrderPaymentStatus(orderId, parsed.data);
  await logAuditEvent("order.payment_status_update", "orders", orderId, {
    paymentStatus: parsed.data,
  });
  revalidateOrderPaths();
}

export async function prepareChargeAction(
  orderId: string,
): Promise<{ error: string | null; logId?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const logId = await logPreparedCharge({
      orderId,
      administratorId: user?.id ?? null,
    });

    await logAuditEvent("order.charge_prepared", "order_charge_logs", logId, {
      orderId,
    });
    revalidateOrderPaths();
    return { error: null, logId };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Falha ao preparar cobrança.",
    };
  }
}

export async function confirmChargeSentAction(
  logId: string,
  orderId: string,
): Promise<void> {
  await confirmChargeSent(logId);
  await logAuditEvent("order.charge_confirmed", "order_charge_logs", logId, {
    orderId,
  });
  revalidateOrderPaths();
}

export async function cancelPreparedChargeAction(
  logId: string,
  orderId: string,
): Promise<void> {
  await cancelPreparedCharge(logId);
  await logAuditEvent("order.charge_cancelled", "order_charge_logs", logId, {
    orderId,
  });
  revalidateOrderPaths();
}
