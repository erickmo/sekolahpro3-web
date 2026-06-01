import { describe, it, expect } from "vitest";
import {
  funnelData,
  statusDistribution,
  jalurDistribution,
  paymentSummary,
  paymentStatusDistribution,
  dailyRegistrationTrend,
  scoreHistogram,
  docCompleteness,
  quotaInfo,
  paymentAging,
} from "./ppdbAnalytics";
import { PIPELINE_STAGES } from "./ppdbApi";
import { PPDB_LIST, type Pendaftar } from "../data/ppdb";

// Backend-shaped status rows (mirror PIPELINE_STAGES keys, not mock StatusPendaftaran).
const STATUS_ROWS = [
  { status: "Draft" },
  { status: "Draft" },
  { status: "Diajukan" },
  { status: "Diverifikasi" },
  { status: "Seleksi" },
  { status: "Diterima" },
  { status: "Diterima" },
  { status: "Ditolak" },
  { status: "Selesai" },
  { status: "TidakDikenal" }, // unknown stage must be ignored
  {}, // missing status must be ignored
];

// Minimal Pendaftar factory — only the fields each analytic touches.
function makePendaftar(over: Partial<Pendaftar>): Pendaftar {
  return { ...PPDB_LIST[0]!, ...over };
}

describe("funnelData", () => {
  it("counts each PIPELINE_STAGE in canonical order", () => {
    const data = funnelData(STATUS_ROWS);
    expect(data).toHaveLength(PIPELINE_STAGES.length);
    expect(data.map((d) => d.label)).toEqual(PIPELINE_STAGES.map((s) => s.label));
    const byKey = (key: string) =>
      data[PIPELINE_STAGES.findIndex((s) => s.key === key)]!.value;
    expect(byKey("Draft")).toBe(2);
    expect(byKey("Diajukan")).toBe(1);
    expect(byKey("Diterima")).toBe(2);
    expect(byKey("Selesai")).toBe(1);
  });

  it("assigns a chart tone to every stage", () => {
    const data = funnelData(STATUS_ROWS);
    expect(data.every((d) => typeof d.tone === "string")).toBe(true);
  });

  it("empty input → all zero values, full stage set", () => {
    const data = funnelData([]);
    expect(data).toHaveLength(PIPELINE_STAGES.length);
    expect(data.every((d) => d.value === 0)).toBe(true);
  });
});

describe("statusDistribution", () => {
  it("returns one segment per non-empty stage with a tone", () => {
    const segs = statusDistribution(STATUS_ROWS);
    expect(segs.length).toBeGreaterThan(0);
    expect(segs.every((s) => typeof s.tone === "string" && s.value > 0)).toBe(true);
    const total = segs.reduce((a, s) => a + s.value, 0);
    expect(total).toBe(9); // 9 known-stage rows, 2 ignored
  });

  it("empty input → empty segments", () => {
    expect(statusDistribution([])).toEqual([]);
  });
});

describe("jalurDistribution", () => {
  it("counts pendaftar per jalur", () => {
    const list = [
      makePendaftar({ jalur: "Reguler" }),
      makePendaftar({ jalur: "Reguler" }),
      makePendaftar({ jalur: "Afirmasi" }),
    ];
    const data = jalurDistribution(list);
    const reguler = data.find((d) => d.label === "Reguler");
    const afirmasi = data.find((d) => d.label === "Afirmasi");
    expect(reguler?.value).toBe(2);
    expect(afirmasi?.value).toBe(1);
  });

  it("empty list → empty array", () => {
    expect(jalurDistribution([])).toEqual([]);
  });
});

describe("paymentSummary", () => {
  it("sums billed/collected and derives outstanding + pct", () => {
    const list = [
      makePendaftar({ totalBiaya: 1000, totalDibayar: 400 }),
      makePendaftar({ totalBiaya: 1000, totalDibayar: 600 }),
    ];
    const s = paymentSummary(list);
    expect(s.billed).toBe(2000);
    expect(s.collected).toBe(1000);
    expect(s.outstanding).toBe(1000);
    expect(s.pctCollected).toBe(50);
  });

  it("collected over billed clamps pct at 100 and outstanding at 0", () => {
    const list = [makePendaftar({ totalBiaya: 1000, totalDibayar: 1500 })];
    const s = paymentSummary(list);
    expect(s.pctCollected).toBeLessThanOrEqual(100);
    expect(s.pctCollected).toBe(100);
    expect(s.outstanding).toBe(0);
  });

  it("all-zero billed → 0 pct, no NaN", () => {
    const s = paymentSummary([makePendaftar({ totalBiaya: 0, totalDibayar: 0 })]);
    expect(s.pctCollected).toBe(0);
    expect(Number.isNaN(s.pctCollected)).toBe(false);
  });

  it("empty list → all zero", () => {
    expect(paymentSummary([])).toEqual({
      billed: 0,
      collected: 0,
      outstanding: 0,
      pctCollected: 0,
    });
  });
});

