import { describe, it, expect } from "vitest";
import {
  resolveKelasku,
  sortRoster,
  normalizePhone,
  waLink,
  telLink,
  pickWaliContact,
  type KelaskuRombel,
  type KelaskuAnggota,
  type WaliRow,
} from "./kelasku";

const r = (name: string): KelaskuRombel => ({ name, nama_rombel: name, status: "Aktif" });

describe("kelasku — resolveKelasku (wali of zero / one / many)", () => {
  it("returns none when the wali owns no active rombel", () => {
    expect(resolveKelasku([]).kind).toBe("none");
  });

  it("returns the single rombel when the wali owns exactly one", () => {
    const res = resolveKelasku([r("VII-A")]);
    expect(res.kind).toBe("one");
    if (res.kind === "one") expect(res.rombel.name).toBe("VII-A");
  });

  it("returns many with the first as active by default", () => {
    const res = resolveKelasku([r("VII-A"), r("VII-B")]);
    expect(res.kind).toBe("many");
    if (res.kind === "many") expect(res.active.name).toBe("VII-A");
  });

  it("honors a preferred rombel name as active in the many case", () => {
    const res = resolveKelasku([r("VII-A"), r("VII-B")], "VII-B");
    if (res.kind === "many") expect(res.active.name).toBe("VII-B");
  });
});

describe("kelasku — sortRoster", () => {
  it("drops non-Aktif members and sorts by no_urut ascending", () => {
    const anggota: KelaskuAnggota[] = [
      { siswa: "C", no_urut: 3, status: "Aktif" },
      { siswa: "X", no_urut: 1, status: "Keluar" },
      { siswa: "A", no_urut: 1, status: "Aktif" },
      { siswa: "B", no_urut: 2, status: "Aktif" },
    ];
    expect(sortRoster(anggota).map((a) => a.siswa)).toEqual(["A", "B", "C"]);
  });
});

describe("kelasku — contact links", () => {
  it("normalizes Indonesian phone numbers to 62 international form", () => {
    expect(normalizePhone("0812-3456-7890")).toBe("6281234567890");
    expect(normalizePhone("+62 812 3456")).toBe("628123456");
    expect(normalizePhone("62812")).toBe("62812");
  });

  it("builds wa.me and tel links", () => {
    expect(waLink("08123456")).toBe("https://wa.me/628123456");
    expect(telLink("08123456")).toBe("tel:+628123456");
  });
});

describe("kelasku — pickWaliContact", () => {
  const wali: WaliRow[] = [
    { nama: "Ayah", hubungan: "Ayah", no_hp: "0811" },
    { nama: "Ibu", hubungan: "Ibu", no_hp: "0822", is_primary: 1 },
  ];

  it("prefers the primary wali that has a phone", () => {
    expect(pickWaliContact(wali)?.nama).toBe("Ibu");
  });

  it("falls back to the first wali with a phone when none is primary", () => {
    expect(
      pickWaliContact([
        { nama: "A", no_hp: "" },
        { nama: "B", no_hp: "0833" },
      ])?.nama,
    ).toBe("B");
  });

  it("returns undefined when no wali has a phone", () => {
    expect(pickWaliContact([{ nama: "X" }])).toBeUndefined();
    expect(pickWaliContact([])).toBeUndefined();
  });
});
