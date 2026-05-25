import type { ReactNode } from "react";
import { cn } from "../lib/cn";

interface Props {
  sidebar: ReactNode;
  topbar: ReactNode;
  brand?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function AppShell({ sidebar, topbar, brand, children, className }: Props) {
  return (
    <div
      className={cn(
        "min-h-screen grid grid-cols-[260px_1fr] grid-rows-[64px_1fr]",
        "bg-[hsl(220_20%_97%)] text-fg font-sans",
        className,
      )}
    >
      <aside className="row-span-2 border-r border-border bg-bg flex flex-col">
        {brand ? (
          <div className="h-16 px-5 flex items-center border-b border-border">{brand}</div>
        ) : null}
        <div className="flex-1 overflow-y-auto py-4">{sidebar}</div>
      </aside>
      <header className="sticky top-0 z-10 border-b border-border bg-bg/80 backdrop-blur flex items-center px-6">
        {topbar}
      </header>
      <main className="p-6 lg:p-8">{children}</main>
    </div>
  );
}
