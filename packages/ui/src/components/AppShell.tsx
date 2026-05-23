import type { ReactNode } from "react";
import { cn } from "../lib/cn";

interface Props {
  sidebar: ReactNode;
  topbar: ReactNode;
  children: ReactNode;
  className?: string;
}

export function AppShell({ sidebar, topbar, children, className }: Props) {
  return (
    <div className={cn("min-h-screen grid grid-cols-[240px_1fr] grid-rows-[56px_1fr] bg-muted", className)}>
      <aside className="row-span-2 border-r border-border bg-bg">{sidebar}</aside>
      <header className="border-b border-border bg-bg flex items-center px-6">{topbar}</header>
      <main className="p-6">{children}</main>
    </div>
  );
}
