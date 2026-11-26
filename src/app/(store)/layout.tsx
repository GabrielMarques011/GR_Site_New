import type { ReactNode } from "react";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { CartProvider } from "@/features/cart/cart-context";
import { getRecognizedCustomer } from "@/features/customers/recognize";
import { WelcomeBanner } from "@/features/customers/welcome-banner";
import { ChristmasAnnouncementBar } from "@/features/seasonal/christmas/announcement-bar";
import { ChristmasStyles } from "@/features/seasonal/christmas/christmas-styles";
import { isChristmasSeason } from "@/features/seasonal/christmas/season";
import { getPublicStoreSettings } from "@/services/settings";

export default async function StoreLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [settings, customer] = await Promise.all([
    getPublicStoreSettings(),
    getRecognizedCustomer(),
  ]);
  const christmas = isChristmasSeason();

  return (
    <CartProvider>
      {christmas && <ChristmasStyles />}
      {christmas && <ChristmasAnnouncementBar />}
      <Header settings={settings} christmas={christmas} />
      {customer && (
        <WelcomeBanner firstName={customer.fullName.split(" ")[0]} />
      )}
      <main className="flex-1">{children}</main>
      <Footer settings={settings} />
    </CartProvider>
  );
}
