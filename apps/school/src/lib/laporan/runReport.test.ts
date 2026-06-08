import { describe, it, expect } from "vitest";
import { buildRunRequest, EXPORT_B64, GENERATE } from "./runReport";

describe("laporan runReport — buildRunRequest", () => {
  it("routes a dinas report through export_b64 with sekolah filters", () => {
    const { method, args } = buildRunRequest("Data Siswa Dapodik", "dinas", {
      sekolah: "SD1",
      fmt: "xlsx",
    });
    expect(method).toBe(EXPORT_B64);
    expect(args.report_name).toBe("Data Siswa Dapodik");
    expect(JSON.parse(args.filters as string)).toEqual({ sekolah: "SD1" });
    expect(args.fmt).toBe("xlsx");
  });

  it("routes an engine report through generate with periode/ref", () => {
    const { method, args } = buildRunRequest("Neraca Koperasi", "engine", {
      sekolah: "SD1",
      fmt: "xlsx",
      periode: "Bulanan",
      ref: "2026-06-08",
    });
    expect(method).toBe(GENERATE);
    expect(args.report).toBe("Neraca Koperasi");
    expect(args.periode).toBe("Bulanan");
    expect(args.ref).toBe("2026-06-08");
    expect(args.sekolah).toBe("SD1");
  });
});
