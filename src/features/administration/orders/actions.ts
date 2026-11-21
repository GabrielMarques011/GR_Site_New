"use server";

import { revalidatePath } from "next/cache";

import { orderStatusSchema } from "@/lib/validations/order";
import { logAuditEvent } from "@/services/audit";
import { updateOrderStatus } from "@/services/orders";
import type { OrderStatus } from "@/types/domain";

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
  revalidatePath("/administracao/historico");
}
