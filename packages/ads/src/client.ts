import type { AdCreative } from "./types";

const GET_AD = "/api/method/vernon_ads.api.get_ad.get_ad";
const TRACK = "/api/method/vernon_ads.api.track.track";
// Guest CSRF sentinel mirrors the backend serve.js so guest POSTs pass Frappe's
// CSRF check without a session cookie.
const GUEST_CSRF = "Guest";

/** Fetch a creative for a slot. Returns null on no-ad / error (caller renders nothing). */
export async function fetchAd(
  baseUrl: string,
  slot: string,
  propertyKey: string,
): Promise<AdCreative | null> {
  const url =
    `${baseUrl}${GET_AD}?slot=${encodeURIComponent(slot)}` +
    `&property_key=${encodeURIComponent(propertyKey)}`;
  try {
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) return null;
    const json = (await res.json()) as { message?: AdCreative | null };
    return json.message ?? null;
  } catch {
    return null;
  }
}

/** Record an impression. Fire-and-forget; failures are swallowed. */
export async function trackImpression(baseUrl: string, token: string): Promise<void> {
  try {
    await fetch(`${baseUrl}${TRACK}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Frappe-CSRF-Token": GUEST_CSRF },
      body: JSON.stringify({ token }),
    });
  } catch {
    /* analytics best-effort */
  }
}

/** Resolve a click into its destination URL via the backend (records the click). */
export async function resolveClick(baseUrl: string, clickUrl: string): Promise<string> {
  try {
    const res = await fetch(`${baseUrl}${clickUrl}`, { method: "GET" });
    const json = (await res.json()) as { message?: { redirect?: string } };
    return json.message?.redirect ?? "";
  } catch {
    return "";
  }
}
