import { describe, it, expect } from "vitest";
import {
  INITIAL_INTEGRASI,
  INITIAL_KEAMANAN,
  INITIAL_PERAN,
  INITIAL_NOTIFIKASI,
  INITIAL_BILLING,
  INITIAL_USAGE,
  defaultPengaturanState,
  type Keamanan,
  type Integrasi,
} from "../data/pengaturan";
import {
  integrationStats,
  integrationDonut,
  securityScore,
  securityGrade,
  roleDistribution,
  notificationCoverage,
  notificationSegments,
  planUsage,
  setupCompleteness,
  moduleStats,
  flagStats,
} from "./pengaturanSummary";

describe("integrationStats", () => {
  it("counts terhubung / belum / error and computes healthPct", () => {
    // Fixture has 5 Terhubung, 2 Belum, 1 Error across 8 entries.
    const s = integrationStats(INITIAL_INTEGRASI);
    expect(s.terhubung).toBe(5);
    expect(s.belum).toBe(2);
    expect(s.error).toBe(1);
    expect(s.total).toBe(8);
    expect(s.healthPct).toBe(Math.round((5 / 8) * 100));
  });

  it("returns 0 healthPct for an empty list (no divide-by-zero)", () => {
    const s = integrationStats([]);
    expect(s).toEqual({ terhubung: 0, belum: 0, error: 0, total: 0, healthPct: 0 });
  });
});

describe("integrationDonut", () => {
  it("omits zero-value entries", () => {
    const allConnected: Integrasi[] = [
      { nama: "A", deskripsi: "", status: "Terhubung" },
      { nama: "B", deskripsi: "", status: "Terhubung" },
    ];
    const donut = integrationDonut(allConnected);
    expect(donut).toHaveLength(1);
    expect(donut[0]?.label).toBe("Terhubung");
    expect(donut[0]?.value).toBe(2);
  });

  it("includes all three buckets when each is non-zero", () => {
    const donut = integrationDonut(INITIAL_INTEGRASI);
    const labels = donut.map((d) => d.label);
    expect(labels).toEqual(["Terhubung", "Belum", "Error"]);
  });
});

describe("securityScore", () => {
  it("scores a strong config as grade A with all 5 factors ok", () => {
    const strong: Keamanan = {
      ...INITIAL_KEAMANAN,
      panjangMin: 12,
      dua2faWajib: "Aktif untuk semua",
      sessionTimeout: 30,
      backupOtomatis: "Harian, 02:00 WIB",
      auditRetensi: 365,
    };
    const res = securityScore(strong);
    expect(res.factors).toHaveLength(5);
    expect(res.factors.every((f) => f.ok)).toBe(true);
    expect(res.score).toBe(100);
    expect(res.grade).toBe("A");
  });

  it("scores a weak config as grade D", () => {
    const weak: Keamanan = {
      ...INITIAL_KEAMANAN,
      panjangMin: 4,
      dua2faWajib: "Tidak aktif",
      sessionTimeout: 120,
      backupOtomatis: "Tidak aktif",
      auditRetensi: 30,
    };
    const res = securityScore(weak);
    expect(res.factors.every((f) => !f.ok)).toBe(true);
    expect(res.score).toBe(0);
    expect(res.grade).toBe("D");
  });

  it("always reports exactly 5 factors", () => {
    expect(securityScore(INITIAL_KEAMANAN).factors).toHaveLength(5);
  });
});

describe("securityGrade", () => {
  it("maps score ranges to letter grades", () => {
    expect(securityGrade(95)).toBe("A");
    expect(securityGrade(90)).toBe("A");
    expect(securityGrade(80)).toBe("B");
    expect(securityGrade(75)).toBe("B");
    expect(securityGrade(60)).toBe("C");
    expect(securityGrade(50)).toBe("C");
    expect(securityGrade(40)).toBe("D");
    expect(securityGrade(0)).toBe("D");
  });
});

describe("roleDistribution", () => {
  it("sorts roles by user count descending", () => {
    const dist = roleDistribution(INITIAL_PERAN);
    const values = dist.map((d) => d.value);
    const sorted = [...values].sort((a, b) => b - a);
    expect(values).toEqual(sorted);
    // Guru (48) has the most users in the fixture.
    expect(dist[0]?.label).toBe("Guru");
    expect(dist[0]?.value).toBe(48);
  });
});

describe("notificationCoverage", () => {
  it("counts true per channel and computes coveragePct", () => {
    const cov = notificationCoverage(INITIAL_NOTIFIKASI);
    // Fixture: email 5, push 5, sms 2, inApp 7 -> 19 true / (7*4) = 28.
    expect(cov.email).toBe(5);
    expect(cov.push).toBe(5);
    expect(cov.sms).toBe(2);
    expect(cov.inApp).toBe(7);
    expect(cov.total).toBe(7);
    expect(cov.coveragePct).toBe(Math.round((19 / 28) * 100));
  });
});

describe("notificationSegments", () => {
  it("returns four channel segments in order", () => {
    const segs = notificationSegments(INITIAL_NOTIFIKASI);
    expect(segs.map((s) => s.label)).toEqual(["Email", "Push", "SMS", "In-App"]);
  });
});

describe("planUsage", () => {
  it("parses storage max from the penyimpanan string and computes pct", () => {
    const usage = planUsage(INITIAL_BILLING, INITIAL_USAGE);
    expect(usage.storage.max).toBe(100); // "100 GB"
    expect(usage.storage.used).toBe(42.3);
    expect(usage.storage.pct).toBe(Math.round((42.3 / 100) * 100));
    expect(usage.siswa.max).toBe(INITIAL_BILLING.maksSiswa);
    expect(usage.siswa.used).toBe(INITIAL_USAGE.siswaAktif);
  });

  it("clamps pct to a maximum of 100 when usage exceeds the limit", () => {
    const usage = planUsage(
      { ...INITIAL_BILLING, maksSiswa: 100 },
      { ...INITIAL_USAGE, siswaAktif: 9999 },
    );
    expect(usage.siswa.pct).toBe(100);
  });
});

describe("setupCompleteness", () => {
  it("reports a high pct for a fully-filled default state", () => {
    const res = setupCompleteness(defaultPengaturanState());
    expect(res.total).toBeGreaterThanOrEqual(7);
    expect(res.items).toHaveLength(res.total);
    expect(res.pct).toBeGreaterThanOrEqual(85);
    expect(res.pct).toBe(Math.round((res.done / res.total) * 100));
  });
});

describe("moduleStats / flagStats", () => {
  it("counts aktif==1 rows for modules", () => {
    const s = moduleStats([{ aktif: 1 }, { aktif: 0 }, { aktif: 1 }]);
    expect(s.aktif).toBe(2);
    expect(s.total).toBe(3);
    expect(s.pct).toBe(Math.round((2 / 3) * 100));
  });

  it("counts enabled==1 rows for feature flags", () => {
    const s = flagStats([{ enabled: 1 }, { enabled: 1 }, { enabled: 0 }, {}]);
    expect(s.aktif).toBe(2);
    expect(s.total).toBe(4);
    expect(s.pct).toBe(Math.round((2 / 4) * 100));
  });

  it("returns 0 pct for an empty list", () => {
    expect(moduleStats([])).toEqual({ aktif: 0, total: 0, pct: 0 });
  });
});
