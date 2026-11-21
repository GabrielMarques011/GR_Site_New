import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * clsx sozinho só concatena classes — se duas classes do Tailwind
 * conflitarem (ex.: `bg-lilac-600` de uma variante e `bg-white` passado
 * depois para sobrescrever), quem "ganha" depende da ordem em que o
 * Tailwind gerou o CSS, não da ordem no JSX, o que já deixou botões com
 * texto invisível em produção. `twMerge` resolve esses conflitos de
 * verdade, sempre priorizando a classe passada por último.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
