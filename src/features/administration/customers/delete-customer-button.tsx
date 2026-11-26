"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import { deleteCustomerAction } from "./actions";

export function DeleteCustomerButton({
  customerId,
  customerName,
}: {
  customerId: string;
  customerName: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (
      !window.confirm(
        `Excluir o cadastro de "${customerName}"? Os pedidos já registrados continuam no histórico, só o cadastro é removido. Esta ação não pode ser desfeita.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      await deleteCustomerAction(customerId);
      router.push("/administracao/clientes");
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant="danger"
      size="sm"
      onClick={handleDelete}
      isLoading={pending}
    >
      <Trash2 className="size-4" /> Excluir cadastro
    </Button>
  );
}
