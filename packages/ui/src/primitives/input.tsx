import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../lib/cn";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "h-10 w-full rounded-md border border-border bg-bg px-3 text-sm",
          "focus:outline-none focus:ring-2 focus:ring-brand",
          className,
        )}
        {...rest}
      />
    );
  },
);
