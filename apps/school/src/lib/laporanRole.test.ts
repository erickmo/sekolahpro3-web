import { describe, it, expect } from "vitest";
import { laporanRoles, LAPORAN_ROLE_LABEL } from "./laporanRole";

describe("laporanRole", () => {
  it("maps Tata Usaha to the tu surface (the report-center's primary persona)", () => {
    expect(laporanRoles(["Tata Usaha"]).primary).toBe("tu");
  });

  it("keeps Kepala Tata Usaha as tu, not kepala (the 'kepala' substring trap)", () => {
    expect(laporanRoles(["Kepala Tata Usaha"]).primary).toBe("tu");
  });

  it("maps Kepala Sekolah to kepala and finance roles to bendahara", () => {
    expect(laporanRoles(["Kepala Sekolah"]).primary).toBe("kepala");
    expect(laporanRoles(["Bendahara"]).primary).toBe("bendahara");
  });

  it("defaults to tu for empty or unrecognized sessions", () => {
    expect(laporanRoles([]).primary).toBe("tu");
    expect(laporanRoles(["Pegawai Guru"]).primary).toBe("tu");
  });

  it("has a Bahasa label per role", () => {
    expect(LAPORAN_ROLE_LABEL.tu).toBe("Tata Usaha");
    expect(LAPORAN_ROLE_LABEL.kepala).toBe("Kepala Sekolah");
  });
});
