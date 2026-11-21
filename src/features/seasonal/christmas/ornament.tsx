import type { CSSProperties } from "react";

import { cn } from "@/lib/utils/cn";

export const ORNAMENT_COLORS = ["#d93a4a", "#e2a72e", "#2f9e66", "#8359af"];

export function Ornament({ color, size }: { color: string; size: number }) {
  return (
    <svg viewBox="0 0 40 46" width={size} height={(size * 46) / 40} aria-hidden>
      <rect x="15" y="0" width="10" height="7" rx="1.5" fill="#d4a63a" />
      <rect x="15" y="5" width="10" height="2" fill="#a97f22" />
      <circle cx="20" cy="27" r="17" fill={color} />
      <path
        d="M3.5 27 Q 11.75 21 20 27 T 36.5 27"
        stroke="#fff"
        strokeOpacity="0.55"
        strokeWidth="2.5"
        fill="none"
      />
      <ellipse
        cx="13"
        cy="20"
        rx="3.5"
        ry="6"
        fill="#fff"
        fillOpacity="0.4"
        transform="rotate(30 13 20)"
      />
    </svg>
  );
}

/** Bola de Natal pendurada por um fio, balançando de leve. */
export function HangingOrnament({
  color,
  size,
  stringLength,
  stringClassName = "bg-ink-300",
  className,
  style,
}: {
  color: string;
  size: number;
  stringLength: number;
  stringClassName?: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "xmas-sway pointer-events-none absolute top-0 flex flex-col items-center",
        className,
      )}
      style={style}
    >
      <span
        className={cn("w-px", stringClassName)}
        style={{ height: stringLength }}
      />
      <Ornament color={color} size={size} />
    </span>
  );
}

/** Escolhe uma cor de bola estável para um produto (mesma cor a cada visita). */
export function ornamentColorFor(id: string): string {
  let hash = 0;
  for (const char of id) hash = (hash + char.charCodeAt(0)) % 997;
  return ORNAMENT_COLORS[hash % ORNAMENT_COLORS.length];
}
