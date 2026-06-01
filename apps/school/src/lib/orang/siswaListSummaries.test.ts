import { describe, it, expect } from "vitest";
import {
  summarizeDaftar,
  summarizeKelulusan,
  summarizeMutasi,
  summarizeMutasiMasuk,
  summarizePendaftaran,
  summarizePersetujuan,
  summarizePerubahanData,
  summarizeWali,
  summarizeIjazah,
  SISWA_STATUS_FIELDS,
} from "./siswaListSummaries";

// Each summarizer is a pure (rows) => SummaryItem[] closure built on countBy +
// toSummary. We assert: empty input -> [], counts match, ordering respects the
// page's declared category order, and the buckets sum to the row count.

describe("summarizeDaftar (by status)", () => {
  it("returns [] for an empty list", () => {
    expect(summarizeDaftar([])).toEqual([]);
  });

  it("counts students per status and orders known statuses first", () => {
    const items = summarizeDaftar([
      { name: "1", status: "Aktif" },
      { name: "2", status: "Aktif" },
      { name: "3", status: "Calon" },
      { name: "4", status: "Alumni" },
    ]);
    const byLabel = Object.fromEntries(items.map((i) => [i.label, i.value]));
    expect(byLabel.Aktif).toBe(2);
    expect(byLabel.Calon).toBe(1);
    expect(byLabel.Alumni).toBe(1);
    // "Calon" is declared before "Aktif"? No — order is Calon, Aktif, Alumni…
    expect(items[0]?.label).toBe("Calon");
    expect(items[1]?.label).toBe("Aktif");
  });

  it("buckets missing status into 'Lainnya' and keeps the total", () => {
    const items = summarizeDaftar([{ name: "1" }, { name: "2", status: "Aktif" }]);
    const sum = items.reduce((a, i) => a + i.value, 0);
    expect(sum).toBe(2);
    expect(items.some((i) => i.label === "Lainnya")).toBe(true);
  });

  it("tags known statuses with a tone", () => {
    const items = summarizeDaftar([{ name: "1", status: "Aktif" }]);
    expect(items.find((i) => i.label === "Aktif")?.tone).toBe("emerald");
  });
});

describe("summarizeKelulusan (by workflow_state)", () => {
  it("returns [] for an empty list", () => {
    expect(summarizeKelulusan([])).toEqual([]);
  });

  it("counts decisions per workflow_state", () => {
    const items = summarizeKelulusan([
      { name: "1", workflow_state: "Approved" },
      { name: "2", workflow_state: "Approved" },
      { name: "3", workflow_state: "Draft" },
    ]);
    const byLabel = Object.fromEntries(items.map((i) => [i.label, i.value]));
    expect(byLabel.Approved).toBe(2);
    expect(byLabel.Draft).toBe(1);
  });
});

describe("summarizeMutasi (by workflow_state)", () => {
  it("returns [] for an empty list", () => {
    expect(summarizeMutasi([])).toEqual([]);
  });

  it("counts per workflow_state", () => {
    const items = summarizeMutasi([
      { name: "1", workflow_state: "Pending Ka-TU" },
      { name: "2", workflow_state: "Approved" },
    ]);
    const byLabel = Object.fromEntries(items.map((i) => [i.label, i.value]));
    expect(byLabel["Pending Ka-TU"]).toBe(1);
    expect(byLabel.Approved).toBe(1);
  });
});

describe("summarizeMutasiMasuk (by status)", () => {
  it("returns [] for an empty list", () => {
    expect(summarizeMutasiMasuk([])).toEqual([]);
  });

  it("counts per status", () => {
    const items = summarizeMutasiMasuk([
      { name: "1", status: "Diajukan" },
      { name: "2", status: "Diterima" },
      { name: "3", status: "Diterima" },
    ]);
    const byLabel = Object.fromEntries(items.map((i) => [i.label, i.value]));
    expect(byLabel.Diterima).toBe(2);
    expect(byLabel.Diajukan).toBe(1);
  });
});

describe("summarizePendaftaran (by status)", () => {
  it("returns [] for an empty list", () => {
    expect(summarizePendaftaran([])).toEqual([]);
  });

  it("counts per status", () => {
    const items = summarizePendaftaran([
      { name: "1", status: "Submitted" },
      { name: "2", status: "Diterima" },
    ]);
    const byLabel = Object.fromEntries(items.map((i) => [i.label, i.value]));
    expect(byLabel.Submitted).toBe(1);
    expect(byLabel.Diterima).toBe(1);
  });
});

describe("summarizePersetujuan (by status)", () => {
  it("returns [] for an empty list", () => {
    expect(summarizePersetujuan([])).toEqual([]);
  });

  it("counts per consent status", () => {
    const items = summarizePersetujuan([
      { name: "1", status: "Granted" },
      { name: "2", status: "Granted" },
      { name: "3", status: "Withdrawn" },
    ]);
    const byLabel = Object.fromEntries(items.map((i) => [i.label, i.value]));
    expect(byLabel.Granted).toBe(2);
    expect(byLabel.Withdrawn).toBe(1);
  });
});

describe("summarizePerubahanData (by workflow_state)", () => {
  it("returns [] for an empty list", () => {
    expect(summarizePerubahanData([])).toEqual([]);
  });

  it("counts per workflow_state", () => {
    const items = summarizePerubahanData([
      { name: "1", workflow_state: "Pending Kepsek" },
      { name: "2", workflow_state: "Approved" },
    ]);
    const byLabel = Object.fromEntries(items.map((i) => [i.label, i.value]));
    expect(byLabel["Pending Kepsek"]).toBe(1);
    expect(byLabel.Approved).toBe(1);
  });
});

describe("summarizeWali (by hubungan)", () => {
  it("returns [] for an empty list", () => {
    expect(summarizeWali([])).toEqual([]);
  });

  it("counts per hubungan", () => {
    const items = summarizeWali([
      { name: "1", hubungan: "Ayah" },
      { name: "2", hubungan: "Ibu" },
      { name: "3", hubungan: "Ibu" },
    ]);
    const byLabel = Object.fromEntries(items.map((i) => [i.label, i.value]));
    expect(byLabel.Ibu).toBe(2);
    expect(byLabel.Ayah).toBe(1);
  });
});

describe("summarizeIjazah (by status_distribusi)", () => {
  it("returns [] for an empty list", () => {
    expect(summarizeIjazah([])).toEqual([]);
  });

  it("counts per status_distribusi", () => {
    const items = summarizeIjazah([
      { name: "1", status_distribusi: "Belum Diambil" },
      { name: "2", status_distribusi: "Sudah Diambil" },
    ]);
    const byLabel = Object.fromEntries(items.map((i) => [i.label, i.value]));
    expect(byLabel["Belum Diambil"]).toBe(1);
    expect(byLabel["Sudah Diambil"]).toBe(1);
  });
});

describe("SISWA_STATUS_FIELDS", () => {
  it("exposes a narrow summary field set including name + status", () => {
    expect(SISWA_STATUS_FIELDS).toContain("name");
    expect(SISWA_STATUS_FIELDS).toContain("status");
  });
});
