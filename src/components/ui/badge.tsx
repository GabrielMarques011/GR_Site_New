import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

type Variant = "lilac" | "success" | "danger" | "warning" | "neutral";

const variantClasses: Record<Variant, string> = {
  lilac: "bg-lilac-100 text-lilac-800",
  success: "bg-success-100 text-success-600",
  danger: "bg-danger-100 text-danger-600",
  warning: "bg-warning-100 text-warning-600",
  neutral: "bg-ink-100 text-ink-700",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

export function Badge({
  className,
  variant = "neutral",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
