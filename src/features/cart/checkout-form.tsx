"use client";

import { useState, useTransition } from "react";
import { PartyPopper } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { CartItem } from "@/types/domain";

import {
  checkDiscountEligibilityAction,
  placeOrderAction,
  type PlaceOrderState,
} from "./checkout-actions";

export function CheckoutForm({
  items,
  onPlaced,
  onCancel,
}: {
  items: CartItem[];
  onPlaced: (result: PlaceOrderState) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [eligibleForDiscount, setEligibleForDiscount] = useState(false);
  const [pending, startTransition] = useTransition();
  const [checkingPhone, startPhoneCheck] = useTransition();

  function handlePhoneBlur() {
    if (!phone.trim()) return;
    startPhoneCheck(async () => {
      const { isFirstPurchase } = await checkDiscountEligibilityAction(phone);
      setEligibleForDiscount(isFirstPurchase);
    });
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    // Precisa abrir a aba em branco aqui, de forma síncrona e dentro do
    // gesto de clique original — se esperarmos o resultado do servidor
    // para só então chamar window.open, o navegador mobile (principalmente
    // iOS Safari) bloqueia o popup por não considerar mais uma ação direta
    // do usuário. O endereço final é definido depois, quando o pedido já
    // foi confirmado.
    const whatsappWindow = window.open("", "_blank");

    const formData = new FormData();
    formData.set("name", name);
    formData.set("phone", phone);

    startTransition(async () => {
      const result = await placeOrderAction(items, { error: null }, formData);
      if (result.error) {
        whatsappWindow?.close();
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      if (result.whatsappUrl) {
        if (whatsappWindow) {
          whatsappWindow.location.href = result.whatsappUrl;
        } else {
          window.open(result.whatsappUrl, "_blank");
        }
      } else {
        whatsappWindow?.close();
      }

      onPlaced(result);
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-2xl border border-lilac-200 bg-lilac-50/60 p-5"
    >
      <div>
        <h3 className="font-display text-base font-semibold text-ink-900">
          Só mais um passo
        </h3>
        <p className="mt-0.5 text-sm text-ink-700">
          Para finalizar, nos diga seu nome e WhatsApp.
        </p>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {eligibleForDiscount && !checkingPhone && (
        <Alert variant="success">
          <span className="inline-flex items-center gap-1.5">
            <PartyPopper className="size-4" />
            Você ganhou 5% de desconto na primeira compra!
          </span>
        </Alert>
      )}

      <Field
        label="Nome"
        htmlFor="checkout-name"
        error={fieldErrors.name}
        required
      >
        <Input
          id="checkout-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Seu nome"
          required
        />
      </Field>

      <Field
        label="WhatsApp"
        htmlFor="checkout-phone"
        error={fieldErrors.phone}
        hint="Com DDD, ex: 11919335496"
        required
      >
        <Input
          id="checkout-phone"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          onBlur={handlePhoneBlur}
          placeholder="11919335496"
          inputMode="tel"
          required
        />
      </Field>

      <div className="flex gap-3 pt-1">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          Voltar
        </Button>
        <Button type="submit" isLoading={pending} className="flex-1">
          Confirmar pedido
        </Button>
      </div>
    </form>
  );
}
