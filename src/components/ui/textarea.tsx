import { type TextareaHTMLAttributes, forwardRef } from "react";

import { cn } from "@/lib/utils/cn";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "focus-ring w-full rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm",
        "placeholder:text-ink-500 disabled:cursor-not-allowed disabled:bg-ink-50",
        className,
      )}
      {...props}
    />
  );
});
