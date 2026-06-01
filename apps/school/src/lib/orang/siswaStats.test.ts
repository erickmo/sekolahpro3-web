import { describe, it, expect } from "vitest";
import {
  computeSiswaStats,
  genderSegments,
  statusDonut,
  deriveActionQueue,
  type SiswaRow,
} from "./siswaStats";

// Field names confirmed from src/routes/sch.$sekolah.siswa.daftar.tsx:
// name, nama_lengkap, nis, nisn, jenjang, tahun_masuk, tanggal_lahir,
// jenis_kelamin, agama, status.

const mixed: SiswaRow[] = [
  { name: "S1", status: "Aktif", jenis_kelamin: "Laki-laki", jenjang: "SD", agama: "Islam" },
  { name: "S2", status: "Aktif", jenis_kelamin: "Perempuan", jenjang: "SD", agama: "Kristen" },
  { name: "S3", status: "Calon", jenis_kelamin: "Laki-laki", jenjang: "SMP" },
  { name: "S4", status: "Alumni", jenis_kelamin: "Perempuan", jenjang: "SMP" },
  { name: "S5", status: "Pindah Keluar", jenjang: "SD" },
  { name: "S6", status: "DO" },
  { name: "S7" }, // all-unknown except name
];

describe("computeSiswaStats", () => {
  it("returns a fully zeroed result for empty input", () => {
    const r = computeSiswaStats([]);
    expect(r.total).toBe(0);
    expect(r.aktif).toBe(0);
    expect(r.byStatus).toEqual({});
    expect(r.byGender).toEqual([]);
    expect(r.byJenjang).toEqual([]);
  });

  it("counts total and aktif correctly", () => {
    const r = computeSiswaStats(mixed);
    expect(r.total).toBe(7);
    expect(r.aktif).toBe(2);
  });

  it("buckets missing status as 'Tidak diketahui'", () => {
    const r = computeSiswaStats([{ name: "X" }]);
    expect(r.byStatus["Tidak diketahui"]).toBe(1);
    expect(r.total).toBe(1);
    expect(r.aktif).toBe(0);
  });

  it("byStatus counts sum to total", () => {
    const r = computeSiswaStats(mixed);
    const sum = Object.values(r.byStatus).reduce((a, b) => a + b, 0);
    expect(sum).toBe(r.total);
  });

  it("byGender counts sum to total and uses unknown bucket", () => {
    const r = computeSiswaStats(mixed);
    const sum = r.byGender.reduce((a, b) => a + b.value, 0);
    expect(sum).toBe(r.total);
    const unknown = r.byGender.find((d) => d.label === "Tidak diketahui");
    expect(unknown?.value).toBe(3); // S5, S6, S7 have no gender
  });

  it("byJenjang counts sum to total and buckets unknown", () => {
    const r = computeSiswaStats(mixed);
    const sum = r.byJenjang.reduce((a, b) => a + b.value, 0);
    expect(sum).toBe(r.total);
    const sd = r.byJenjang.find((d) => d.label === "SD");
    expect(sd?.value).toBe(3);
  });

  it("does not throw on all-unknown rows", () => {
    expect(() => computeSiswaStats([{ name: "a" }, { name: "b" }])).not.toThrow();
  });
});

describe("genderSegments", () => {
  it("returns [] for empty input", () => {
    expect(genderSegments([])).toEqual([]);
  });

  it("maps Laki-laki=brand, Perempuan=rose, unknown=neutral", () => {
    const segs = genderSegments(mixed);
    const l = segs.find((s) => s.label === "Laki-laki");
    const p = segs.find((s) => s.label === "Perempuan");
    const u = segs.find((s) => s.label === "Tidak diketahui");
    expect(l?.tone).toBe("brand");
    expect(p?.tone).toBe("rose");
    expect(u?.tone).toBe("neutral");
  });

  it("segment values sum to total", () => {
    const segs = genderSegments(mixed);
    const sum = segs.reduce((a, b) => a + b.value, 0);
    expect(sum).toBe(mixed.length);
  });
});

describe("statusDonut", () => {
  it("returns [] for empty input", () => {
    expect(statusDonut([])).toEqual([]);
  });

  it("maps known statuses to the specified tones", () => {
    const d = statusDonut(mixed);
    const tone = (label: string) => d.find((x) => x.label === label)?.tone;
    expect(tone("Aktif")).toBe("emerald");
    expect(tone("Calon")).toBe("sky");
    expect(tone("Alumni")).toBe("violet");
    expect(tone("Pindah Keluar")).toBe("amber");
    expect(tone("DO")).toBe("rose");
  });

  it("uses neutral tone for unknown status bucket", () => {
    const d = statusDonut([{ name: "X" }]);
    const first = d[0]!;
    expect(first.label).toBe("Tidak diketahui");
    expect(first.tone).toBe("neutral");
  });
});

describe("deriveActionQueue", () => {
  it("returns [] for empty input", () => {
    expect(deriveActionQueue([])).toEqual([]);
  });

  it("returns [] when every student is aktif (nothing to action)", () => {
    const allAktif: SiswaRow[] = [
      { name: "A", status: "Aktif" },
      { name: "B", status: "Aktif" },
    ];
    expect(deriveActionQueue(allAktif)).toEqual([]);
  });

  it("surfaces Calon students awaiting activation", () => {
    const q = deriveActionQueue(mixed);
    const calon = q.find((i) => i.id === "siswa-calon");
    expect(calon).toBeDefined();
    expect(calon?.badge).toBe("1"); // one Calon in mixed
    expect(calon?.tone).toBe("info");
  });

  it("surfaces Pindah Keluar students needing finalisation", () => {
    const q = deriveActionQueue(mixed);
    const pindah = q.find((i) => i.id === "siswa-pindah-keluar");
    expect(pindah?.badge).toBe("1");
    expect(pindah?.tone).toBe("warning");
  });

  it("each item has a stable id, label and tone", () => {
    const q = deriveActionQueue(mixed);
    for (const item of q) {
      expect(item.id).toBeTruthy();
      expect(item.label).toBeTruthy();
      expect(item.tone).toBeTruthy();
    }
  });
});