describe("paymentStatusDistribution", () => {
  it("counts Lunas/Cicilan/Tertunda across pembayaran rows", () => {
    const list = [
      makePendaftar({
        pembayaran: [
          { id: "a", judul: "Biaya Pendaftaran", tanggal: "2026-01-01", jumlah: 1, status: "Lunas" },
          { id: "b", judul: "Uang Pangkal", tanggal: "2026-01-01", jumlah: 1, status: "Tertunda" },
        ],
      }),
      makePendaftar({
        pembayaran: [
          { id: "c", judul: "Seragam", tanggal: "2026-01-01", jumlah: 1, status: "Cicilan" },
        ],
      }),
    ];
    const segs = paymentStatusDistribution(list);
    const get = (label: string) => segs.find((s) => s.label === label)?.value ?? 0;
    expect(get("Lunas")).toBe(1);
    expect(get("Tertunda")).toBe(1);
    expect(get("Cicilan")).toBe(1);
    expect(segs.every((s) => typeof s.tone === "string")).toBe(true);
  });

  it("empty list → segments with zero values", () => {
    const segs = paymentStatusDistribution([]);
    expect(segs.every((s) => s.value === 0)).toBe(true);
  });
});

describe("dailyRegistrationTrend", () => {
  const TODAY = "2026-05-10";

  it("buckets registrations per day for the trailing window", () => {
    const rows = [
      { tanggal_daftar: "2026-05-10" },
      { tanggal_daftar: "2026-05-10" },
      { tanggal_daftar: "2026-05-09" },
      { tanggal_daftar: "2026-05-08" },
    ];
    const { points, labels } = dailyRegistrationTrend(rows, 3, TODAY);
    expect(points).toHaveLength(3);
    expect(labels).toHaveLength(3);
    // window = [08, 09, 10] in chronological order
    expect(points).toEqual([1, 1, 2]);
  });

  it("ignores rows outside the window and NaN/empty dates", () => {
    const rows = [
      { tanggal_daftar: "2026-05-10" },
      { tanggal_daftar: "2020-01-01" }, // outside window
      { tanggal_daftar: "not-a-date" }, // NaN
      {}, // missing
    ];
    const { points } = dailyRegistrationTrend(rows, 3, TODAY);
    expect(points.reduce((a, b) => a + b, 0)).toBe(1);
  });

  it("empty input → all zero points of requested length", () => {
    const { points, labels } = dailyRegistrationTrend([], 5, TODAY);
    expect(points).toEqual([0, 0, 0, 0, 0]);
    expect(labels).toHaveLength(5);
  });
});

describe("scoreHistogram", () => {
  it("bins defined skorTes into 0..100 buckets of binSize", () => {
    const list = [
      makePendaftar({ skorTes: 5 }),
      makePendaftar({ skorTes: 12 }),
      makePendaftar({ skorTes: 95 }),
      makePendaftar({ skorTes: undefined }), // ignored
    ];
    const data = scoreHistogram(list, 10);
    expect(data).toHaveLength(10); // 0-9,10-19,...,90-99(+100)
    const total = data.reduce((a, d) => a + d.value, 0);
    expect(total).toBe(3); // undefined skipped
    expect(data[0]!.value).toBe(1); // bucket 0..9
    expect(data[1]!.value).toBe(1); // bucket 10..19
    expect(data[9]!.value).toBe(1); // bucket 90..100
  });

  it("score of exactly 100 lands in the top bucket", () => {
    const data = scoreHistogram([makePendaftar({ skorTes: 100 })], 10);
    expect(data[data.length - 1]!.value).toBe(1);
  });

  it("empty / all-undefined → all-zero buckets", () => {
    const data = scoreHistogram([makePendaftar({ skorTes: undefined })], 10);
    expect(data.every((d) => d.value === 0)).toBe(true);
  });
});

