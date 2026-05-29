import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useConnectivity } from "../connectivity";

beforeEach(() => {
  Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
});

describe("useConnectivity", () => {
  it("starts online", () => {
    const { result } = renderHook(() => useConnectivity({ pingFn: () => Promise.resolve(true), intervalMs: 1000 }));
    expect(result.current.online).toBe(true);
  });

  it("flips offline on browser event", () => {
    const { result } = renderHook(() => useConnectivity({ pingFn: () => Promise.resolve(true), intervalMs: 1000 }));
    act(() => {
      Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
      window.dispatchEvent(new Event("offline"));
    });
    expect(result.current.online).toBe(false);
  });

  it("flips offline when ping fails", async () => {
    vi.useFakeTimers();
    const ping = vi.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    const { result } = renderHook(() => useConnectivity({ pingFn: ping, intervalMs: 500 }));
    await act(async () => { await vi.advanceTimersByTimeAsync(600); });
    expect(result.current.online).toBe(false);
    vi.useRealTimers();
  });
});
