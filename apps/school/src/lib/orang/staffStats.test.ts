import { describe, it, expect } from "vitest";
import {
  roleDonut,
  statusKepegawaianBars,
  sertifikasiCoverage,
  aktifCount,
  genderSegments,
  deriveStaffActionQueue,
} from "./staffStats";
import type { PegawaiApi } from "../../features/pegawai/roles";

const guru = (over: Partial<PegawaiApi> = {}): PegawaiApi => ({
  name: "G",
  roles: [{ role: "Pegawai Guru" }],
  is_aktif: 1,
  ...over,
});
const staff = (over: Partial<PegawaiApi> = {}): PegawaiApi => ({
  name: "T",
  roles: [{ role: "Pegawai Staff" }],
  is_aktif: 1,
  ...over,
});
const dual = (over: Partial<PegawaiApi> = {}): PegawaiApi => ({
  name: "D",
  roles: [{ role: "Pegawai Guru" }, { role: "Pegawai Staff" }],
  is_aktif: 1,
  ...over,
});

const list: PegawaiApi[] = [
  guru({ name: "g1", status_kepegawaian: "PNS", jenis_kelamin: "Laki-laki", sudah_sertifikasi: 1 }),
  guru({ name: "g2", status_kepegawaian: "GTY", jenis_kelamin: "Perempuan", sudah_sertifikasi: 0 }),
  staff({ name: "t1", status_kepegawaian: "Honorer", jenis_kelamin: "Perempuan", is_aktif: 0 }),
  dual({ name: "d1", status_kepegawaian: "PPPK", jenis_kelamin: "Laki-laki", sudah_sertifikasi: 1 }),
  guru({ name: "g3", sudah_sertifikasi: 0 }), // unknown status & gender (omitted)
];

describe("roleDonut", () => {
  it("returns [] for empty input", () => {
    expect(roleDonut([])).toEqual([]);
  });

  it("counts Guru, Staff, and Dual-role with correct tones (dual not double-counted)", () => {
    const d = roleDonut(list);
    const find = (label: string) => d.find((x) => x.label === label);
    // g1,g2,g3 = pure guru (3); t1 = pure staff (1); d1 = dual (1)
    expect(find("Guru")?.value).toBe(3);
    expect(find("Guru")?.tone).toBe("brand");
    expect(find("Staff")?.value).toBe(1);
    expect(find("Staff")?.tone).toBe("violet");
    expect(find("Dual-role")?.value).toBe(1);
    expect(find("Dual-role")?.tone).toBe("amber");
  });

  it("role counts sum to total people", () => {
    const d = roleDonut(list);
    const sum = d.reduce((a, b) => a + b.value, 0);
    expect(sum).toBe(list.length);
  });
});

describe("statusKepegawaianBars", () => {
  it("returns [] for empty input", () => {
    expect(statusKepegawaianBars([])).toEqual([]);
  });

  it("groups by status_kepegawaian and buckets unknown to 'Lainnya'", () => {
    const bars = statusKepegawaianBars(list);
    const get = (label: string) => bars.find((b) => b.label === label)?.value;
    expect(get("PNS")).toBe(1);
    expect(get("GTY")).toBe(1);
    expect(get("Honorer")).toBe(1);
    expect(get("PPPK")).toBe(1);
    expect(get("Lainnya")).toBe(1); // g3 has no status
  });

  it("bar values sum to total", () => {
    const bars = statusKepegawaianBars(list);
    const sum = bars.reduce((a, b) => a + b.value, 0);
    expect(sum).toBe(list.length);
  });
});

describe("sertifikasiCoverage", () => {
  it("returns zeroed coverage for empty input without dividing by zero", () => {
    const c = sertifikasiCoverage([]);
    expect(c).toEqual({ certified: 0, total: 0, pct: 0 });
  });

  it("computes coverage over guru only and rounds pct", () => {
    // guru in list: g1(cert), g2(no), d1(dual-guru, cert), g3(no) => total 4, certified 2
    const c = sertifikasiCoverage(list);
    expect(c.total).toBe(4);
    expect(c.certified).toBe(2);
    expect(c.pct).toBe(50);
  });

  it("rounds pct to nearest integer", () => {
    const three: PegawaiApi[] = [
      guru({ name: "a", sudah_sertifikasi: 1 }),
      guru({ name: "b", sudah_sertifikasi: 0 }),
      guru({ name: "c", sudah_sertifikasi: 0 }),
    ];
    // 1/3 = 33.33 -> 33
    expect(sertifikasiCoverage(three).pct).toBe(33);
  });
});

describe("aktifCount", () => {
  it("returns 0 for empty input", () => {
    expect(aktifCount([])).toBe(0);
  });

  it("counts only is_aktif === 1", () => {
    expect(aktifCount(list)).toBe(4); // t1 is inactive
  });
});

describe("genderSegments", () => {
  it("returns [] for empty input", () => {
    expect(genderSegments([])).toEqual([]);
  });

  it("maps Laki-laki=brand, Perempuan=rose, unknown=neutral and sums to total", () => {
    const segs = genderSegments(list);
    const find = (label: string) => segs.find((s) => s.label === label);
    expect(find("Laki-laki")?.tone).toBe("brand");
    expect(find("Perempuan")?.tone).toBe("rose");
    expect(find("Tidak diketahui")?.tone).toBe("neutral");
    const sum = segs.reduce((a, b) => a + b.value, 0);
    expect(sum).toBe(list.length);
  });
});

describe("deriveStaffActionQueue", () => {
  it("returns [] for empty input", () => {
    expect(deriveStaffActionQueue([])).toEqual([]);
  });

  it("surfaces inactive pegawai count", () => {
    const q = deriveStaffActionQueue(list);
    const nonaktif = q.find((i) => i.id === "staff-nonaktif");
    expect(nonaktif?.badge).toBe("1"); // t1
    expect(nonaktif?.tone).toBe("warning");
  });

  it("surfaces guru belum sertifikasi count", () => {
    const q = deriveStaffActionQueue(list);
    const belum = q.find((i) => i.id === "staff-belum-sertifikasi");
    expect(belum?.badge).toBe("2"); // g2, g3
    expect(belum?.tone).toBe("info");
  });

  it("returns [] when all active and all guru certified", () => {
    const clean: PegawaiApi[] = [
      guru({ name: "x", sudah_sertifikasi: 1, is_aktif: 1 }),
      staff({ name: "y", is_aktif: 1 }),
    ];
    expect(deriveStaffActionQueue(clean)).toEqual([]);
  });
});
