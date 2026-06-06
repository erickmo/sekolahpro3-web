/**
 * Station pairing claim flow.
 *
 * Layer: feature/use-case (pure orchestration). Exchanges a one-time pairing
 * code for a station identity + API key, persisting the credentials to an
 * injected store. The HTTP call itself is injected so this stays unit-testable
 * and free of network/storage coupling.
 */
import type { KVStore } from "../../lib/cardCache";

/** Storage key for the issued station API key. */
export const API_KEY_STORAGE_KEY = "attendance.apiKey";

/** Storage key for the issued station id. */
export const STATION_ID_STORAGE_KEY = "attendance.stationId";

/** Arguments sent to the backend claim endpoint (snake_case wire contract). */
export interface ClaimArgs {
  code: string;
  device_fingerprint: string;
  station_pubkey: string;
}

/** Backend response for a successful pairing claim. */
export interface ClaimResponse {
  station_id: string;
  api_key: string;
}

/** Injected dependencies for {@link claimPairing}. */
export interface ClaimDeps {
  /** Performs the backend claim call. */
  claim(args: ClaimArgs): Promise<ClaimResponse>;
  /** Where to persist the issued credentials. */
  store: KVStore;
}

/** Credentials returned to the caller after a successful claim. */
export interface PairingResult {
  stationId: string;
  apiKey: string;
}

/**
 * Claim a pairing code, persist the issued credentials, and return them.
 *
 * @param code - the one-time pairing code shown by the backend.
 * @param fingerprint - this device's stable fingerprint.
 * @param pubkey - this station's public key (for QR verification binding).
 * @param deps - injected claim caller and credential store.
 * @returns the issued station id and API key.
 */
export async function claimPairing(
  code: string,
  fingerprint: string,
  pubkey: string,
  deps: ClaimDeps,
): Promise<PairingResult> {
  const { station_id, api_key } = await deps.claim({
    code,
    device_fingerprint: fingerprint,
    station_pubkey: pubkey,
  });

  deps.store.setItem(API_KEY_STORAGE_KEY, api_key);
  deps.store.setItem(STATION_ID_STORAGE_KEY, station_id);

  return { stationId: station_id, apiKey: api_key };
}
