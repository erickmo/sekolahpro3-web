import { describe, it, expect, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useQrScanner, __setQrReaderImpl } from "../use-qr-scanner";

describe("useQrScanner", () => {
  it("invokes onRead with parsed token from scan callback", async () => {
    const onRead = vi.fn();
    const token = btoa(JSON.stringify({
      kartu_id: "K-9", nonce: "x", exp: Math.floor(Date.now()/1000)+60, hmac: "h",
    })).replace(/=+$/, "");

    let cb: ((text: string) => void) | null = null;
    __setQrReaderImpl({
      decodeFromVideoDevice: (_dev, _el, fn) => {
        cb = (txt: string) => fn({ getText: () => txt }, undefined);
        return Promise.resolve({ stop: vi.fn() });
      },
    });

    const { result } = renderHook(() => useQrScanner({ onRead }));
    await act(async () => { await result.current.start(); });
    await waitFor(() => expect(cb).not.toBeNull());
    act(() => cb!(token));
    await waitFor(() => expect(onRead).toHaveBeenCalledTimes(1));
    expect(onRead.mock.calls[0][0].kartu_id).toBe("K-9");
  });
});
