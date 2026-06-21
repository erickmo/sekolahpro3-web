import {
  ACTIVE_KOPERASI_HEADER,
  ACTIVE_SEKOLAH_HEADER,
  configureResource,
  type ActiveTenant,
} from "./frappeResource";

type Config = {
  baseUrl: string;
  csrfToken?: string;
  getActiveSekolah?: () => string | null | undefined;
  /** Full tenant descriptor — wins over getActiveSekolah when provided. */
  getActiveTenant?: () => ActiveTenant | null | undefined;
};

let config: Config = { baseUrl: "" };

export function configure(next: Partial<Config>) {
  config = { ...config, ...next };
  configureResource(next);
}

export function setCsrfToken(token: string | undefined) {
  const { csrfToken: _omit, ...rest } = config;
  config = token === undefined ? rest : { ...rest, csrfToken: token };
  if (token === undefined) configureResource({});
  else configureResource({ csrfToken: token });
}

export class FrappeError extends Error {
  constructor(public status: number, public payload: unknown, message: string) {
    super(message);
    this.name = "FrappeError";
  }
}

export async function frappeFetch<T = unknown>(
  method: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  const url = `${config.baseUrl}/api/method/${method}`;
  const tenant = config.getActiveTenant?.() ?? null;
  const sekolah =
    tenant?.kind === "koperasi"
      ? (tenant.schools[0] ?? "")
      : (tenant?.sekolah ?? config.getActiveSekolah?.() ?? "");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Frappe-CSRF-Token": config.csrfToken ?? "",
    [ACTIVE_SEKOLAH_HEADER]: sekolah,
    [ACTIVE_KOPERASI_HEADER]: tenant?.kind === "koperasi" ? tenant.koperasi : "",
  };

  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify(args),
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new FrappeError(res.status, body, `Frappe ${method} failed: ${res.status}`);
  }

  return (body as { message: T }).message;
}

/** Upload a file via Frappe's /api/method/upload_file, reusing the shared auth +
 *  active-tenant headers. Returns the stored file's URL. Content-Type is left
 *  unset so the browser writes the multipart boundary. */
export async function uploadFile(
  file: File,
  opts: { isPrivate?: boolean } = {},
): Promise<{ file_url: string; file_name: string }> {
  const url = `${config.baseUrl}/api/method/upload_file`;
  const tenant = config.getActiveTenant?.() ?? null;
  const sekolah =
    tenant?.kind === "koperasi"
      ? (tenant.schools[0] ?? "")
      : (tenant?.sekolah ?? config.getActiveSekolah?.() ?? "");
  const form = new FormData();
  form.append("file", file, file.name);
  form.append("is_private", opts.isPrivate === false ? "0" : "1");

  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      "X-Frappe-CSRF-Token": config.csrfToken ?? "",
      [ACTIVE_SEKOLAH_HEADER]: sekolah,
      [ACTIVE_KOPERASI_HEADER]: tenant?.kind === "koperasi" ? tenant.koperasi : "",
    },
    body: form,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new FrappeError(res.status, body, `Upload failed: ${res.status}`);
  }
  return (body as { message: { file_url: string; file_name: string } }).message;
}
