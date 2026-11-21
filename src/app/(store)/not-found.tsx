import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center gap-4 py-24 text-center">
      <h1 className="font-display text-3xl font-semibold text-ink-900">
        Página não encontrada
      </h1>
      <p className="text-ink-700">
        O conteúdo que você procura não existe ou foi removido.
      </p>
      <Link href="/" className={buttonVariants()}>
        Voltar para a loja
      </Link>
    </div>
  );
}
