const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export class ApiError extends Error {
  constructor(public status: number, public body: unknown, message: string) {
    super(message);
  }
}

export async function apiCall<T>(
  method: string,
  endpoint: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${BASE_URL}/api/method/${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Frappe-CSRF-Token": "guest",
    },
    credentials: "omit",
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      (json as { exception?: string; message?: string }).exception ??
      (json as { message?: string }).message ??
      `HTTP ${res.status}`;
    throw new ApiError(res.status, json, msg);
  }
  return (json as { message: T }).message;
}
