import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { AdsProvider } from "./AdsProvider";
import { AdBanner } from "./AdBanner";

const CREATIVE = {
  ad_type: "Banner", title: "Promo", body_html: null,
  image_url: "https://cdn/x.png", video_url: null,
  click_url: "/api/method/click?token=tok",
  track_url: "/api/method/track", token: "tok", width: 728, height: 90,
};

// Capture IntersectionObserver callbacks so tests can fire "visible".
const observers: Array<(entries: Array<{ isIntersecting: boolean }>) => void> = [];
class IO {
  constructor(public cb: (e: Array<{ isIntersecting: boolean }>) => void) { observers.push(cb); }
  observe() {}
  disconnect() {}
}

function renderBanner() {
  return render(
    <AdsProvider baseUrl="" propertyKey="key123">
      <AdBanner slot="school-dashboard-top" />
    </AdsProvider>,
  );
}

describe("AdBanner", () => {
  beforeEach(() => {
    observers.length = 0;
    vi.stubGlobal("IntersectionObserver", IO as unknown as typeof IntersectionObserver);
  });
  afterEach(() => { vi.restoreAllMocks(); });

  it("renders nothing when no ad", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ message: null }) }));
    const { container } = renderBanner();
    await waitFor(() => expect(container.querySelector("img")).toBeNull());
  });

  it("renders the image when an ad is returned", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ message: CREATIVE }) }));
    renderBanner();
    const img = await screen.findByRole("img");
    expect(img).toHaveAttribute("src", "https://cdn/x.png");
  });

  it("fires impression once when visible", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ message: CREATIVE }) });
    vi.stubGlobal("fetch", fetchMock);
    renderBanner();
    await screen.findByRole("img");
    observers.forEach((cb) => cb([{ isIntersecting: true }]));
    observers.forEach((cb) => cb([{ isIntersecting: true }]));
    await waitFor(() => {
      const trackCalls = fetchMock.mock.calls.filter((c) => String(c[0]).includes("track"));
      expect(trackCalls.length).toBe(1);
    });
  });

  // Routes get_ad → creative, click → the given redirect.
  function stubFetchWithRedirect(redirect: string) {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) =>
        Promise.resolve({
          ok: true,
          json: async () =>
            String(url).includes("get_ad") ? { message: CREATIVE } : { message: { redirect } },
        }),
      ),
    );
  }

  it("does NOT open a javascript: destination (XSS guard)", async () => {
    const openSpy = vi.fn();
    vi.stubGlobal("open", openSpy);
    stubFetchWithRedirect("javascript:alert(document.cookie)");
    renderBanner();
    const link = await screen.findByRole("link");
    fireEvent.click(link);
    await waitFor(() =>
      expect((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.some((c) => String(c[0]).includes("click"))).toBe(true),
    );
    expect(openSpy).not.toHaveBeenCalled();
  });

  it("opens an https: destination", async () => {
    const openSpy = vi.fn();
    vi.stubGlobal("open", openSpy);
    stubFetchWithRedirect("https://advertiser.example/promo");
    renderBanner();
    const link = await screen.findByRole("link");
    fireEvent.click(link);
    await waitFor(() => expect(openSpy).toHaveBeenCalled());
    expect(String(openSpy.mock.calls[0][0])).toContain("https://advertiser.example/promo");
  });
});
