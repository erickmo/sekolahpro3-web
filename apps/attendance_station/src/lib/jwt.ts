/**
 * Local Ed25519 verification of QR attendance tokens.
 *
 * Layer: domain utility (pure). Performs NO network or storage access — the
 * caller injects the JWKS (kid -> raw public key). This lets a station verify
 * scanned QR tokens fully offline once it has synced the key set.
 */
import { ed25519 } from "@noble/curves/ed25519";

import { withinSkew } from "./time";

/** Default key id used when a token header omits `kid`. */
const DEFAULT_KID = "k1";

/** Number of dot-separated segments in a compact JWT (header.payload.sig). */
const JWT_SEGMENTS = 3;

/** Base of the base64 padding alignment used to restore stripped `=`. */
const BASE64_GROUP = 4;

/** Decoded QR token claims. Extra issuer-specific fields are allowed. */
export interface Claims {
  /** Subject id (e.g. the student record name). */
  sub: string;
  /** Expiry as epoch seconds. */
  exp: number;
  /** School / tenant id the token was minted for. */
  sch: string;
  /** Unique token id, used for replay detection downstream. */
  jti: string;
  [key: string]: unknown;
}

/** JWT header fields we read; only `kid` matters for key selection. */
interface TokenHeader {
  kid?: string;
  [key: string]: unknown;
}

/**
 * Decode a base64url segment to a UTF-8 string, restoring stripped padding.
 *
 * @param segment - a base64url-encoded token segment.
 * @returns the decoded UTF-8 string.
 */
function decodeBase64Url(segment: string): string {
  const normalized = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (BASE64_GROUP - (normalized.length % BASE64_GROUP)) % BASE64_GROUP;
  const padded = normalized + "=".repeat(padLength);
  return atob(padded);
}

/**
 * Decode a base64url segment to raw bytes (used for the signature segment).
 *
 * @param segment - a base64url-encoded token segment.
 * @returns the decoded bytes.
 */
function decodeBase64UrlBytes(segment: string): Uint8Array {
  const binary = decodeBase64Url(segment);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Select the verifying public key for a token header from the JWKS.
 *
 * @param header - the decoded token header.
 * @param jwks - mapping of key id to raw Ed25519 public key bytes.
 * @returns the matching public key.
 * @throws Error("unknown kid") when no key matches the header's kid.
 */
function selectKey(header: TokenHeader, jwks: Record<string, Uint8Array>): Uint8Array {
  const kid = header.kid ?? DEFAULT_KID;
  const key = jwks[kid];
  if (!key) {
    throw new Error(`unknown kid: ${kid}`);
  }
  return key;
}

/**
 * Verify a QR token's Ed25519 signature and expiry against an injected JWKS.
 *
 * @param token - compact JWT string `header.payload.signature` (base64url).
 * @param jwks - mapping of key id to raw Ed25519 public key bytes.
 * @param nowSec - current time as epoch seconds (injected, never read here).
 * @param skewSec - allowed clock skew tolerance, in seconds.
 * @returns the decoded {@link Claims} when the token is valid and unexpired.
 * @throws Error("malformed token") when the token is not 3 segments.
 * @throws Error("unknown kid") when the header kid is absent from the JWKS.
 * @throws Error("invalid signature") when signature verification fails.
 * @throws Error("token expired") when exp is in the past beyond the skew.
 */
export function verifyQrToken(
  token: string,
  jwks: Record<string, Uint8Array>,
  nowSec: number,
  skewSec: number,
): Claims {
  const parts = token.split(".");
  if (parts.length !== JWT_SEGMENTS) {
    throw new Error("malformed token");
  }
  const [h, p, s] = parts;
  if (h === undefined || p === undefined || s === undefined) {
    throw new Error("malformed token");
  }
  const header = JSON.parse(decodeBase64Url(h)) as TokenHeader;
  const publicKey = selectKey(header, jwks);

  const signedBytes = new TextEncoder().encode(`${h}.${p}`);
  const signature = decodeBase64UrlBytes(s);
  if (!ed25519.verify(signature, signedBytes, publicKey)) {
    throw new Error("invalid signature");
  }

  const claims = JSON.parse(decodeBase64Url(p)) as Claims;
  // Valid while exp is in the future, or recently past within the skew window.
  const expired = claims.exp < nowSec && !withinSkew(claims.exp, nowSec, skewSec);
  if (expired) {
    throw new Error("token expired");
  }

  return claims;
}
