import { type InputHTMLAttributes, forwardRef } from "react";

import { cn } from "@/lib/utils/cn";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "focus-ring h-10 w-full rounded-lg border border-ink-300 bg-white px-3 text-sm",
        "placeholder:text-ink-500 disabled:cursor-not-allowed disabled:bg-ink-50",
        className,
      )}
      {...props}
    />
  );
});
