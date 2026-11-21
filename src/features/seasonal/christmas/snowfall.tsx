import type { CSSProperties } from "react";

const SNOWFLAKES = Array.from({ length: 18 }, (_, i) => ({
  left: (i / 18) * 100 + Math.sin(i * 7) * 4,
  size: 3 + ((i * 3) % 4),
  delay: (i * 1.7) % 10,
  duration: 9 + ((i * 2.3) % 7),
  drift: 15 + ((i * 5) % 25),
  opacity: 0.55 + ((i * 0.04) % 0.35),
}));

/** Flocos de neve caindo no topo da home (a animação fica em ChristmasStyles). */
export function Snowfall() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {SNOWFLAKES.map((flake, i) => (
        <span
          key={i}
          className="xmas-snowflake absolute rounded-full bg-white shadow-[0_0_3px_rgba(131,89,175,0.55)]"
          style={
            {
              left: `${flake.left}%`,
              top: "-8px",
              width: flake.size,
              height: flake.size,
              opacity: flake.opacity,
              animationDuration: `${flake.duration}s`,
              animationDelay: `-${flake.delay}s`,
              "--xmas-drift": `${flake.drift}px`,
            } as CSSProperties
          }
        />
      ))}
    </span>
  );
}
