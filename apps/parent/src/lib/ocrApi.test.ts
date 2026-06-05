// ocrApi.test.ts — unit tests for the parent-app OCR HTTP client.
//
// Layer: Infrastructure tests (mocked transport; no real HTTP).
// Mirrors the school app's ocrApi.test.ts conventions.
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock must be hoisted before the module under test is imported.
vi.mock("@sekolahpro/api-client", () => ({ frappeFetch: vi.fn() }));
import { frappeFetch } from "@sekolahpro/api-client";
import { scanIdentitas } from "./ocrApi";

beforeEach(() => {
  vi.mocked(frappeFetch).mockReset();
});

describe("scanIdentitas (parent app)", () => {
  it("posts base64 + metadata to the ocr endpoint and returns the result", async () => {
    vi.mocked(frappeFetch).mockResolvedValue({
      scan_id: "PINDAI-1",
      jenis: "KTP",
      confidence: 90,
      fields: { nama: "SITI AMINAH" },
    });

    const blob = new Blob([new Uint8Array([1, 2, 3])], { type: "image/png" });
    const res = await scanIdentitas(blob, "KTP");

    // Must call the shared whitelisted endpoint with jenis, mime_type, filename.
    expect(frappeFetch).toHaveBeenCalledWith(
      "sekolahpro.ocr.api.scan_identitas",
      expect.objectContaining({
        jenis: "KTP",
        mime_type: "image/png",
        filename: "ktp.jpg",
      }),
    );
    expect(res.fields.nama).toBe("SITI AMINAH");
  });

  it("uses image/jpeg fallback when blob.type is empty", async () => {
    vi.mocked(frappeFetch).mockResolvedValue({
      scan_id: "PINDAI-2",
      jenis: "KK",
      confidence: 85,
      fields: {},
    });

    // Blob with no MIME type — default must be image/jpeg.
    const blob = new Blob([new Uint8Array([4, 5])]);
    await scanIdentitas(blob, "KK");

    expect(frappeFetch).toHaveBeenCalledWith(
      "sekolahpro.ocr.api.scan_identitas",
      expect.objectContaining({ mime_type: "image/jpeg", filename: "kk.jpg" }),
    );
  });

  it("passes optional sekolah param when provided", async () => {
    vi.mocked(frappeFetch).mockResolvedValue({
      scan_id: "PINDAI-3",
      jenis: "SIM",
      confidence: 70,
      fields: {},
    });

    const blob = new Blob([new Uint8Array([7])], { type: "image/jpeg" });
    await scanIdentitas(blob, "SIM", "SKL-001");

    expect(frappeFetch).toHaveBeenCalledWith(
      "sekolahpro.ocr.api.scan_identitas",
      expect.objectContaining({ sekolah: "SKL-001" }),
    );
  });
});
