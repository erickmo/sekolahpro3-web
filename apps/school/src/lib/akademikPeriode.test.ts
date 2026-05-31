import { describe, it, expect } from "vitest";
import {
  resolveTahunAjaran,
  computeSemester,
  isPastPeriod,
  type TahunAjaranRow,
} from "./akademikPeriode";

const TA: TahunAjaranRow[] = [
  { name: "S-2024", nama: "2024/2025", is_current: 0, status: "Closed",
    tanggal_mulai: "2024-07-01", tanggal_selesai: "2025-06-30",
    semester_ganjil_mulai: "2024-07-01", semester_ganjil_akhir: "2024-12-31",
    semester_genap_mulai: "2025-01-01", semester_genap_akhir: "2025-06-30" },
  { name: "S-2025", nama: "2025/2026", is_current: 0, status: "Aktif",
    tanggal_mulai: "2025-07-01", tanggal_selesai: "2026-06-30",
    semester_ganjil_mulai: "2025-07-01", semester_ganjil_akhir: "2025-12-31",
    semester_genap_mulai: "2026-01-01", semester_genap_akhir: "2026-06-30" },
  { name: "S-2026", nama: "2026/2027", is_current: 0, status: "Draft",
    tanggal_mulai: "2026-07-01", tanggal_selesai: "2027-06-30",
    semester_ganjil_mulai: "2026-07-01", semester_ganjil_akhir: "2026-12-31",
    semester_genap_mulai: "2027-01-01", semester_genap_akhir: "2027-06-30" },
];
const REF = new Date("2026-05-31");

describe("resolveTahunAjaran", () => {
  it("URL param menang bila valid", () => {
    expect(resolveTahunAjaran(TA, { urlTa: "S-2024", refDate: REF }).ta).toBe("S-2024");
  });
  it("localStorage menang atas is_current/status", () => {
    expect(resolveTahunAjaran(TA, { storedTa: "S-2024", refDate: REF }).ta).toBe("S-2024");
  });
  it("is_current menang atas status Aktif", () => {
    const list = TA.map((t) => (t.name === "S-2026" ? { ...t, is_current: 1 as const } : t));
    expect(resolveTahunAjaran(list, { refDate: REF }).ta).toBe("S-2026");
  });
  it("fallback status Aktif + hari ini dalam window", () => {
    expect(resolveTahunAjaran(TA, { refDate: REF }).ta).toBe("S-2025");
  });
  it("fallback TA terbaru bila tak ada is_current/Aktif-in-window", () => {
    const list = TA.map((t) => ({ ...t, status: "Draft" as const }));
    expect(resolveTahunAjaran(list, { refDate: REF }).ta).toBe("S-2026");
    expect(resolveTahunAjaran(list, { refDate: REF }).noActiveTa).toBe(true);
  });
  it("URL TA tak dikenal diabaikan", () => {
    expect(resolveTahunAjaran(TA, { urlTa: "X", refDate: REF }).ta).toBe("S-2025");
  });
  it("daftar kosong → ta kosong + noActiveTa", () => {
    expect(resolveTahunAjaran([], { refDate: REF })).toEqual({ ta: "", noActiveTa: true });
  });
});

describe("computeSemester", () => {
  it("hari ini dalam window genap → Genap", () => {
    expect(computeSemester(TA[1], { refDate: REF })).toBe("Genap");
  });
  it("URL/stored menang atas hitung tanggal", () => {
    expect(computeSemester(TA[1], { urlSemester: "Ganjil", refDate: REF })).toBe("Ganjil");
  });
  it("fallback bulan bila window kosong (Mei → Genap)", () => {
    // exactOptionalPropertyTypes: delete via unknown cast
    const bare = { ...TA[1] } as unknown as Record<string, unknown>;
    delete bare["semester_ganjil_mulai"];
    delete bare["semester_ganjil_akhir"];
    delete bare["semester_genap_mulai"];
    delete bare["semester_genap_akhir"];
    expect(computeSemester(bare as unknown as TahunAjaranRow, { refDate: REF })).toBe("Genap");
  });
});

describe("isPastPeriod", () => {
  it("status Closed → true", () => {
    expect(isPastPeriod(TA[0], REF)).toBe(true);
  });
  it("hari ini di luar window TA → true", () => {
    expect(isPastPeriod(TA[2], REF)).toBe(true);
  });
  it("Aktif + dalam window → false", () => {
    expect(isPastPeriod(TA[1], REF)).toBe(false);
  });
});
