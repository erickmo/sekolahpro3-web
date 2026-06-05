import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./api-client", () => ({ apiCall: vi.fn() }));

import { apiCall } from "./api-client";
import { scanIdentitasPublik } from "./ocrApi";

beforeEach(() => { vi.mocked(apiCall).mockReset(); });

describe("scanIdentitasPublik", () => {
  it("posts to the guest ocr endpoint with the turnstile token", async () => {
    vi.mocked(apiCall).mockResolvedValue({
      scan_id: "P1",
      jenis: "KTP",
      confidence: 90,
      fields: { nik: "x" },
    });
    const blob = new Blob([new Uint8Array([1])], { type: "image/png" });
    const res = await scanIdentitasPublik(blob, "KTP", "tok123");

    expect(apiCall).toHaveBeenCalledWith(
      "POST",
      "sekolahpro.ocr.api.scan_identitas_publik",
      expect.objectContaining({
        turnstile_token: "tok123",
        jenis: "KTP",
        mime_type: "image/png",
      }),
    );
    expect(res.fields.nik).toBe("x");
  });

  it("uses image/jpeg as fallback mime_type when blob.type is empty", async () => {
    vi.mocked(apiCall).mockResolvedValue({
      scan_id: "P2",
      jenis: "KTP",
      confidence: 80,
      fields: {},
    });
    const blob = new Blob([new Uint8Array([1])]);
    await scanIdentitasPublik(blob, "KTP", "tok456", "sman-1");

    expect(apiCall).toHaveBeenCalledWith(
      "POST",
      "sekolahpro.ocr.api.scan_identitas_publik",
      expect.objectContaining({
        mime_type: "image/jpeg",
        sekolah: "sman-1",
        filename: "ktp.jpg",
      }),
    );
  });
});
