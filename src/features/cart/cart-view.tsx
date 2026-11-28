"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ShoppingBag } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/currency";

import type { RecognizedCustomer } from "@/services/customers";

import { useCart } from "./cart-context";
import { CartItemRow } from "./cart-item-row";
import { CheckoutForm } from "./checkout-form";
import type { PlaceOrderState } from "./checkout-actions";
import { revalidateCart, type CartIssue } from "./revalidate-cart";

const ISSUE_LABELS: Record<CartIssue["type"], (issue: CartIssue) => string> = {
  removed: (issue) =>
    `"${issue.name}" não está mais disponível e foi removido do carrinho.`,
  price_changed: (issue) =>
    `O preço de "${issue.name}" foi atualizado de ${formatCurrency(issue.previousPrice ?? 0)} para ${formatCurrency(issue.newPrice ?? 0)}.`,
  quantity_adjusted: (issue) =>
    `Não há estoque suficiente de "${issue.name}" — a quantidade foi ajustada para ${issue.newQuantity}.`,
};

export function CartView({
  whatsapp,
  recognizedCustomer,
}: {
  whatsapp: string | null;
  recognizedCustomer?: RecognizedCustomer | null;
}) {
  const { items, subtotal, replaceItems, clear } = useCart();
  const [issues, setIssues] = useState<CartIssue[]>([]);
  const [checking, startTransition] = useTransition();
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(false);
  const [lastWhatsappUrl, setLastWhatsappUrl] = useState<string | null>(null);

  function handleStartCheckout() {
    startTransition(async () => {
      const result = await revalidateCart(items);
      replaceItems(result.items);

      if (result.issues.length > 0) {
        setIssues(result.issues);
        return;
      }

      setIssues([]);
      if (result.items.length === 0 || !whatsapp) return;
      setShowCheckoutForm(true);
    });
  }

  function handlePlaced(result: PlaceOrderState) {
    setShowCheckoutForm(false);
    setPlacedOrder(true);
    setLastWhatsappUrl(result.whatsappUrl ?? null);
    clear();
  }

  if (placedOrder) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center text-ink-700">
        <ShoppingBag className="size-12 text-lilac-500" />
        <p className="max-w-sm">
          Pedido enviado! Continue a conversa no WhatsApp para confirmar
          disponibilidade e forma de pagamento.
        </p>
        {lastWhatsappUrl && (
          <a
            href={lastWhatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "primary" })}
          >
            Abrir conversa no WhatsApp
          </a>
        )}
        <Link
          href="/produtos"
          className={buttonVariants({ variant: "outline" })}
        >
          Continuar comprando
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center text-ink-500">
        <ShoppingBag className="size-12" />
        {issues.length > 0 && (
          <Alert variant="warning" className="w-full max-w-md text-left">
            <p className="font-semibold">Alguns itens foram removidos:</p>
            <ul className="mt-1 list-disc space-y-1 pl-4 font-normal">
              {issues.map((issue, index) => (
                <li key={`${issue.productId}-${index}`}>
                  {ISSUE_LABELS[issue.type](issue)}
                </li>
              ))}
            </ul>
          </Alert>
        )}
        <p>Seu carrinho está vazio.</p>
        <Link
          href="/produtos"
          className={buttonVariants({ variant: "outline" })}
        >
          Ver produtos
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        {issues.length > 0 && (
          <Alert variant="warning" className="mb-4">
            <p className="font-semibold">Alguns itens foram atualizados:</p>
            <ul className="mt-1 list-disc space-y-1 pl-4 font-normal">
              {issues.map((issue, index) => (
                <li key={`${issue.productId}-${index}`}>
                  {ISSUE_LABELS[issue.type](issue)}
                </li>
              ))}
            </ul>
          </Alert>
        )}

        <div className="rounded-2xl border border-ink-100 bg-white px-5">
          {items.map((item) => (
            <CartItemRow
              key={`${item.productId}:${item.optionId ?? "avulso"}`}
              item={item}
            />
          ))}
        </div>
      </div>

      <div className="flex h-fit flex-col gap-4">
        <div className="rounded-2xl border border-ink-100 bg-white p-6">
          <h2 className="font-display text-lg font-semibold text-ink-900">
            Resumo do pedido
          </h2>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-ink-700">Subtotal</span>
            <span className="font-semibold text-ink-900">
              {formatCurrency(subtotal)}
            </span>
          </div>
          <p className="mt-2 text-xs text-ink-500">
            O pedido será confirmado e combinado diretamente pelo WhatsApp.
            Nenhum pagamento é processado neste site.
          </p>

          {!showCheckoutForm && (
            <Button
              className="mt-5 w-full"
              size="lg"
              onClick={handleStartCheckout}
              isLoading={checking}
            >
              Finalizar pelo WhatsApp
            </Button>
          )}
        </div>

        {showCheckoutForm && (
          <CheckoutForm
            items={items}
            recognizedCustomer={recognizedCustomer}
            onPlaced={handlePlaced}
            onCancel={() => setShowCheckoutForm(false)}
          />
        )}
      </div>
    </div>
  );
}
