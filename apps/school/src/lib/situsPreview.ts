// Build the public situs URL for a school. When a subdomain is set we use the
// real host; otherwise fall back to the situs dev/preview app with a ?sekolah
// override so admins can preview an unpublished/no-domain site.

const SITUS_URL = (import.meta.env.VITE_SITUS_URL as string | undefined) ?? "http://localhost:5184";
const MAIN_DOMAIN = (import.meta.env.VITE_SITUS_MAIN_DOMAIN as string | undefined) ?? "sekolahpro.id";

export function situsPreviewUrl(subdomain: string | null, sekolah: string): string {
  if (subdomain) return `https://${subdomain}.${MAIN_DOMAIN}`;
  return `${SITUS_URL}/?sekolah=${encodeURIComponent(sekolah)}`;
}
