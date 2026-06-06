/**
 * Typed HTTP client for the attendance station's backend endpoints.
 *
 * Layer: infrastructure. Wraps `fetch`, posting JSON to Frappe whitelisted
 * methods and unwrapping the `{ message: ... }` envelope. The API key is
 * injected once and attached to every authenticated call body.
 */

/** Frappe method path prefix for station endpoints. */
const STATION_NS = "sekolahpro.attendance.api.station";

/** Frappe method path prefix for QR key endpoints. */
const QR_NS = "sekolahpro.attendance.api.qr";

/** Whitelisted method names, fully qualified for the Frappe method router. */
const METHOD = {
  recordTap: `${STATION_NS}.record_tap`,
  heartbeat: `${STATION_NS}.heartbeat`,
  stationConfig: `${STATION_NS}.station_config`,
  cardsDelta: `${STATION_NS}.cards_delta`,
  jwks: `${QR_NS}.jwks`,
} as const;

/** Configuration for {@link createStationClient}. */
export interface StationClientConfig {
  /** Backend origin, e.g. "https://sekolahpro.localhost". */
  baseUrl: string;
  /** Station API key issued during pairing. */
  apiKey: string;
}

/** A tap payload sent to the backend (snake_case wire contract). */
export interface TapPayload {
  subject_id: string;
  at: number;
  [key: string]: unknown;
}

/** Result envelope returned by `record_tap`. */
export interface RecordTapResult {
  results: unknown[];
}

/** The station client surface. */
export interface StationClient {
  recordTap(taps: TapPayload[]): Promise<RecordTapResult>;
  heartbeat(): Promise<unknown>;
  stationConfig(): Promise<unknown>;
  cardsDelta(since: string): Promise<unknown>;
  jwks(): Promise<unknown>;
}

/**
 * POST a JSON body to a Frappe method and unwrap its `message` field.
 *
 * @param baseUrl - backend origin.
 * @param method - fully qualified Frappe method path.
 * @param body - JSON-serializable request body.
 * @returns the value of the response's `message` field.
 * @throws Error when the HTTP response status is not ok.
 */
async function postMethod<T>(
  baseUrl: string,
  method: string,
  body: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(`${baseUrl}/api/method/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`station request failed: ${method} (${response.status})`);
  }
  const json = (await response.json()) as { message: T };
  return json.message;
}

/**
 * Create a station API client bound to a base URL and API key.
 *
 * @param config - backend origin and station API key.
 * @returns a {@link StationClient} with one method per backend endpoint.
 */
export function createStationClient(config: StationClientConfig): StationClient {
  const { baseUrl, apiKey } = config;
  const auth = (extra: Record<string, unknown> = {}) => ({ api_key: apiKey, ...extra });

  return {
    recordTap: (taps) => postMethod<RecordTapResult>(baseUrl, METHOD.recordTap, auth({ taps })),
    heartbeat: () => postMethod<unknown>(baseUrl, METHOD.heartbeat, auth()),
    stationConfig: () => postMethod<unknown>(baseUrl, METHOD.stationConfig, auth()),
    cardsDelta: (since) => postMethod<unknown>(baseUrl, METHOD.cardsDelta, auth({ since })),
    jwks: () => postMethod<unknown>(baseUrl, METHOD.jwks, {}),
  };
}
