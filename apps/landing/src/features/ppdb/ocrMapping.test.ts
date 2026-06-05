import { describe, it, expect } from "vitest";
import { mapKtpToCalon } from "./ocrMapping";

describe("mapKtpToCalon", () => {
  const fullKtp = {
    nik: "3201234567890001",
    nama: "Budi Santoso",
    jenis_kelamin: "L",
    tempat_lahir: "Bandung",
    tanggal_lahir: "2000-05-20",
    alamat: "Jl. Merdeka No. 1",
  };

  it("maps all KTP fields to calon.* paths", () => {
    const result = mapKtpToCalon(fullKtp);
    expect(result).toEqual({
      "calon.nik": "3201234567890001",
      "calon.nama_lengkap": "Budi Santoso",
      "calon.jenis_kelamin": "L",
      "calon.tempat_lahir": "Bandung",
      "calon.tanggal_lahir": "2000-05-20",
      "calon.alamat": "Jl. Merdeka No. 1",
    });
  });

  it("omits absent fields — returns only keys with values", () => {
    const result = mapKtpToCalon({ nik: "3201234567890001", nama: "Budi Santoso" });
    expect(Object.keys(result)).toEqual(["calon.nik", "calon.nama_lengkap"]);
    expect("calon.tempat_lahir" in result).toBe(false);
  });

  it("omits empty-string fields", () => {
    const result = mapKtpToCalon({ nik: "3201234567890001", nama: "" });
    expect("calon.nama_lengkap" in result).toBe(false);
    expect("calon.nik" in result).toBe(true);
  });

  it("ignores unknown keys from parsed payload", () => {
    const result = mapKtpToCalon({ nik: "3201234567890001", agama: "Islam", golongan_darah: "O" });
    expect(Object.keys(result)).toEqual(["calon.nik"]);
  });

  it("returns empty object when no recognisable fields present", () => {
    expect(mapKtpToCalon({})).toEqual({});
  });
});
