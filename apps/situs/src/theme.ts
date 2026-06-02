// Per-tenant theming: inject the school's brand colors as CSS custom properties
// on the document root. Templates + sections reference ONLY these variables
// (never hardcoded hex), so a school's palette flows through every template.

import type { SiteBrand, SiteTheme } from "./types";

const FALLBACK_BRAND = "#1d4ed8";
const FALLBACK_BRAND_2 = "#f59e0b";

/** Brand-gradient band/panel background (brand → brand-2) shared by the
 *  Statistik and Cta blocks. Color flows from the per-tenant --situs-brand* vars. */
export const BRAND_GRADIENT = "linear-gradient(135deg, var(--situs-brand) 0%, var(--situs-brand-2) 100%)";

/** Normalize a possibly-empty color to a safe hex string. */
function normalize(color: string | null | undefined, fallback: string): string {
  const c = (color ?? "").trim();
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(c) ? c : fallback;
}

/** Parse #rgb/#rrggbb into [r,g,b] (0-255). */
export function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((x) => x + x).join("");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Pick black/white text for contrast against a background hex (WCAG-ish). */
export function readableOn(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  // Relative luminance approximation.
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.62 ? "#111827" : "#ffffff";
}

export interface ThemeVars {
  "--situs-brand": string;
  "--situs-brand-2": string;
  "--situs-brand-fg": string;
  "--situs-brand-rgb": string;
}

export function computeThemeVars(brand: SiteBrand): ThemeVars {
  const color = normalize(brand.color, FALLBACK_BRAND);
  const color2 = normalize(brand.color2, FALLBACK_BRAND_2);
  const [r, g, b] = hexToRgb(color);
  return {
    "--situs-brand": color,
    "--situs-brand-2": color2,
    "--situs-brand-fg": readableOn(color),
    "--situs-brand-rgb": `${r}, ${g}, ${b}`,
  };
}

/**
 * Per-school template tokens (radius / fonts / shadow / section style) sourced
 * from Template Situs. Only non-empty tokens are emitted so skins.css keeps
 * supplying the per-template default for any token the school left blank.
 */
export function computeTemplateVars(theme: SiteTheme): Record<string, string> {
  const vars: Record<string, string> = {};
  if (theme.radius) {
    vars["--situs-radius"] = theme.radius;
    vars["--situs-radius-lg"] = theme.radius;
  }
  if (theme.fontHeading) vars["--situs-heading-font"] = theme.fontHeading;
  if (theme.fontBody) vars["--situs-body-font"] = theme.fontBody;
  if (theme.shadow) vars["--situs-card-shadow"] = theme.shadow;
  // Always present (enum): drives [data-section-style] section chrome.
  vars["--situs-section-style"] = theme.sectionStyle;
  return vars;
}

/** Apply theme vars to the document root (no-op in SSR/test without document). */
export function applyTheme(brand: SiteBrand, theme?: SiteTheme): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  for (const [key, value] of Object.entries(computeThemeVars(brand))) {
    root.style.setProperty(key, value);
  }
  if (theme) {
    for (const [key, value] of Object.entries(computeTemplateVars(theme))) {
      root.style.setProperty(key, value);
    }
  }
}
