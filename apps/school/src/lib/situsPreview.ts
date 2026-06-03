// Build the public situs URL for a school. When a subdomain is set we use the
// real host; otherwise fall back to the situs dev/preview app with a ?sekolah
// override so admins can preview an unpublished/no-domain site.

const SITUS_URL = (import.meta.env.VITE_SITUS_URL as string | undefined) ?? "http://localhost:5184";
const MAIN_DOMAIN = (import.meta.env.VITE_SITUS_MAIN_DOMAIN as string | undefined) ?? "sekolahpro.id";

export function situsPreviewUrl(subdomain: string | null, sekolah: string): string {
  if (subdomain) return `https://${subdomain}.${MAIN_DOMAIN}`;
  return `${SITUS_URL}/?sekolah=${encodeURIComponent(sekolah)}`;
}

/**
 * Flat snake_case subset of unsaved Situs edits to preview. Mirrors the renderer's
 * PreviewDraft (apps/situs lib/site.ts). Only fields the overlay supports.
 */
export interface SitusPreviewDraft {
  template?: string | null;
  brand_color?: string | null;
  brand_color_2?: string | null;
  tagline?: string | null;
  hero_judul?: string | null;
  hero_subjudul?: string | null;
  hero_eyebrow?: string | null;
  layout_blocks?: unknown[];
}

/**
 * Build a preview-app URL carrying an unsaved draft in `?preview=`. Always targets
 * the situs preview app (never the live subdomain) so the draft is rendered
 * same-origin without leaking unpublished edits to the public domain.
 */
export function buildPreviewUrl(sekolah: string, draft: SitusPreviewDraft): string {
  const params = new URLSearchParams({ sekolah, preview: JSON.stringify(draft) });
  return `${SITUS_URL}/?${params.toString()}`;
}
