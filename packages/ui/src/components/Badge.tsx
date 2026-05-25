import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

type Tone = "neutral" | "brand" | "success" | "warning" | "danger";

interface Props extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  dot?: boolean;
}

const toneMap: Record<Tone, string> = {
  neutral: "bg-muted text-fg/80",
  brand: "bg-brand/10 text-brand",
  success: "bg-emerald-500/10 text-emerald-700",
  warning: "bg-amber-500/15 text-amber-700",
  danger: "bg-danger/10 text-danger",
};

const dotMap: Record<Tone, string> = {
  neutral: "bg-fg/40",
  brand: "bg-brand",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-danger",
};

export function Badge({ tone = "neutral", dot, className, children, ...rest }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        toneMap[tone],
        className,
      )}
      {...rest}
    >
      {dot ? <span className={cn("h-1.5 w-1.5 rounded-full", dotMap[tone])} /> : null}
      {children}
    </span>
  );
}
