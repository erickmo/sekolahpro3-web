import { describe, it, expect } from "vitest";
import {
  buildInbox,
  berandaInboxProgress,
  TUNGGAKAN_BESAR_THRESHOLD,
  type BerandaInboxInput,
} from "./berandaInbox";
import type { TagihanRow, PengeluaranRow } from "../data/keuangan";

function tagihan(p: Partial<TagihanRow>): TagihanRow {
  return {
    id: "T1",
    siswa: "Budi",
    kelas: "X-A",
    judul: "SPP Juni",
    jatuhTempo: "2026-06-01",
    jumlah: 1_000_000,
    dibayar: 0,
    status: "Tertunda",
    tahunAjaran: "2025/2026",
    sekolah: "" as TagihanRow["sekolah"],
    ...p,
  };
}

function pengeluaran(p: Partial<PengeluaranRow>): PengeluaranRow {
  return {
    id: "E1",
    tanggal: "2026-06-05",
    kategori: "Operasional",
    deskripsi: "Beli kertas",
    jumlah: 500_000,
    penerima: "Toko ATK",
    metode: "Tunai",
    status: "Approval",
    sekolah: "" as PengeluaranRow["sekolah"],
    ...p,
  };
}

const TODAY = "2026-06-10";

function input(p: Partial<BerandaInboxInput>): BerandaInboxInput {
  return { today: TODAY, role: "tu_operator", ...p };
}

describe("buildInbox — tu_operator", () => {
  it("emits aggregate count rows, red for blocking absensi, and skips zero counts", () => {
    const items = buildInbox(input({
      role: "tu_operator",
      counts: { guruBelumAbsensi: 2, pembayaranProses: 8, berkasIncompleteSiswa: 0, pesanBelumDibalas: 3 },
    }));
    const ids = items.map((i) => i.id);
    expect(ids).toContain("guru-belum-absensi");
    expect(ids).toContain("pembayaran-proses");
    expect(ids).toContain("pesan-belum-dibalas");
    expect(ids).not.toContain("berkas-incomplete"); // zero skipped
    const absensi = items.find((i) => i.id === "guru-belum-absensi")!;
    expect(absensi.severity).toBe("red");
    expect(absensi.meta).toContain("2");
    expect(absensi.to).toContain("/absensi/guru");
  });

  it("never composes per-invoice finance rows even if finance data is passed", () => {
    const items = buildInbox(input({
      role: "tu_operator",
      finance: { tagihan: [tagihan({ jatuhTempo: "2026-06-01" })], pengeluaran: [], sptDraftCount: 0 },
      counts: { pembayaranProses: 1 },
    }));
    expect(items.some((i) => i.type === "tagihan")).toBe(false);
  });
});

describe("buildInbox — bendahara", () => {
  it("composes per-invoice finance rows via keuanganWorkQueue (overdue = red tagihan)", () => {
    const items = buildInbox(input({
      role: "bendahara",
      finance: { tagihan: [tagihan({ jatuhTempo: "2026-06-01" })], pengeluaran: [], sptDraftCount: 0 },
    }));
    const t = items.find((i) => i.type === "tagihan");
    expect(t).toBeDefined();
    expect(t!.severity).toBe("red");
    expect(t!.to).toContain("/keuangan/tagihan");
  });

  it("composes expense-approval (belanja) rows from finance", () => {
    const items = buildInbox(input({
      role: "bendahara",
      finance: { tagihan: [], pengeluaran: [pengeluaran({ status: "Approval" })], sptDraftCount: 0 },
    }));
    expect(items.some((i) => i.type === "belanja")).toBe(true);
  });

  it("adds a red kas row when cash is not yet closed, and aggregate verify/ppdb rows", () => {
    const items = buildInbox(input({
      role: "bendahara",
      kasBelumTutup: true,
      counts: { pembayaranVerify: 8, ppdbPembayaranMasuk: 4 },
    }));
    const kas = items.find((i) => i.id === "kas-belum-tutup")!;
    expect(kas.severity).toBe("red");
    expect(items.find((i) => i.id === "pembayaran-verify")!.meta).toContain("8");
    expect(items.find((i) => i.id === "ppdb-pembayaran-masuk")).toBeDefined();
  });
});

