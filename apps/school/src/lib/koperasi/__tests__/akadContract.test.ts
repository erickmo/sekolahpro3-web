import { describe, it, expect } from "vitest";
import {
  AKAD_POKOK_FIELD,
  AKAD_NUMERIC_FIELDS,
  buildAkadPayload,
} from "../akadContract";

const baseInput = {
  nasabah: "NSB-0001",
  produk_pembiayaan: "Pembiayaan Modal Usaha",
  tanggal_akad: "2026-06-02",
  jumlah_pokok: 5_000_000,
  tenor: 12,
};

describe("akad contract", () => {
  it("canonical pokok field is jumlah_pokok (backend akad_pembiayaan.json)", () => {
    expect(AKAD_POKOK_FIELD).toBe("jumlah_pokok");
  });

  it("treats the canonical numeric fields as numeric", () => {
    expect(AKAD_NUMERIC_FIELDS.has(AKAD_POKOK_FIELD)).toBe(true);
    expect(AKAD_NUMERIC_FIELDS.has("tenor")).toBe(true);
  });

  it("buildAkadPayload writes the exact backend keys", () => {
    const p = buildAkadPayload(baseInput);
    expect(p).toEqual({
      nasabah: "NSB-0001",
      produk_pembiayaan: "Pembiayaan Modal Usaha",
      tanggal_akad: "2026-06-02",
      jumlah_pokok: 5_000_000,
      tenor: 12,
    });
  });

  it("never emits legacy/non-existent fields", () => {
    const p = buildAkadPayload(baseInput);
    for (const dead of ["anggota", "produk", "akad", "pokok_pembiayaan", "tenor_bulan", "margin", "jaminan", "catatan"]) {
      expect(dead in p).toBe(false);
    }
  });
});
