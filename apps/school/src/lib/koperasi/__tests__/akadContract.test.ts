import { describe, it, expect } from "vitest";
import {
  AKAD_POKOK_FIELD,
  AKAD_NUMERIC_FIELDS,
  buildAkadPayload,
} from "../akadContract";

const baseInput = {
  anggota: "ANG-1",
  produk: "Pembiayaan Modal Usaha",
  akad: "Murabahah",
  tanggal_akad: "2026-06-02",
  pokok_pembiayaan: 5_000_000,
  tenor_bulan: 12,
};

describe("akad contract", () => {
  it("canonical pokok field is pokok_pembiayaan (matches create + detail reads)", () => {
    expect(AKAD_POKOK_FIELD).toBe("pokok_pembiayaan");
  });

  it("treats the canonical pokok field as numeric", () => {
    expect(AKAD_NUMERIC_FIELDS.has(AKAD_POKOK_FIELD)).toBe(true);
  });

  it("buildAkadPayload writes pokok under the canonical key, never the legacy jumlah_pokok", () => {
    const p = buildAkadPayload(baseInput);
    expect(p[AKAD_POKOK_FIELD]).toBe(5_000_000);
    expect("jumlah_pokok" in p).toBe(false);
  });

  it("buildAkadPayload omits empty optional fields", () => {
    const p = buildAkadPayload(baseInput);
    expect("margin" in p).toBe(false);
    expect("jaminan" in p).toBe(false);
    expect("catatan" in p).toBe(false);
  });

  it("buildAkadPayload keeps provided optional fields", () => {
    const p = buildAkadPayload({ ...baseInput, margin: 600_000, jaminan: "BPKB", catatan: "tes" });
    expect(p.margin).toBe(600_000);
    expect(p.jaminan).toBe("BPKB");
    expect(p.catatan).toBe("tes");
  });
});
