import Image from "next/image";
import Link from "next/link";
import { Sparkles } from "lucide-react";

import { isAllowedImageUrl } from "@/lib/utils/image-host";
import type { Category } from "@/types/domain";

export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      href={`/categorias/${category.slug}`}
      className="focus-ring group relative flex aspect-[4/3] items-end overflow-hidden rounded-2xl bg-lilac-100"
    >
      {isAllowedImageUrl(category.image_url) ? (
        <Image
          src={category.image_url}
          alt={category.name}
          fill
          sizes="(min-width: 1024px) 25vw, 50vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-lilac-400">
          <Sparkles className="size-10" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-ink-900/70 via-ink-900/0 to-transparent" />
      <span className="relative z-10 p-4 font-display text-base font-semibold text-white">
        {category.name}
      </span>
    </Link>
  );
}
