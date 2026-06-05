import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@sekolahpro/api-client", () => ({ frappeFetch: vi.fn(), configure: vi.fn() }));

import { frappeFetch } from "@sekolahpro/api-client";
import { scanIdentitasPublik } from "./ocrApi";

beforeEach(() => {
  vi.mocked(frappeFetch).mockReset();
});

describe("scanIdentitasPublik", () => {
  it("calls the full OCR method path with turnstile token", async () => {
    vi.mocked(frappeFetch).mockResolvedValue({
      scan_id: "P1",
      jenis: "KTP",
      confidence: 90,
      fields: { nik: "3201234567890001" },
    });

    const blob = new Blob([new Uint8Array([1])], { type: "image/png" });
    const res = await scanIdentitasPublik(blob, "KTP", "tok123");

    expect(frappeFetch).toHaveBeenCalledWith(
      "sekolahpro.ocr.api.scan_identitas_publik",
      expect.objectContaining({
        turnstile_token: "tok123",
        jenis: "KTP",
        mime_type: "image/png",
        filename: "ktp.jpg",
      }),
    );
    expect(res.fields.nik).toBe("3201234567890001");
  });

  it("uses image/jpeg as fallback mime_type when blob.type is empty", async () => {
    vi.mocked(frappeFetch).mockResolvedValue({
      scan_id: "P2",
      jenis: "KTP",
      confidence: 80,
      fields: {},
    });

    const blob = new Blob([new Uint8Array([1])]);
    await scanIdentitasPublik(blob, "KTP", "tok456", "sman-1");

    expect(frappeFetch).toHaveBeenCalledWith(
      "sekolahpro.ocr.api.scan_identitas_publik",
      expect.objectContaining({
        mime_type: "image/jpeg",
        sekolah: "sman-1",
        filename: "ktp.jpg",
      }),
    );
  });

  it("returns the unwrapped ScanResult from frappeFetch", async () => {
    const mockResult = {
      scan_id: "P3",
      jenis: "KTP",
      confidence: 95,
      fields: { nik: "x", nama: "Budi" },
    };
    vi.mocked(frappeFetch).mockResolvedValue(mockResult);

    const blob = new Blob([new Uint8Array([1])], { type: "image/jpeg" });
    const res = await scanIdentitasPublik(blob, "KTP", "tok789");

    expect(res).toEqual(mockResult);
  });
});
