// ocrMapping.test.ts — unit tests for KTP OCR → PickupPerson form mapping.
//
// Layer: Domain utility tests (pure; no I/O; no React).
// Covers: PRD OCR auto-fill requirement for the parent pickup-person form.
import { describe, it, expect } from "vitest";
import { mapKtpToPickup } from "./ocrMapping";

describe("mapKtpToPickup", () => {
  it("maps KTP nama to the pickup form 'nama' field", () => {
    // Only the name is auto-filled; nik and other fields are intentionally ignored
    // because PickupPerson has no NIK field.
    expect(mapKtpToPickup({ nik: "3171234567890001", nama: "BUDI SANTOSO" })).toEqual({
      nama: "BUDI SANTOSO",
    });
  });

  it("omits result when nama is absent", () => {
    expect(mapKtpToPickup({ nik: "3171234567890001" })).toEqual({});
  });

  it("omits result when nama is an empty string", () => {
    expect(mapKtpToPickup({ nama: "" })).toEqual({});
  });

  it("omits result when nama is not a string", () => {
    expect(mapKtpToPickup({ nama: 42 })).toEqual({});
  });

  it("does NOT include nik or other KTP fields (no NIK on PickupPerson)", () => {
    const result = mapKtpToPickup({ nik: "123", nama: "SRI" });
    // Only 'nama' key expected — NIK must be absent.
    expect(Object.keys(result)).toEqual(["nama"]);
  });
});
