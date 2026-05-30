import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useNfcReader } from "../use-nfc-reader";

type NdefEvent = { message: { records: { recordType: string; data: ArrayBuffer }[] } };

class FakeNDEFReader {
  static instances: FakeNDEFReader[] = [];
  onreading: ((e: NdefEvent) => void) | null = null;
  onreadingerror: ((e: Event) => void) | null = null;
  scan = vi.fn().mockResolvedValue(undefined);
  constructor() { FakeNDEFReader.instances.push(this); }
  emit(records: { recordType: string; data: ArrayBuffer }[]) {
    this.onreading?.({ message: { records } });
  }
}

function makeRecord(text: string) {
  return { recordType: "text", data: new TextEncoder().encode(text).buffer };
}

beforeEach(() => {
  FakeNDEFReader.instances = [];
  (globalThis as Record<string, unknown>).NDEFReader = FakeNDEFReader;
});

describe("useNfcReader", () => {
  it("reports unsupported when NDEFReader absent", () => {
    delete (globalThis as Record<string, unknown>).NDEFReader;
    const { result } = renderHook(() => useNfcReader({ enabled: false }));
    expect(result.current.supported).toBe(false);
  });

  it("emits onRead with parsed token on tap", async () => {
    const onRead = vi.fn();
    renderHook(() => useNfcReader({ enabled: true, onRead }));
    await waitFor(() => expect(FakeNDEFReader.instances).toHaveLength(1));
    const token = btoa(JSON.stringify({
      kartu_id: "K-1", nonce: "n", exp: Math.floor(Date.now()/1000)+60, hmac: "h",
    })).replace(/=+$/, "");
    act(() => FakeNDEFReader.instances[0]!.emit([makeRecord(token)]));
    await waitFor(() => expect(onRead).toHaveBeenCalledTimes(1));
    expect(onRead.mock.calls[0][0].kartu_id).toBe("K-1");
  });

  it("does not arm reader when disabled", () => {
    renderHook(() => useNfcReader({ enabled: false }));
    expect(FakeNDEFReader.instances).toHaveLength(0);
  });
});
