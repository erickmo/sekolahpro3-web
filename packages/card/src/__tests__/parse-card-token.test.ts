import { describe, it, expect } from "vitest";
import { parseCardToken } from "../parse-card-token";
import { CardReaderError } from "../types";

function encode(obj: unknown) {
  return btoa(JSON.stringify(obj)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

describe("parseCardToken", () => {
  const future = Math.floor(Date.now() / 1000) + 60;

  it("decodes valid token", () => {
    const raw = encode({ kartu_id: "K-001", nonce: "abc", exp: future, hmac: "sig" });
    const t = parseCardToken(raw);
    expect(t.kartu_id).toBe("K-001");
    expect(t.exp).toBe(future);
    expect(t.raw).toBe(raw);
  });

  it("rejects malformed base64", () => {
    expect(() => parseCardToken("!!!not-base64!!!")).toThrow(CardReaderError);
  });

  it("rejects missing fields", () => {
    const raw = encode({ kartu_id: "K-001" });
    expect(() => parseCardToken(raw)).toThrow(/PARSE_FAILED/);
  });

  it("rejects expired token", () => {
    const past = Math.floor(Date.now() / 1000) - 5;
    const raw = encode({ kartu_id: "K-001", nonce: "abc", exp: past, hmac: "sig" });
    expect(() => parseCardToken(raw)).toThrow(/TIMEOUT/);
  });
});
