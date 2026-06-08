import { describe, it, expect } from "vitest";
import { kelasRoles, isKepsekKelas, isWaliKelas, KELAS_ROLE_LABEL } from "./kelasRole";

describe("kelasRole", () => {
  it("maps a pure Kepala Sekolah to the kepsek surface", () => {
    expect(kelasRoles(["Kepala Sekolah"]).primary).toBe("kepsek");
  });

  it("maps a Wali Kelas to the wali_kelas surface", () => {
    expect(kelasRoles(["Wali Kelas"]).primary).toBe("wali_kelas");
    // real wali sessions also carry a Guru role; wali_kelas must still win
    expect(kelasRoles(["Pegawai Guru", "Wali Kelas"]).primary).toBe("wali_kelas");
  });

  it("maps Kepala Tata Usaha to tu, NOT kepsek (the 'kepala' substring trap)", () => {
    expect(kelasRoles(["Kepala Tata Usaha"]).primary).toBe("tu");
    expect(kelasRoles(["Tata Usaha"]).primary).toBe("tu");
  });

  it("a dual TU+Kepsek user defaults to the TU board (daily structure job)", () => {
    expect(kelasRoles(["Kepala Sekolah", "Tata Usaha"]).primary).toBe("tu");
  });

  it("falls back to tu for an empty session or an unrecognized role", () => {
    expect(kelasRoles([]).primary).toBe("tu");
    expect(kelasRoles(["Pegawai Guru"]).primary).toBe("tu");
  });

  it("exposes primary-based role predicates", () => {
    expect(isKepsekKelas(["Kepala Sekolah"])).toBe(true);
    expect(isKepsekKelas(["Wali Kelas"])).toBe(false);
    expect(isWaliKelas(["Pegawai Guru", "Wali Kelas"])).toBe(true);
    expect(isWaliKelas(["Kepala Sekolah"])).toBe(false);
  });

  it("has a Bahasa label per role", () => {
    expect(KELAS_ROLE_LABEL.kepsek).toBe("Kepala Sekolah");
    expect(KELAS_ROLE_LABEL.tu).toBe("Tata Usaha");
    expect(KELAS_ROLE_LABEL.wali_kelas).toBe("Wali Kelas");
  });
});
