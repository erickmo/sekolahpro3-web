import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "../lib/cn";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          "min-h-[80px] w-full rounded-md border border-border bg-bg px-3 py-2 text-sm",
          "focus:outline-none focus:ring-2 focus:ring-brand",
          "disabled:opacity-50 disabled:cursor-not-allowed resize-y",
          className,
        )}
        {...rest}
      />
    );
  },
);
