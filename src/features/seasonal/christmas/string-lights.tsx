import { cn } from "@/lib/utils/cn";

const BULB_COLORS = ["#e5484d", "#f5b83d", "#30a46c", "#9b6fc7", "#3e8fd9"];

function LightsRow({
  count,
  className,
}: {
  count: number;
  className?: string;
}) {
  const wire = Array.from(
    { length: count },
    (_, i) => `M${i * 100} 0 Q ${i * 100 + 50} 32 ${(i + 1) * 100} 0`,
  ).join(" ");

  return (
    <div className={cn("absolute inset-x-0 top-0 h-6", className)}>
      <svg
        className="absolute inset-x-0 top-0 h-3 w-full overflow-visible"
        viewBox={`0 0 ${count * 100} 32`}
        preserveAspectRatio="none"
      >
        <path
          d={wire}
          fill="none"
          stroke="#2f5d3a"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className="xmas-bulb absolute top-[5px] -translate-x-1/2"
          style={{
            left: `${((i + 0.5) / count) * 100}%`,
            color: BULB_COLORS[i % BULB_COLORS.length],
            animationDelay: `${(i % BULB_COLORS.length) * 0.35}s`,
          }}
        >
          <svg viewBox="0 0 10 16" width="8" height="13">
            <rect x="3" y="0" width="4" height="4" rx="1" fill="#4b5a4f" />
            <path
              d="M5 3 C 9 6 9 11 5 15 C 1 11 1 6 5 3 Z"
              fill="currentColor"
            />
          </svg>
        </span>
      ))}
    </div>
  );
}

/** Pisca-pisca pendurado logo abaixo do menu. */
export function StringLights() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-full h-6"
    >
      <LightsRow count={10} className="sm:hidden" />
      <LightsRow count={24} className="hidden sm:block" />
    </div>
  );
}
