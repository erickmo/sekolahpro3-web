/**
 * Tests untuk ppdbQueue — buildWorkQueue mengelompokkan pendaftar ke 4 antrean
 * kerja (dokumen, seleksi, pembayaran, daftar-ulang) dengan count akurat,
 * preview items terbatas, dan deep-link actionHref yang benar.
 *
 * Strategi: bangun fixture Pendaftar minimal yang hanya memuat field relevan
 * untuk tiap aturan, lalu buktikan setiap grup INCLUDE/EXCLUDE dengan tepat.
 */

import { describe, it, expect } from "vitest";
import { buildWorkQueue, type WorkQueueId, type WorkQueueGroup } from "./ppdbQueue";
import type { Pendaftar, DokumenPpdbRow, PembayaranPpdbRow, StatusPendaftaran } from "../data/ppdb";

const TODAY_ISO = "2026-06-01";

/** Buat satu dokumen row dengan status tertentu (default Diterima/lengkap). */
function doc(status: DokumenPpdbRow["status"]): DokumenPpdbRow {
  return { nama: "Berkas.pdf", tipe: "KK", status };
}

/** Buat satu pembayaran row dengan status tertentu (default Lunas). */
function pay(status: PembayaranPpdbRow["status"]): PembayaranPpdbRow {
  return { id: "PAY-X", judul: "Biaya Pendaftaran", tanggal: TODAY_ISO, jumlah: 250000, status };
}

/**
 * Pabrik Pendaftar minimal. Hanya field yang dipakai buildWorkQueue yang
 * disetel; sisanya diisi default netral agar tidak memicu grup lain.
 */
function makePendaftar(overrides: Partial<Pendaftar>): Pendaftar {
  const base = {
    noPendaftaran: "PPDB-2026-000001",
    namaLengkap: "Calon Default",
    statusPendaftaran: "Verifikasi" as StatusPendaftaran,
    skorTes: 80, // skor sudah ada → tidak masuk antrean seleksi
    dokumen: [doc("Diterima")], // semua dokumen lengkap → tidak masuk antrean dokumen
    pembayaran: [pay("Lunas")], // semua lunas → tidak masuk antrean pembayaran
  } as unknown as Pendaftar;
  return { ...base, ...overrides } as Pendaftar;
}

/** Ambil grup berdasarkan id untuk asersi yang ringkas. */
function group(list: Pendaftar[], id: WorkQueueId): WorkQueueGroup {
  const found = buildWorkQueue(list, TODAY_ISO).find((g) => g.id === id);
  if (!found) throw new Error(`grup ${id} tidak ditemukan`);
  return found;
}

