import { describe, it, expect } from "vitest";
import { cutiTone, absensiTone, skTone } from "./badge";
import { formatTanggal } from "../api/portalPegawai";

describe("badge tones", () => {
  it("maps cuti status to tone", () => {
    expect(cutiTone("Disetujui")).toBe("success");
    expect(cutiTone("Ditolak")).toBe("danger");
    expect(cutiTone("Diajukan")).toBe("warning");
    expect(cutiTone("Selesai")).toBe("brand");
    expect(cutiTone("???")).toBe("neutral");
  });

  it("maps absensi status to tone (Alpha + Alpa)", () => {
    expect(absensiTone("Hadir")).toBe("success");
    expect(absensiTone("Alpha")).toBe("danger");
    expect(absensiTone("Alpa")).toBe("danger");
    expect(absensiTone("Sakit")).toBe("warning");
  });

  it("maps SK status to tone", () => {
    expect(skTone("Diterbitkan")).toBe("success");
    expect(skTone("Dicabut")).toBe("danger");
    expect(skTone("Draft")).toBe("neutral");
  });
});

describe("formatTanggal", () => {
  it("formats ISO date in id-ID", () => {
    expect(formatTanggal("2026-06-23")).toMatch(/2026/);
  });
  it("returns dash for empty/invalid", () => {
    expect(formatTanggal()).toBe("-");
    expect(formatTanggal("")).toBe("-");
    expect(formatTanggal("not-a-date")).toBe("-");
  });
});
