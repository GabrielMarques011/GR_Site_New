import type { ReactNode } from "react";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { CartProvider } from "@/features/cart/cart-context";
import { getPublicStoreSettings } from "@/services/settings";

export default async function StoreLayout({
  children,
}: {
  children: ReactNode;
}) {
  const settings = await getPublicStoreSettings();

  return (
    <CartProvider>
      <Header settings={settings} />
      <main className="flex-1">{children}</main>
      <Footer settings={settings} />
    </CartProvider>
  );
}
