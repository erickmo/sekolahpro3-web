import { cn } from "../lib/cn";

interface Props {
  name?: string | null;
  src?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "h-7 w-7 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-12 w-12 text-sm",
};

function initials(name?: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

export function Avatar({ name, src, size = "md", className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold text-white overflow-hidden ring-2 ring-bg",
        "bg-gradient-to-br from-brand to-violet-500",
        sizeMap[size],
        className,
      )}
    >
      {src ? (
        <img src={src} alt={name ?? ""} className="h-full w-full object-cover" />
      ) : (
        <span>{initials(name)}</span>
      )}
    </span>
  );
}
