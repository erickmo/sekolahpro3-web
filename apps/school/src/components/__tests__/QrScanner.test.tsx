import { describe, it, expect, vi } from "vitest";
import { render, act } from "@testing-library/react";
import { QrScanner } from "../QrScanner";

vi.mock("@zxing/browser", () => {
  return {
    BrowserQRCodeReader: class {
      async decodeFromVideoDevice(
        _id: string | null,
        _video: HTMLVideoElement,
        cb: (res: { getText(): string } | null, err: unknown) => void,
      ) {
        setTimeout(() => cb({ getText: () => "mock.payload.ABC" }, null), 10);
        return { stop: () => {} };
      }
    },
  };
});

describe("QrScanner", () => {
  it("invokes onDecode with token text when a QR is detected", async () => {
    const onDecode = vi.fn();
    render(<QrScanner onDecode={onDecode} />);
    await act(async () => { await new Promise((r) => setTimeout(r, 50)); });
    expect(onDecode).toHaveBeenCalledWith("mock.payload.ABC");
  });
});