describe("docCompleteness", () => {
  it("counts Diterima documents over total", () => {
    const p = makePendaftar({
      dokumen: [
        { nama: "a", tipe: "KK", status: "Diterima" },
        { nama: "b", tipe: "Akta", status: "Belum" },
        { nama: "c", tipe: "Foto", status: "Ditolak" },
        { nama: "d", tipe: "Rapor", status: "Diterima" },
      ],
    });
    const r = docCompleteness(p);
    expect(r.done).toBe(2);
    expect(r.total).toBe(4);
    expect(r.pct).toBe(50);
  });

  it("no documents → 0/0 with pct 0 (no NaN)", () => {
    const r = docCompleteness(makePendaftar({ dokumen: [] }));
    expect(r).toEqual({ done: 0, total: 0, pct: 0 });
    expect(Number.isNaN(r.pct)).toBe(false);
  });

  it("all accepted → pct 100", () => {
    const p = makePendaftar({
      dokumen: [
        { nama: "a", tipe: "KK", status: "Diterima" },
        { nama: "b", tipe: "Akta", status: "Diterima" },
      ],
    });
    expect(docCompleteness(p).pct).toBe(100);
  });
});

describe("quotaInfo", () => {
  it("derives filled/sisa/pct from total and kuota", () => {
    const r = quotaInfo(30, 100);
    expect(r.filled).toBe(30);
    expect(r.sisa).toBe(70);
    expect(r.pct).toBe(30);
  });

  it("over-quota clamps pct at 100 and sisa at 0", () => {
    const r = quotaInfo(120, 100);
    expect(r.pct).toBeLessThanOrEqual(100);
    expect(r.pct).toBe(100);
    expect(r.sisa).toBe(0);
  });

  it("zero kuota → pct 0, no NaN", () => {
    const r = quotaInfo(10, 0);
    expect(r.pct).toBe(0);
    expect(Number.isNaN(r.pct)).toBe(false);
  });
});

describe("paymentAging", () => {
  const TODAY = "2026-05-20";

  it("lists Tertunda payments older than threshold with day count", () => {
    const list = [
      makePendaftar({
        noPendaftaran: "PPDB-A",
        namaLengkap: "Andi",
        pembayaran: [
          { id: "1", judul: "Uang Pangkal", tanggal: "2026-05-01", jumlah: 500, status: "Tertunda" },
        ],
      }),
      makePendaftar({
        noPendaftaran: "PPDB-B",
        namaLengkap: "Budi",
        pembayaran: [
          { id: "2", judul: "Seragam", tanggal: "2026-05-19", jumlah: 200, status: "Tertunda" },
        ],
      }),
    ];
    const rows = paymentAging(list, TODAY, 7);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.noPendaftaran).toBe("PPDB-A");
    expect(rows[0]!.jumlah).toBe(500);
    expect(rows[0]!.hari).toBe(19); // 2026-05-01 → 2026-05-20
  });

  it("ignores non-Tertunda and NaN dates", () => {
    const list = [
      makePendaftar({
        pembayaran: [
          { id: "1", judul: "Uang Pangkal", tanggal: "2026-05-01", jumlah: 1, status: "Lunas" },
          { id: "2", judul: "Seragam", tanggal: "bad-date", jumlah: 1, status: "Tertunda" },
        ],
      }),
    ];
    expect(paymentAging(list, TODAY, 7)).toEqual([]);
  });

  it("empty list → empty array", () => {
    expect(paymentAging([], TODAY, 7)).toEqual([]);
  });
});

// Sanity: every analytic survives the real PPDB_LIST fixture without throwing.
describe("PPDB_LIST fixtures", () => {
  it("all analytics run on the real fixture and stay within bounds", () => {
    const summary = paymentSummary(PPDB_LIST);
    expect(summary.pctCollected).toBeLessThanOrEqual(100);
    expect(summary.pctCollected).toBeGreaterThanOrEqual(0);
    expect(jalurDistribution(PPDB_LIST).reduce((a, d) => a + d.value, 0)).toBe(
      PPDB_LIST.length,
    );
    expect(scoreHistogram(PPDB_LIST).length).toBe(10);
    expect(quotaInfo(PPDB_LIST.length, 50).pct).toBeLessThanOrEqual(100);
    expect(() => paymentAging(PPDB_LIST, "2026-06-01", 14)).not.toThrow();
  });
});
