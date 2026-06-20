// Route-layer helper: classify a react-query doc error as "missing" so the
// route can render its notFound UI instead of a raw error. A record that is
// absent (404), forbidden (403), or owned by another tenant is, from the
// user's point of view, simply not there.

import { FrappeResourceError, TenantMismatchError } from "@sekolahpro/api-client";

/** True when a useResourceDoc error means the record should render as not-found
 *  (404 / 403 / cross-tenant) rather than as an error banner. */
export function isMissingResource(err: unknown): boolean {
  if (err instanceof TenantMismatchError) return true;
  if (err instanceof FrappeResourceError) return err.status === 404 || err.status === 403;
  return false;
}
