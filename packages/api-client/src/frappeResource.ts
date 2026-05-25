import { useMutation, useQuery, type UseQueryOptions } from "@tanstack/react-query";

type Config = { baseUrl: string; csrfToken?: string };

let cfg: Config = { baseUrl: "" };

export function configureResource(next: Partial<Config>) {
  cfg = { ...cfg, ...next };
}

export class FrappeResourceError extends Error {
  constructor(public status: number, public payload: unknown, msg: string) {
    super(msg);
    this.name = "FrappeResourceError";
  }
}

function buildHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Frappe-CSRF-Token": cfg.csrfToken ?? "",
    ...(extra ?? {}),
  };
}

function buildUrl(path: string, query?: Record<string, unknown>): string {
  const base = `${cfg.baseUrl}/api/resource/${path}`;
  if (!query) return base;
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue;
    sp.set(k, typeof v === "string" ? v : JSON.stringify(v));
  }
  const s = sp.toString();
  return s ? `${base}?${s}` : base;
}

async function req<T>(method: string, url: string, body?: unknown): Promise<T> {
  const init: RequestInit = {
    method,
    credentials: "include",
    headers: buildHeaders(),
  };
  if (body !== undefined) init.body = JSON.stringify(body);
  const res = await fetch(url, init);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new FrappeResourceError(res.status, json, `Frappe ${method} ${url} failed: ${res.status}`);
  }
  return (json as { data: T }).data;
}

export interface ListParams {
  fields?: string[];
  filters?: Array<[string, string, unknown]> | Record<string, unknown>;
  order_by?: string;
  limit_start?: number;
  limit_page_length?: number;
  or_filters?: Array<[string, string, unknown]>;
}

export function listResource<T = Record<string, unknown>>(doctype: string, params: ListParams = {}): Promise<T[]> {
  const q: Record<string, unknown> = {};
  if (params.fields) q["fields"] = params.fields;
  if (params.filters) q["filters"] = params.filters;
  if (params.or_filters) q["or_filters"] = params.or_filters;
  if (params.order_by) q["order_by"] = params.order_by;
  if (params.limit_start !== undefined) q["limit_start"] = params.limit_start;
  if (params.limit_page_length !== undefined) q["limit_page_length"] = params.limit_page_length;
  return req<T[]>("GET", buildUrl(doctype, q));
}

export function getResource<T = Record<string, unknown>>(doctype: string, name: string): Promise<T> {
  return req<T>("GET", buildUrl(`${doctype}/${encodeURIComponent(name)}`));
}

export function createResource<T = Record<string, unknown>>(doctype: string, doc: Record<string, unknown>): Promise<T> {
  return req<T>("POST", buildUrl(doctype), doc);
}

export function updateResource<T = Record<string, unknown>>(doctype: string, name: string, patch: Record<string, unknown>): Promise<T> {
  return req<T>("PUT", buildUrl(`${doctype}/${encodeURIComponent(name)}`), patch);
}

export function deleteResource(doctype: string, name: string): Promise<unknown> {
  return req<unknown>("DELETE", buildUrl(`${doctype}/${encodeURIComponent(name)}`));
}

export function useResourceList<T = Record<string, unknown>>(
  doctype: string,
  params: ListParams = {},
  options: Omit<UseQueryOptions<T[]>, "queryKey" | "queryFn"> = {},
) {
  return useQuery<T[]>({
    queryKey: ["resource:list", doctype, params],
    queryFn: () => listResource<T>(doctype, params),
    ...options,
  });
}

export function useResourceDoc<T = Record<string, unknown>>(
  doctype: string,
  name: string | undefined,
  options: Omit<UseQueryOptions<T>, "queryKey" | "queryFn" | "enabled"> = {},
) {
  return useQuery<T>({
    queryKey: ["resource:doc", doctype, name],
    queryFn: () => getResource<T>(doctype, name!),
    enabled: !!name,
    ...options,
  });
}

export function useResourceCreate<T = Record<string, unknown>>(doctype: string) {
  return useMutation<T, Error, Record<string, unknown>>({
    mutationFn: (doc) => createResource<T>(doctype, doc),
  });
}

export function useResourceUpdate<T = Record<string, unknown>>(doctype: string) {
  return useMutation<T, Error, { name: string; patch: Record<string, unknown> }>({
    mutationFn: ({ name, patch }) => updateResource<T>(doctype, name, patch),
  });
}

export function useResourceDelete(doctype: string) {
  return useMutation<unknown, Error, string>({
    mutationFn: (name) => deleteResource(doctype, name),
  });
}
