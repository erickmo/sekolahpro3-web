import { describe, it, expect } from "vitest";
import {
  WORKFLOW_STATE,
  JENIS_MUTASI,
  DESTRUCTIVE_JENIS,
  isDestructiveJenis,
} from "./mutasiConstants";

describe("mutasiConstants", () => {
  it("exposes the real workflow state strings", () => {
    expect(WORKFLOW_STATE.DRAFT).toBe("Draft");
    expect(WORKFLOW_STATE.PENDING_KATU).toBe("Pending Ka-TU");
    expect(WORKFLOW_STATE.PENDING_KEPSEK).toBe("Pending Kepsek");
    expect(WORKFLOW_STATE.APPROVED).toBe("Approved");
    expect(WORKFLOW_STATE.REJECTED).toBe("Rejected");
  });

  it("uses the doctype-authoritative Drop Out value (not the short 'DO')", () => {
    // mutasi_siswa.json options = "Naik Kelas\nTinggal Kelas\nPindah Keluar\nDrop Out"
    expect(JENIS_MUTASI.DROP_OUT).toBe("Drop Out");
    expect(JENIS_MUTASI.NAIK_KELAS).toBe("Naik Kelas");
    expect(JENIS_MUTASI.PINDAH_KELUAR).toBe("Pindah Keluar");
    expect(JENIS_MUTASI.TINGGAL_KELAS).toBe("Tinggal Kelas");
  });

  it("destructive jenis = only those the workflow escalates to Pending Kepsek", () => {
    expect(DESTRUCTIVE_JENIS).toContain("Pindah Keluar");
    expect(DESTRUCTIVE_JENIS).toContain("Drop Out");
    expect(DESTRUCTIVE_JENIS).not.toContain("Naik Kelas");
    expect(DESTRUCTIVE_JENIS).not.toContain("Tinggal Kelas");
  });

  it("isDestructiveJenis flags Pindah/DO, not Naik/Tinggal", () => {
    expect(isDestructiveJenis("Drop Out")).toBe(true);
    expect(isDestructiveJenis("Pindah Keluar")).toBe(true);
    expect(isDestructiveJenis("Naik Kelas")).toBe(false);
    expect(isDestructiveJenis("Tinggal Kelas")).toBe(false);
    expect(isDestructiveJenis("")).toBe(false);
  });
});
