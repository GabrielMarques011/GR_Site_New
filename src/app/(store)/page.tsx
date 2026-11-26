import Link from "next/link";
import { AtSign, PenTool, Sparkles, Truck } from "lucide-react";

import { CategoryCard } from "@/components/store/category-card";
import { HeroBackground } from "@/components/store/hero-background";
import { LocationCard } from "@/components/store/location-card";
import { ProductCard } from "@/components/store/product-card";
import { buttonVariants } from "@/components/ui/button";
import { HeroChristmasDecorations } from "@/features/seasonal/christmas/hero-decorations";
import { isChristmasSeason } from "@/features/seasonal/christmas/season";
import { Snowfall } from "@/features/seasonal/christmas/snowfall";
import { getActiveCampaignsShowcase } from "@/services/campaigns";
import { getActiveCategories } from "@/services/categories";
import { getHomeShowcase } from "@/services/products";
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
  const [
    settings,
    categories,
    { homeProducts, promotional, heroImages },
    campaignShowcases,
  ] = await Promise.all([
    getPublicStoreSettings(),
    getActiveCategories(),
    getHomeShowcase({ homeProducts: 8, promotional: 8, heroImages: 6 }),
    getActiveCampaignsShowcase(),
  ]);

  const christmas = isChristmasSeason();

  return (
    <div>
      <section className="relative overflow-hidden">
        <HeroBackground images={heroImages} />
        {christmas && <HeroChristmasDecorations />}
        {christmas && <Snowfall />}
        <div className="container-page relative flex justify-center pb-24 pt-12 sm:py-28">
          <div className="flex max-w-2xl flex-col items-center gap-5 rounded-3xl bg-white/85 px-5 py-8 text-center shadow-xl shadow-ink-900/10 backdrop-blur-md sm:gap-6 sm:px-14 sm:py-14">
            <span className="rounded-full bg-lilac-100 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-lilac-700">
              {christmas
                ? "Especial de Natal · feito com carinho"
                : "Personalizados feitos com carinho"}
            </span>
            <h1 className="font-display text-4xl font-bold tracking-tight text-ink-900 sm:text-6xl">
              {settings.store_name}
            </h1>
            {settings.slogan && (
              <p className="max-w-xl text-lg font-medium text-ink-700 sm:text-xl">
                {settings.slogan}
              </p>
            )}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/produtos"
                className={buttonVariants({
                  size: "lg",
                  className: "shadow-lg shadow-lilac-900/20",
                })}
              >
                Ver produtos
              </Link>
              <Link
                href="/contato"
                className={buttonVariants({
                  size: "lg",
                  variant: "outline",
                  className: "bg-white shadow-sm",
                })}
              >
                Falar no WhatsApp
              </Link>
            </div>
          </div>
        </div>
      </section>

      {campaignShowcases.map(({ campaign, products }) => (
        <section
          key={campaign.id}
          className="border-y border-lilac-200 bg-lilac-50/60 py-10"
        >
          <div className="container-page">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-lilac-700">
                  Edição especial
                </span>
                <h2 className="font-display text-2xl font-semibold text-ink-900">
                  {campaign.name}
                </h2>
              </div>
              <Link
                href={`/produtos?campanha=${campaign.slug}`}
                className="text-sm font-medium text-lilac-700 hover:underline"
              >
                Ver todos
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      ))}

      {homeProducts.length > 0 && (
        <section className="container-page py-10">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="font-display text-2xl font-semibold text-ink-900">
              Produtos
            </h2>
            <Link
              href="/produtos"
              className="text-sm font-medium text-lilac-700 hover:underline"
            >
              Ver todos
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {homeProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {categories.length > 0 && (
        <section className="container-page py-10">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="font-display text-2xl font-semibold text-ink-900">
              Catálogo
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

      {promotional.length > 0 && (
        <section className="bg-lilac-50/60 py-10">
          <div className="container-page">
            <div className="mb-6 flex items-end justify-between">
              <h2 className="font-display text-2xl font-semibold text-ink-900">
                {christmas ? "Ofertas de Natal" : "Em promoção"}
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
        <section className="container-page py-10">
          <h2 className="mb-4 font-display text-2xl font-semibold text-ink-900">
            Onde estamos
          </h2>
          <LocationCard settings={settings} />
        </section>
      )}
    </div>
  );
}
