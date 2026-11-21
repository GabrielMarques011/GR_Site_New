import type { HTMLAttributes } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";

import { cn } from "@/lib/utils/cn";

type Variant = "success" | "danger" | "info" | "warning";

const variantConfig: Record<Variant, { classes: string; icon: typeof Info }> = {
  success: { classes: "bg-success-100 text-success-600", icon: CheckCircle2 },
  danger: { classes: "bg-danger-100 text-danger-600", icon: AlertCircle },
  info: { classes: "bg-lilac-100 text-lilac-800", icon: Info },
  warning: { classes: "bg-warning-100 text-warning-600", icon: AlertTriangle },
};

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
}

export function Alert({
  className,
  variant = "info",
  children,
  ...props
}: AlertProps) {
  const { classes, icon: Icon } = variantConfig[variant];

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-medium",
        classes,
        className,
      )}
      {...props}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  );
}