describe("buildInbox — guru / wali_kelas teaching inbox", () => {
  it("guru gets only teaching buckets, no finance, no decisions", () => {
    const items = buildInbox(input({
      role: "guru",
      finance: { tagihan: [tagihan({ jatuhTempo: "2026-06-01" })], pengeluaran: [], sptDraftCount: 0 },
      decisions: { rombelTanpaWali: 3 },
      counts: { absensiPelajaranSayaBelum: 1, pesanWaliMurid: 2, penggantiPending: 1 },
    }));
    expect(items.some((i) => i.type === "tagihan")).toBe(false);
    expect(items.some((i) => i.id === "rombel-tanpa-wali")).toBe(false);
    const absensi = items.find((i) => i.id === "absensi-pelajaran-saya")!;
    expect(absensi.severity).toBe("red");
    expect(absensi.to).toContain("/absensi/pelajaran");
    expect(items.find((i) => i.id === "pesan-wali-murid")).toBeDefined();
  });

  it("wali_kelas inbox uses the same teaching buckets as guru", () => {
    const items = buildInbox(input({ role: "wali_kelas", counts: { absensiPelajaranSayaBelum: 1 } }));
    expect(items.find((i) => i.id === "absensi-pelajaran-saya")).toBeDefined();
  });
});

describe("buildInbox — kepala_sekolah decisions", () => {
  it("emits decision rows (rombel tanpa wali red, SK amber) and no per-invoice finance", () => {
    const items = buildInbox(input({
      role: "kepala_sekolah",
      finance: { tagihan: [tagihan({ jatuhTempo: "2026-06-01" })], pengeluaran: [], sptDraftCount: 0 },
      decisions: { rombelTanpaWali: 3, skAkanBerakhir: 6 },
    }));
    expect(items.some((i) => i.type === "tagihan")).toBe(false);
    const wali = items.find((i) => i.id === "rombel-tanpa-wali")!;
    expect(wali.severity).toBe("red");
    expect(wali.to).toContain("/kelas/rombel");
    expect(items.find((i) => i.id === "sk-akan-berakhir")!.severity).toBe("amber");
  });

  it("tunggakan besar is red at/above threshold, amber below", () => {
    const big = buildInbox(input({
      role: "kepala_sekolah",
      decisions: { tunggakanBesar: { count: 18, total: TUNGGAKAN_BESAR_THRESHOLD } },
    }));
    expect(big.find((i) => i.id === "tunggakan-besar")!.severity).toBe("red");
    const small = buildInbox(input({
      role: "kepala_sekolah",
      decisions: { tunggakanBesar: { count: 2, total: TUNGGAKAN_BESAR_THRESHOLD - 1 } },
    }));
    expect(small.find((i) => i.id === "tunggakan-besar")!.severity).toBe("amber");
  });
});

describe("buildInbox — ordering & empties", () => {
  it("sorts red before amber before emerald (stable within severity)", () => {
    const items = buildInbox(input({
      role: "bendahara",
      kasBelumTutup: true, // red
      counts: { pembayaranVerify: 1, ppdbPembayaranMasuk: 1 }, // amber, emerald
    }));
    const sev = items.map((i) => i.severity);
    const rank = { red: 0, amber: 1, emerald: 2 } as const;
    for (let i = 1; i < sev.length; i++) {
      expect(rank[sev[i]!]).toBeGreaterThanOrEqual(rank[sev[i - 1]!]);
    }
  });

  it("returns an empty inbox for empty input", () => {
    expect(buildInbox(input({ role: "tu_operator" }))).toEqual([]);
  });
});

describe("berandaInboxProgress", () => {
  it("counts done vs total by id", () => {
    const items = buildInbox(input({ role: "tu_operator", counts: { guruBelumAbsensi: 1, pembayaranProses: 1 } }));
    expect(berandaInboxProgress(items, ["guru-belum-absensi"])).toEqual({ done: 1, total: 2 });
  });
});
