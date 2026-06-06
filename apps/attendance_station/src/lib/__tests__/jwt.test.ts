// ABS-002
import { ed25519 } from "@noble/curves/ed25519";
import { describe, expect, it } from "vitest";

import { verifyQrToken } from "../jwt";

const KID = "k1";
const SKEW_SEC = 60;
const NOW_SEC = 1_700_000_000;

/** Base64url-encode a UTF-8 string for building test JWT segments. */
function b64url(input: string): string {
  return Buffer.from(input, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Base64url-encode raw bytes (used for the signature segment). */
function b64urlBytes(bytes: Uint8Array): string {
  return Buffer.from(bytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Build a signed Ed25519 QR token from header + claims using a secret key. */
function signToken(
  header: Record<string, unknown>,
  claims: Record<string, unknown>,
  secretKey: Uint8Array,
): string {
  const h = b64url(JSON.stringify(header));
  const p = b64url(JSON.stringify(claims));
  const sig = ed25519.sign(new TextEncoder().encode(`${h}.${p}`), secretKey);
  return `${h}.${p}.${b64urlBytes(sig)}`;
}

describe("verifyQrToken", () => {
  const secretKey = ed25519.utils.randomPrivateKey();
  const publicKey = ed25519.getPublicKey(secretKey);
  const jwks = { [KID]: publicKey };

  it("returns claims for a valid, unexpired token", () => {
    // ABS-002 | well-formed signature + future exp -> claims pass through
    const token = signToken(
      { alg: "EdDSA", kid: KID },
      { sub: "SISWA-1", exp: NOW_SEC + 300, sch: "SCH-1", jti: "abc" },
      secretKey,
    );

    const claims = verifyQrToken(token, jwks, NOW_SEC, SKEW_SEC);

    expect(claims.sub).toBe("SISWA-1");
  });

  it("throws on a tampered signature", () => {
    // ABS-002 | flipping a payload byte invalidates the Ed25519 signature
    const token = signToken(
      { alg: "EdDSA", kid: KID },
      { sub: "SISWA-1", exp: NOW_SEC + 300, sch: "SCH-1", jti: "abc" },
      secretKey,
    );
    const [h, p, s] = token.split(".");
    const tampered = `${h}.${p}x.${s}`;

    expect(() => verifyQrToken(tampered, jwks, NOW_SEC, SKEW_SEC)).toThrow(
      /invalid signature/i,
    );
  });

  it("throws when the token is expired beyond skew", () => {
    // ABS-002 | exp is 120s in the past, skew only 60s
    const token = signToken(
      { alg: "EdDSA", kid: KID },
      { sub: "SISWA-1", exp: NOW_SEC - 120, sch: "SCH-1", jti: "abc" },
      secretKey,
    );

    expect(() => verifyQrToken(token, jwks, NOW_SEC, SKEW_SEC)).toThrow(
      /expired/i,
    );
  });

  it("throws for an unknown kid", () => {
    // ABS-002 | header references a kid absent from the JWKS
    const token = signToken(
      { alg: "EdDSA", kid: "unknown" },
      { sub: "SISWA-1", exp: NOW_SEC + 300, sch: "SCH-1", jti: "abc" },
      secretKey,
    );

    expect(() => verifyQrToken(token, jwks, NOW_SEC, SKEW_SEC)).toThrow(
      /unknown kid/i,
    );
  });

  it("throws on a malformed token", () => {
    // ABS-002 | not three dot-separated segments
    expect(() => verifyQrToken("only.two", jwks, NOW_SEC, SKEW_SEC)).toThrow(
      /malformed/i,
    );
  });
});