describe("buildWorkQueue — struktur dasar", () => {
  it("selalu mengembalikan 4 grup dengan id yang sesuai kontrak", () => {
    const groups = buildWorkQueue([], TODAY_ISO);
    expect(groups.map((g) => g.id)).toEqual([
      "dokumen",
      "seleksi",
      "pembayaran",
      "daftar-ulang",
    ]);
  });

  it("list kosong menghasilkan semua count = 0 dan items kosong", () => {
    for (const g of buildWorkQueue([], TODAY_ISO)) {
      expect(g.count).toBe(0);
      expect(g.items).toHaveLength(0);
    }
  });

  it("setiap actionHref menunjuk route /sch/$sekolah/ppdb/* dengan literal $sekolah", () => {
    const groups = buildWorkQueue([], TODAY_ISO);
    for (const g of groups) {
      expect(g.actionHref).toMatch(/^\/sch\/\$sekolah\/ppdb\//);
    }
  });
});

describe("grup dokumen", () => {
  it("INCLUDE pendaftar dengan dokumen status Belum", () => {
    const p = makePendaftar({ noPendaftaran: "PPDB-DOC-1", dokumen: [doc("Diterima"), doc("Belum")] });
    const g = group([p], "dokumen");
    expect(g.count).toBe(1);
    expect(g.items[0]?.noPendaftaran).toBe("PPDB-DOC-1");
  });

  it("INCLUDE pendaftar dengan dokumen status Ditolak", () => {
    const p = makePendaftar({ dokumen: [doc("Diterima"), doc("Ditolak")] });
    expect(group([p], "dokumen").count).toBe(1);
  });

  it("EXCLUDE pendaftar dengan semua dokumen Diterima", () => {
    const p = makePendaftar({ dokumen: [doc("Diterima"), doc("Diterima")] });
    expect(group([p], "dokumen").count).toBe(0);
  });
});

describe("grup seleksi", () => {
  const SELEKSI_STATUSES: StatusPendaftaran[] = ["Tes", "Lulus", "Tidak Lulus"];

  it.each(SELEKSI_STATUSES)("INCLUDE status %s ketika skorTes undefined", (status) => {
    const p = makePendaftar({ statusPendaftaran: status, skorTes: undefined });
    expect(group([p], "seleksi").count).toBe(1);
  });

  it("EXCLUDE ketika skorTes sudah terisi walau status Tes", () => {
    const p = makePendaftar({ statusPendaftaran: "Tes", skorTes: 75 });
    expect(group([p], "seleksi").count).toBe(0);
  });

  it("EXCLUDE status Verifikasi walau skorTes undefined", () => {
    const p = makePendaftar({ statusPendaftaran: "Verifikasi", skorTes: undefined });
    expect(group([p], "seleksi").count).toBe(0);
  });
});

describe("grup pembayaran", () => {
  it("INCLUDE pendaftar dengan salah satu pembayaran Tertunda", () => {
    const p = makePendaftar({ pembayaran: [pay("Lunas"), pay("Tertunda")] });
    expect(group([p], "pembayaran").count).toBe(1);
  });

  it("EXCLUDE pendaftar tanpa pembayaran Tertunda", () => {
    const p = makePendaftar({ pembayaran: [pay("Lunas"), pay("Cicilan")] });
    expect(group([p], "pembayaran").count).toBe(0);
  });
});

describe("grup daftar-ulang", () => {
  it("INCLUDE status Lulus yang belum Daftar Ulang", () => {
    const p = makePendaftar({ statusPendaftaran: "Lulus", skorTes: 90 });
    expect(group([p], "daftar-ulang").count).toBe(1);
  });

  it("INCLUDE status Diterima yang belum Daftar Ulang", () => {
    const p = makePendaftar({ statusPendaftaran: "Diterima" });
    expect(group([p], "daftar-ulang").count).toBe(1);
  });

  it("EXCLUDE status Daftar Ulang (sudah selesai)", () => {
    const p = makePendaftar({ statusPendaftaran: "Daftar Ulang" });
    expect(group([p], "daftar-ulang").count).toBe(0);
  });

  it("EXCLUDE status Tidak Lulus", () => {
    const p = makePendaftar({ statusPendaftaran: "Tidak Lulus", skorTes: 50 });
    expect(group([p], "daftar-ulang").count).toBe(0);
  });
});

describe("preview items dibatasi & metadata grup", () => {
  it("count menghitung semua tetapi items hanya menampilkan preview terbatas", () => {
    const many = Array.from({ length: 10 }, (_, i) =>
      makePendaftar({ noPendaftaran: `PPDB-PAY-${i}`, pembayaran: [pay("Tertunda")] }),
    );
    const g = group(many, "pembayaran");
    expect(g.count).toBe(10);
    expect(g.items.length).toBeLessThan(g.count);
    expect(g.items.length).toBeGreaterThan(0);
  });

  it("setiap item preview membawa noPendaftaran, namaLengkap, dan detail", () => {
    const p = makePendaftar({
      noPendaftaran: "PPDB-DETAIL-1",
      namaLengkap: "Budi Santoso",
      dokumen: [doc("Belum")],
    });
    const item = group([p], "dokumen").items[0]!;
    expect(item.noPendaftaran).toBe("PPDB-DETAIL-1");
    expect(item.namaLengkap).toBe("Budi Santoso");
    expect(typeof item.detail).toBe("string");
    expect(item.detail.length).toBeGreaterThan(0);
  });

  it("grup memiliki label & description berbahasa Indonesia non-kosong", () => {
    for (const g of buildWorkQueue([], TODAY_ISO)) {
      expect(g.label.length).toBeGreaterThan(0);
      expect(g.description.length).toBeGreaterThan(0);
    }
  });

  it("tone berisi nilai yang valid sesuai kontrak", () => {
    const valid = new Set(["brand", "warning", "danger", "success", "neutral"]);
    for (const g of buildWorkQueue([], TODAY_ISO)) {
      expect(valid.has(g.tone)).toBe(true);
    }
  });
});
