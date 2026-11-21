import { cn } from "@/lib/utils/cn";

/** Gorro de Papai Noel em SVG próprio (sem imagem de terceiros). */
export function SantaHat({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 62 50"
      aria-hidden
      className={cn("pointer-events-none", className)}
    >
      <path
        d="M8 39 C 12 22 23 9 39 8 C 49 7 56 12 56 21 C 50 17 44 19 44 25 C 44 31 48 35 52 39 Z"
        fill="#d63447"
      />
      <path
        d="M39 8 C 49 7 56 12 56 21 C 52 18 47 18 45 21 C 44 15 42 11 39 8 Z"
        fill="#b0263a"
      />
      <rect
        x="3"
        y="35"
        width="54"
        height="12"
        rx="6"
        fill="#fff"
        stroke="#e4dbe9"
        strokeWidth="1.2"
      />
      <circle
        cx="56"
        cy="21"
        r="5.5"
        fill="#fff"
        stroke="#e4dbe9"
        strokeWidth="1.2"
      />
    </svg>
  );
}
