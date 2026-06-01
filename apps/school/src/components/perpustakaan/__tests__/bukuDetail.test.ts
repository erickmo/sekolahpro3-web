// PERP-GAP-13 | PERP-GAP-14 | PERP-GAP-16
import { describe, it, expect } from "vitest";
import {
  deriveStatus,
  mapEksemplarToKopi,
  mapPeminjamanRows,
  normalizeKategori,
  bukuFromBackend,
  isActivePinjaman,
} from "../bukuDetail";

describe("deriveStatus", () => {
  it("returns Arsip when there are no copies", () => {
    expect(deriveStatus([])).toBe("Arsip");
  });
  it("prefers Tersedia over other statuses", () => {
    expect(deriveStatus([{ kodeKopi: "a", kondisi: "Baik", lokasi: "Rak A", status: "Dipinjam" }, { kodeKopi: "b", kondisi: "Baik", lokasi: "Rak A", status: "Tersedia" }])).toBe("Tersedia");
  });
  it("falls to Dipinjam then Dipesan", () => {
    expect(deriveStatus([{ kodeKopi: "a", kondisi: "Baik", lokasi: "Rak A", status: "Dipinjam" }])).toBe("Dipinjam");
    expect(deriveStatus([{ kodeKopi: "a", kondisi: "Baik", lokasi: "Rak A", status: "Dipesan" }])).toBe("Dipesan");
  });
});

describe("mapEksemplarToKopi", () => {
  it("maps kondisi/status and applies fallbacks", () => {
    const [row] = mapEksemplarToKopi([{ name: "EKS-1", kondisi: "Rusak", status: "Dipinjam", nomor_inventaris: "INV-1" }], "Rak B");
    expect(row).toEqual({ kodeKopi: "INV-1", kondisi: "Rusak Ringan", lokasi: "Rak B", status: "Dipinjam" });
  });
  it("defaults kondisi=Baik, status=Tersedia, kodeKopi=name when missing", () => {
    const [row] = mapEksemplarToKopi([{ name: "EKS-2" }], "Rak A");
    expect(row).toMatchObject({ kodeKopi: "EKS-2", kondisi: "Baik", status: "Tersedia" });
  });
});

describe("mapPeminjamanRows", () => {
  it("maps fields and folds Selesai → Dikembalikan", () => {
    const [row] = mapPeminjamanRows([{ name: "PJM-1", anggota: "A", tanggal_pinjam: "2026-05-01", status: "Selesai" }]);
    expect(row).toMatchObject({ id: "PJM-1", peminjam: "A", tanggalPinjam: "2026-05-01", status: "Dikembalikan" });
  });
});

describe("normalizeKategori (PERP-GAP-14)", () => {
  it("keeps a valid category", () => {
    expect(normalizeKategori("Fiksi")).toBe("Fiksi");
  });
  it("falls back to Referensi for out-of-union or empty values", () => {
    expect(normalizeKategori("Komik Aneh")).toBe("Referensi");
    expect(normalizeKategori(undefined)).toBe("Referensi");
  });
});

describe("bukuFromBackend", () => {
  it("guards the kategori and counts copies by status", () => {
    const buku = bukuFromBackend(
      { name: "BUKU-1", judul: "X", kategori: "BUKAN-KATEGORI", pengarang: "P, Q" },
      [
        { kodeKopi: "a", kondisi: "Baik", lokasi: "Rak A", status: "Tersedia" },
        { kodeKopi: "b", kondisi: "Baik", lokasi: "Rak A", status: "Dipinjam" },
      ],
      [],
      "sdn-1" as never,
    );
    expect(buku.kategori).toBe("Referensi");
    expect(buku.kopiTersedia).toBe(1);
    expect(buku.kopiDipinjam).toBe(1);
    expect(buku.penulis).toEqual(["P", "Q"]);
    expect(buku.status).toBe("Tersedia");
  });
});

describe("isActivePinjaman", () => {
  it("is true for Aktif/Terlambat, false otherwise", () => {
    expect(isActivePinjaman({ name: "1", status: "Aktif" })).toBe(true);
    expect(isActivePinjaman({ name: "2", status: "Terlambat" })).toBe(true);
    expect(isActivePinjaman({ name: "3", status: "Selesai" })).toBe(false);
  });
});
