/**
 * frappeError — turn raw Frappe error payloads into humane Bahasa Indonesia.
 *
 * Layer: client infrastructure. Shared by every form/mutation that catches a
 * `FrappeResourceError` / `FrappeError` so the UI never shows technical noise
 * like "Frappe POST .../Lantai failed: 417" or a Python traceback.
 *
 * Frappe returns the human-facing reason inside the JSON body, not the HTTP
 * status line:
 *   - `_server_messages`: JSON-encoded array of JSON-encoded {message,title}
 *   - `exc_type`: e.g. "MandatoryError", "ValidationError", "DuplicateEntryError"
 */

// Strip the leading "Error: " prefix Frappe prepends to server messages.
const SERVER_MESSAGE_PREFIX = /^Error:\s*/i;

// Frappe MandatoryError message: "Value missing for {Doctype}: {Field Label}".
const MANDATORY_PATTERN = /Value missing for .+?:\s*(.+)$/i;

// Frappe DuplicateEntryError message often: "{Doctype} {name} already exists".
const DUPLICATE_PATTERN = /already exists/i;

// Fallback copy keyed by Frappe's exc_type when no server message is parseable.
const EXC_TYPE_FALLBACK: Record<string, string> = {
  MandatoryError: "Ada kolom wajib yang belum diisi.",
  ValidationError: "Data tidak valid. Periksa kembali isian Anda.",
  DuplicateEntryError: "Data dengan nilai unik yang sama sudah ada.",
  PermissionError: "Anda tidak punya izin untuk tindakan ini.",
  LinkValidationError: "Ada data terkait yang tidak ditemukan.",
};

type FrappePayload = {
  exc_type?: string;
  _server_messages?: string;
};

/** Pull the first human message out of Frappe's double-encoded _server_messages. */
function firstServerMessage(payload: FrappePayload): string | null {
  const raw = payload._server_messages;
  if (!raw) return null;
  try {
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr) || arr.length === 0) return null;
    const head = arr[0];
    const first = typeof head === "string" ? (JSON.parse(head) as { message?: string }) : null;
    const msg = first?.message;
    return typeof msg === "string" && msg.trim() ? msg.trim() : null;
  } catch {
    return null;
  }
}

/** Map a cleaned server message to humane Indonesian copy where we can. */
function humanizeServerMessage(message: string): string {
  const clean = message.replace(SERVER_MESSAGE_PREFIX, "").trim();
  const mandatory = clean.match(MANDATORY_PATTERN);
  const field = mandatory?.[1]?.trim();
  if (field) return `${field} wajib diisi.`;
  if (DUPLICATE_PATTERN.test(clean)) return "Data dengan nilai unik yang sama sudah ada.";
  return clean;
}

function getPayload(err: unknown): FrappePayload | null {
  const p = (err as { payload?: unknown } | null)?.payload;
  return p && typeof p === "object" ? (p as FrappePayload) : null;
}

/**
 * Returns humane Bahasa Indonesia for a caught Frappe error, or `null` when the
 * error is not a recognizable Frappe payload (caller should keep its own
 * fallback string in that case).
 */
export function humanizeFrappeError(err: unknown): string | null {
  const payload = getPayload(err);
  if (!payload) return null;
  const serverMessage = firstServerMessage(payload);
  if (serverMessage) return humanizeServerMessage(serverMessage);
  const fallback = payload.exc_type ? EXC_TYPE_FALLBACK[payload.exc_type] : undefined;
  return fallback ?? null;
}
