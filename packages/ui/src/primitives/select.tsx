import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "../lib/cn";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...rest }, ref) {
    return (
      <select
        ref={ref}
        className={cn(
          "h-10 w-full rounded-md border border-border bg-bg px-3 pr-8 text-sm appearance-none",
          "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22 fill=%22%236b7280%22><path d=%22M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z%22/></svg>')]",
          "bg-no-repeat bg-[right_0.5rem_center] bg-[length:1.25rem]",
          "focus:outline-none focus:ring-2 focus:ring-brand",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className,
        )}
        {...rest}
      >
        {children}
      </select>
    );
  },
);
