// Thin wrapper over @sekolahpro/api-client for the public situs SPA. All situs
// endpoints are `allow_guest=True`; Frappe skips CSRF for the Guest session, so
// the empty CSRF token from frappeFetch is fine. Callers wrap this in try/catch
// to fall back to the offline demo dataset when the backend is unreachable.

import { configure, frappeFetch } from "@sekolahpro/api-client";

let configured = false;

export function ensureConfigured(): void {
  if (configured) return;
  configure({ baseUrl: (import.meta.env.VITE_API_BASE as string | undefined) ?? "" });
  configured = true;
}

export async function call<T>(method: string, args: Record<string, unknown> = {}): Promise<T> {
  ensureConfigured();
  return frappeFetch<T>(`sekolahpro.api.${method}`, args);
}
