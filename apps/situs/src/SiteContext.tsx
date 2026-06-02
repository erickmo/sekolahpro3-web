// Provides the resolved per-school SiteData to the whole tree. SiteLayout
// resolves once and wraps its outlet in this provider; sections/pages read it.

import { createContext, useContext, type ReactNode } from "react";
import type { SiteData } from "./types";

const SiteCtx = createContext<SiteData | null>(null);

export function SiteProvider({ value, children }: { value: SiteData; children: ReactNode }) {
  return <SiteCtx.Provider value={value}>{children}</SiteCtx.Provider>;
}

/** Read the resolved site. Throws if used outside SiteProvider (a bug). */
export function useSite(): SiteData {
  const ctx = useContext(SiteCtx);
  if (!ctx) throw new Error("useSite must be used within <SiteProvider>");
  return ctx;
}
