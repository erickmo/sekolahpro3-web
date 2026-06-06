// ABS-002
import { afterEach, describe, expect, it, vi } from "vitest";

import { createStationClient } from "../api";

const BASE_URL = "http://station.test";
const API_KEY = "KEY-123";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createStationClient.recordTap", () => {
  it("posts taps to record_tap and returns parsed results", async () => {
    // ABS-002 | wraps Frappe `body.message` envelope, includes api_key
    const results = [{ status: "ok" }];
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: { results } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = createStationClient({ baseUrl: BASE_URL, apiKey: API_KEY });
    const taps = [{ subject_id: "S1", at: 100 }];
    const out = await client.recordTap(taps);

    expect(out.results).toEqual(results);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("record_tap");
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body);
    expect(body.api_key).toBe(API_KEY);
    expect(body.taps).toEqual(taps);
  });

  it("throws when the response is not ok", async () => {
    // ABS-002 | non-2xx surfaces as an error, not a silent empty result
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = createStationClient({ baseUrl: BASE_URL, apiKey: API_KEY });

    await expect(client.recordTap([])).rejects.toThrow();
  });
});
