import Link from "next/link";
import { AtSign, MapPin, PenTool, Sparkles, Truck } from "lucide-react";

import { CategoryCard } from "@/components/store/category-card";
import { ProductCard } from "@/components/store/product-card";
import { buttonVariants } from "@/components/ui/button";
import { getActiveCategories } from "@/services/categories";
import {
  getFeaturedProducts,
  getPromotionalProducts,
} from "@/services/products";
import { getPublicStoreSettings } from "@/services/settings";

const DIFERENCIAIS = [
  {
    icon: PenTool,
    title: "Feito sob medida",
    description: "Cada peça é pensada e personalizada para o seu pedido.",
  },
  {
    icon: Sparkles,
    title: "Capricho em cada detalhe",
    description: "Materiais de qualidade e acabamento cuidadoso.",
  },
  {
    icon: Truck,
    title: "Combinado pelo WhatsApp",
    description:
      "Converse direto com a gente para alinhar entrega e pagamento.",
  },
];

export default async function HomePage() {
  const [settings, categories, featured, promotional] = await Promise.all([
    getPublicStoreSettings(),
    getActiveCategories(),
    getFeaturedProducts(8),
    getPromotionalProducts(8),
  ]);

  return (
    <div className="pb-20">
      <section className="bg-gradient-to-b from-lilac-100 via-lilac-50 to-white">
        <div className="container-page flex flex-col items-center gap-6 py-20 text-center">
          <span className="rounded-full bg-white px-4 py-1 text-xs font-semibold uppercase tracking-wide text-lilac-700 shadow-sm">
            Personalizados feitos com carinho
          </span>
          <h1 className="max-w-2xl font-display text-4xl font-semibold text-ink-900 sm:text-5xl">
            {settings.store_name}
          </h1>
          {settings.slogan && (
            <p className="max-w-xl text-lg text-ink-700">{settings.slogan}</p>
          )}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/produtos" className={buttonVariants({ size: "lg" })}>
              Ver produtos
            </Link>
            <Link
              href="/contato"
              className={buttonVariants({ size: "lg", variant: "outline" })}
            >
              Falar no WhatsApp
            </Link>
          </div>
        </div>
      </section>

      {settings.about_text && (
        <section className="container-page py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-2xl font-semibold text-ink-900">
              Sobre a {settings.store_name}
            </h2>
            <p className="mt-4 whitespace-pre-line text-ink-700">
              {settings.about_text}
            </p>
          </div>
        </section>
      )}

      {categories.length > 0 && (
        <section className="container-page py-10">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="font-display text-2xl font-semibold text-ink-900">
              Categorias
            </h2>
            <Link
              href="/categorias"
              className="text-sm font-medium text-lilac-700 hover:underline"
            >
              Ver todas
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {categories.slice(0, 8).map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <section className="container-page py-10">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="font-display text-2xl font-semibold text-ink-900">
              Produtos em destaque
            </h2>
            <Link
              href="/produtos?destaque=1"
              className="text-sm font-medium text-lilac-700 hover:underline"
            >
              Ver todos
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {promotional.length > 0 && (
        <section className="bg-lilac-50/60 py-10">
          <div className="container-page">
            <div className="mb-6 flex items-end justify-between">
              <h2 className="font-display text-2xl font-semibold text-ink-900">
                Em promoção
              </h2>
              <Link
                href="/produtos?promocao=1"
                className="text-sm font-medium text-lilac-700 hover:underline"
              >
                Ver todas
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {promotional.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="container-page py-16">
        <div className="grid gap-6 sm:grid-cols-3">
          {DIFERENCIAIS.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-ink-100 bg-white p-6"
            >
              <Icon className="size-8 text-lilac-600" />
              <h3 className="mt-4 font-medium text-ink-900">{title}</h3>
              <p className="mt-1 text-sm text-ink-700">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page">
        <div className="flex flex-col items-center gap-6 rounded-3xl bg-lilac-700 p-10 text-center text-white sm:flex-row sm:justify-between sm:text-left">
          <div>
            <h2 className="font-display text-2xl font-semibold">
              Quer um produto personalizado?
            </h2>
            <p className="mt-1 text-lilac-100">
              Fale com a gente e vamos criar algo especial para você.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {settings.instagram_url && (
              <a
                href={settings.instagram_url}
                target="_blank"
                rel="noreferrer"
                className={buttonVariants({ size: "lg", variant: "secondary" })}
              >
                <AtSign className="size-4" /> Instagram
              </a>
            )}
            <Link
              href="/contato"
              className={buttonVariants({
                size: "lg",
                className: "bg-white text-lilac-800 hover:bg-lilac-50",
              })}
            >
              Falar agora
            </Link>
          </div>
        </div>
      </section>

      {settings.address && (
        <section className="container-page flex items-center gap-3 py-10 text-ink-700">
          <MapPin className="size-5 text-lilac-600" />
          <span>{settings.address}</span>
        </section>
      )}
    </div>
  );
}
