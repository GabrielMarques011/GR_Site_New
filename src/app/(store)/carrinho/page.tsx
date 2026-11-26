import type { Metadata } from "next";

import { CartView } from "@/features/cart/cart-view";
import { getRecognizedCustomer } from "@/features/customers/recognize";
import { getPublicStoreSettings } from "@/services/settings";

export const metadata: Metadata = {
  title: "Carrinho",
};

export default async function CarrinhoPage() {
  const [settings, recognizedCustomer] = await Promise.all([
    getPublicStoreSettings(),
    getRecognizedCustomer(),
  ]);

  return (
    <div className="container-page py-10">
      <h1 className="mb-6 font-display text-3xl font-semibold text-ink-900">
        Carrinho
      </h1>
      <CartView
        whatsapp={settings.whatsapp}
        recognizedCustomer={recognizedCustomer}
      />
    </div>
  );
}
