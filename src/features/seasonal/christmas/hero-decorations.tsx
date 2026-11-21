import type { CSSProperties } from "react";

import { cn } from "@/lib/utils/cn";

import { HangingOrnament, ORNAMENT_COLORS } from "./ornament";

const ORNAMENTS: {
  style: CSSProperties;
  stringLength: number;
  size: number;
  color: number;
  desktopOnly?: boolean;
}[] = [
  {
    style: { left: "5%", animationDelay: "0s" },
    stringLength: 14,
    size: 26,
    color: 0,
  },
  {
    style: { left: "16%", animationDelay: "0.6s" },
    stringLength: 70,
    size: 34,
    color: 1,
    desktopOnly: true,
  },
  {
    style: { right: "6%", animationDelay: "0.3s" },
    stringLength: 22,
    size: 28,
    color: 3,
  },
  {
    style: { right: "17%", animationDelay: "1s" },
    stringLength: 96,
    size: 36,
    color: 2,
    desktopOnly: true,
  },
  {
    style: { left: "30%", animationDelay: "1.4s" },
    stringLength: 30,
    size: 24,
    color: 2,
    desktopOnly: true,
  },
];

const STARS: { style: CSSProperties; size: number; desktopOnly?: boolean }[] = [
  { style: { top: "12%", left: "24%", animationDelay: "0s" }, size: 14 },
  { style: { top: "8%", right: "26%", animationDelay: "1.1s" }, size: 12 },
  { style: { bottom: "16%", left: "10%", animationDelay: "0.5s" }, size: 16 },
  { style: { bottom: "10%", right: "12%", animationDelay: "1.7s" }, size: 12 },
  {
    style: { top: "45%", left: "4%", animationDelay: "2.1s" },
    size: 12,
    desktopOnly: true,
  },
  {
    style: { top: "55%", right: "4%", animationDelay: "0.8s" },
    size: 14,
    desktopOnly: true,
  },
];

function Sparkle({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <path
        d="M12 0 C 13 8 16 11 24 12 C 16 13 13 16 12 24 C 11 16 8 13 0 12 C 8 11 11 8 12 0 Z"
        fill="#e2a72e"
      />
    </svg>
  );
}

/** Bolas de Natal penduradas e estrelinhas piscando no topo da home. */
export function HeroChristmasDecorations() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {ORNAMENTS.map((ornament, index) => (
        <HangingOrnament
          key={index}
          color={ORNAMENT_COLORS[ornament.color]}
          size={ornament.size}
          stringLength={ornament.stringLength}
          stringClassName="bg-lilac-400/70"
          className={cn(ornament.desktopOnly && "hidden sm:flex")}
          style={ornament.style}
        />
      ))}
      {STARS.map((star, index) => (
        <span
          key={index}
          className={cn(
            "xmas-sparkle absolute",
            star.desktopOnly && "hidden sm:block",
          )}
          style={star.style}
        >
          <Sparkle size={star.size} />
        </span>
      ))}
    </div>
  );
}
