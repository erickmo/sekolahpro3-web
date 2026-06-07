import { describe, it, expect } from "vitest";
import {
  berandaTodayISO,
  weekdayHariName,
  countRombelTanpaWali,
  countMissingAbsensiHarian,
  computeTunggakanBesar,
} from "./derive";
import type { TagihanRow } from "../../data/keuangan";

function tagihan(p: Partial<TagihanRow>): TagihanRow {
  return {
    id: "T1",
    siswa: "Budi",
    kelas: "X-A",
    judul: "SPP",
    jatuhTempo: "2026-06-01",
    jumlah: 1_000_000,
    dibayar: 0,
    status: "Tertunda",
    tahunAjaran: "2025/2026",
    sekolah: "" as TagihanRow["sekolah"],
    ...p,
  };
}

describe("berandaTodayISO (WIB)", () => {
  it("shifts a late-UTC instant into the correct WIB calendar day", () => {
    // 2026-06-09 23:30 UTC is already 2026-06-10 06:30 in WIB (UTC+7).
    expect(berandaTodayISO(new Date("2026-06-09T23:30:00Z"))).toBe("2026-06-10");
  });
});

describe("weekdayHariName (WIB, no Minggu)", () => {
  it("maps weekdays to Indonesian names", () => {
    expect(weekdayHariName(new Date("2026-06-08T03:00:00Z"))).toBe("Senin");
    expect(weekdayHariName(new Date("2026-06-13T03:00:00Z"))).toBe("Sabtu");
  });

  it("returns null on Sunday (Minggu is not a schedule option)", () => {
    expect(weekdayHariName(new Date("2026-06-14T03:00:00Z"))).toBeNull();
  });
});

describe("countRombelTanpaWali", () => {
  it("counts rombels with a missing/blank wali_kelas", () => {
    expect(
      countRombelTanpaWali([
        { name: "A", wali_kelas: "user1@x.id" },
        { name: "B", wali_kelas: "" },
        { name: "C" },
      ]),
    ).toBe(2);
  });
});

describe("countMissingAbsensiHarian", () => {
  it("counts rombels with no daily-attendance record today", () => {
    expect(countMissingAbsensiHarian(["A", "B", "C"], ["A"])).toBe(2);
  });

  it("never goes negative when more records than rombels", () => {
    expect(countMissingAbsensiHarian(["A"], ["A", "B"])).toBe(0);
  });
});

describe("computeTunggakanBesar", () => {
  it("sums outstanding overdue invoices and counts distinct students", () => {
    const res = computeTunggakanBesar(
      [
        tagihan({ id: "1", siswa: "Budi", jatuhTempo: "2026-06-01", jumlah: 1_000_000, dibayar: 0 }),
        tagihan({ id: "2", siswa: "Ani", jatuhTempo: "2026-06-05", jumlah: 500_000, dibayar: 200_000 }),
        tagihan({ id: "3", siswa: "Lunas", jatuhTempo: "2026-06-01", status: "Lunas" }),
        tagihan({ id: "4", siswa: "Future", jatuhTempo: "2026-12-01" }),
      ],
      "2026-06-10",
    );
    expect(res.count).toBe(2);
    expect(res.total).toBe(1_300_000); // 1.000.000 + (500.000-200.000)
  });
});
