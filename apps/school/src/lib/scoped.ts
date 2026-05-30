// URL scope helpers — convert bare paths into `/sch/$sekolah/...` shaped paths
// suitable for TanStack Router's typed `<Link to params>` and
// `navigate({ to, params })` calls.
//
// The renamed dashboard routes all live under the `/sch/$sekolah` segment, where
// `$sekolah` is the slug param. Components outside that subtree (the root
// layout) and shared scaffolds receive a slug at the call-site and use these
// helpers to build correct, scoped link targets.

const SCOPE_PREFIX = "/sch/$sekolah";
const KOP_SCOPE_PREFIX = "/kop/$sekolah";

// Koperasi shell mirror of `scopedTo` — builds `/kop/$sekolah/...` targets.
// The koperasi dashboard lives under its own top-level segment with a
// koperasi-only sidebar; it shares the `sekolah` param (= kode_pendek).
export function kopScopedTo(sekolah: string | undefined, path: string): string {
  if (!sekolah) return path;
  if (path === "/" || path === "") return KOP_SCOPE_PREFIX;
  return path.startsWith("/") ? `${KOP_SCOPE_PREFIX}${path}` : `${KOP_SCOPE_PREFIX}/${path}`;
}

// Live pathname for koperasi active-state comparisons (`/kop/<slug>/...`).
export function kopActivePath(sekolah: string | undefined, path: string): string {
  if (!sekolah) return path;
  if (path === "/" || path === "") return `/kop/${sekolah}`;
  return path.startsWith("/") ? `/kop/${sekolah}${path}` : `/kop/${sekolah}/${path}`;
}

// Build the `to` prop for a Link/navigate call. If `sekolah` is unset, fall
// back to the bare path (defensive: shouldn't happen once an active school
// is selected; lets callers degrade gracefully instead of crashing).
export function scopedTo(sekolah: string | undefined, path: string): string {
  if (!sekolah) return path;
  if (path === "/" || path === "") return SCOPE_PREFIX;
  return path.startsWith("/") ? `${SCOPE_PREFIX}${path}` : `${SCOPE_PREFIX}/${path}`;
}

// Build the `params` prop for a scoped Link/navigate call. Always returns a
// defined object containing `{ sekolah }` (plus any caller-provided extras).
// Callers that may not have a slug should branch on it BEFORE rendering the
// Link so this helper isn't called with an empty string.
export function scopedParams<T extends Record<string, string>>(
  sekolah: string,
  extra?: T,
): T & { sekolah: string } {
  return { sekolah, ...(extra ?? ({} as T)) };
}

// Build the live pathname that would match a scoped route, for active-state
// comparisons in sidebars (`location.pathname === scopedActivePath(slug, "/siswa")`).
export function scopedActivePath(sekolah: string | undefined, path: string): string {
  if (!sekolah) return path;
  if (path === "/" || path === "") return `/sch/${sekolah}`;
  return path.startsWith("/") ? `/sch/${sekolah}${path}` : `/sch/${sekolah}/${path}`;
}

// Build the props pair `{ to, params? }` for a TanStack Link/navigate call,
// already cast to `never` to bypass typed-route param-completeness checks.
// Spread the result onto a Link/navigate call — when `sekolah` is undefined
// the `params` key is omitted entirely (required to satisfy
// `exactOptionalPropertyTypes`).
//
// Usage: `<Link {...scopedLinkProps(sekolah, "/siswa")} className="..." />`
export function scopedLinkProps(
  sekolah: string | undefined,
  path: string,
): { to: never } | { to: never; params: never } {
  const to = scopedTo(sekolah, path) as never;
  if (!sekolah) return { to };
  return { to, params: scopedParams(sekolah) as never };
}
