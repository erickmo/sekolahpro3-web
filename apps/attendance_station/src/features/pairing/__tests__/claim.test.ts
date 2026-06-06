// ABS-002
import { describe, expect, it, vi } from "vitest";

import type { KVStore } from "../../../lib/cardCache";
import { API_KEY_STORAGE_KEY, STATION_ID_STORAGE_KEY, claimPairing } from "../claim";

/** In-memory KVStore shim for asserting persisted pairing credentials. */
function makeStore(): KVStore & { dump: () => Record<string, string> } {
  const map = new Map<string, string>();
  return {
    getItem: (k) => (map.has(k) ? (map.get(k) as string) : null),
    setItem: (k, v) => {
      map.set(k, v);
    },
    dump: () => Object.fromEntries(map),
  };
}

describe("claimPairing", () => {
  it("claims, persists credentials, and returns them", async () => {
    // ABS-002 | the claim response is both returned and written to the store
    const store = makeStore();
    const claim = vi.fn().mockResolvedValue({ station_id: "STN-1", api_key: "KEY" });

    const result = await claimPairing("CODE-9", "FP-1", "PUB-1", { claim, store });

    expect(result).toEqual({ stationId: "STN-1", apiKey: "KEY" });
    expect(claim).toHaveBeenCalledWith({
      code: "CODE-9",
      device_fingerprint: "FP-1",
      station_pubkey: "PUB-1",
    });
    expect(store.getItem(API_KEY_STORAGE_KEY)).toBe("KEY");
    expect(store.getItem(STATION_ID_STORAGE_KEY)).toBe("STN-1");
  });
});
