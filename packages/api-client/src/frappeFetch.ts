import { configureResource } from "./frappeResource";

type Config = { baseUrl: string; csrfToken?: string };

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
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Frappe-CSRF-Token": config.csrfToken ?? "",
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
