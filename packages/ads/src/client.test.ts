import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchAd, trackImpression, resolveClick } from "./client";

const CREATIVE = {
  ad_type: "Banner", title: "Promo", body_html: null,
  image_url: "https://cdn/x.png", video_url: null,
  click_url: "/api/method/vernon_ads.api.click.click?token=tok",
  track_url: "/api/method/vernon_ads.api.track.track",
  token: "tok", width: 728, height: 90,
};

describe("ads client", () => {
  beforeEach(() => { vi.restoreAllMocks(); });
  afterEach(() => { vi.restoreAllMocks(); });

  it("fetchAd returns the creative from message", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true, json: async () => ({ message: CREATIVE }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const ad = await fetchAd("", "school-dashboard-top", "key123");
    expect(ad?.title).toBe("Promo");
    const calledUrl = fetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain("get_ad");
    expect(calledUrl).toContain("slot=school-dashboard-top");
    expect(calledUrl).toContain("property_key=key123");
  });

  it("fetchAd returns null when message is null", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ message: null }) }));
    expect(await fetchAd("", "s", "k")).toBeNull();
  });

  it("fetchAd returns null on non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }));
    expect(await fetchAd("", "s", "k")).toBeNull();
  });

  it("trackImpression POSTs the token", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ message: { status: "ok" } }) });
    vi.stubGlobal("fetch", fetchMock);
    await trackImpression("https://api", "tok");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api/api/method/vernon_ads.api.track.track");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ token: "tok" });
  });

  it("resolveClick returns redirect from message", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true, json: async () => ({ message: { redirect: "https://dest" } }),
    }));
    expect(await resolveClick("https://api", "/api/method/...click?token=tok")).toBe("https://dest");
  });
});
