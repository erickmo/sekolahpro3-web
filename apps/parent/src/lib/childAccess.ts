import { FrappeError } from "@sekolahpro/api-client";

/** Query-key prefix shared by every per-child Frappe method. */
export const CHILD_QUERY_PREFIX = "sekolahpro.api.parent.child_";

const FORBIDDEN_STATUS = 403;

/** Message shown when the parent hits a child they are not authorized for. */
export const FORBIDDEN_NOTICE = "Tidak punya akses ke siswa ini";

/** True when the query key belongs to a per-child Frappe method. */
export function isChildQueryKey(queryKey: unknown): boolean {
  return (
    Array.isArray(queryKey) &&
    typeof queryKey[0] === "string" &&
    queryKey[0].startsWith(CHILD_QUERY_PREFIX)
  );
}

/** A FrappeError 403 surfaced by a per-child fetch. */
export function isForbidden(error: unknown): boolean {
  return error instanceof FrappeError && error.status === FORBIDDEN_STATUS;
}

/** Pull the `nis` argument out of a per-child query key, if present. */
export function nisFromQueryKey(queryKey: unknown): string | null {
  if (!Array.isArray(queryKey)) return null;
  const args = queryKey[1];
  if (args && typeof args === "object" && "nis" in args) {
    const nis = (args as { nis: unknown }).nis;
    return typeof nis === "string" ? nis : null;
  }
  return null;
}
