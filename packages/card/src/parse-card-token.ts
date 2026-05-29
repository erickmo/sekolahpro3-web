import { CardReaderError, type CardToken } from "./types";

function b64urlDecode(s: string): string {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  try {
    return atob(b64);
  } catch {
    throw new CardReaderError("PARSE_FAILED", "invalid base64");
  }
}

export function parseCardToken(raw: string): CardToken {
  let json: unknown;
  try {
    json = JSON.parse(b64urlDecode(raw));
  } catch {
    throw new CardReaderError("PARSE_FAILED", "invalid json");
  }
  if (typeof json !== "object" || json === null) {
    throw new CardReaderError("PARSE_FAILED", "not object");
  }
  const o = json as Record<string, unknown>;
  if (
    typeof o.kartu_id !== "string" ||
    typeof o.nonce !== "string" ||
    typeof o.exp !== "number" ||
    typeof o.hmac !== "string"
  ) {
    throw new CardReaderError("PARSE_FAILED", "missing fields");
  }
  const now = Math.floor(Date.now() / 1000);
  if (o.exp < now) throw new CardReaderError("TIMEOUT", "token expired");
  return { kartu_id: o.kartu_id, nonce: o.nonce, exp: o.exp, hmac: o.hmac, raw };
}
