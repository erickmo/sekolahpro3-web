import { describe, it, expect } from "vitest";
import { mapKtpToCalon, mapKkToWizard } from "./ocrMapping";

describe("mapKtpToCalon", () => {
  const fullKtp = {
    nik: "3201234567890001",
    nama: "Budi Santoso",
    jenis_kelamin: "Laki-laki",
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

  it("normalizes jenis_kelamin Laki-laki -> L", () => {
    const result = mapKtpToCalon({ jenis_kelamin: "Laki-laki" });
    expect(result["calon.jenis_kelamin"]).toBe("L");
  });

  it("normalizes jenis_kelamin Perempuan -> P", () => {
    const result = mapKtpToCalon({ jenis_kelamin: "Perempuan" });
    expect(result["calon.jenis_kelamin"]).toBe("P");
  });

  it("omits calon.jenis_kelamin when gender is unknown", () => {
    const result = mapKtpToCalon({ nik: "3201234567890001", jenis_kelamin: "X" });
    expect("calon.jenis_kelamin" in result).toBe(false);
    expect("calon.nik" in result).toBe(true);
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

describe("mapKkToWizard", () => {
  const kkFixture = {
    no_kk: "3201000000000001",
    alamat: "Jl. Nusantara No. 5",
    rt_rw: "001/002",
    desa_kelurahan: "Sukamaju",
    kecamatan: "Cibeunying",
    kabupaten_kota: "Bandung",
    provinsi: "Jawa Barat",
    kode_pos: "40132",
    anggota: [
      {
        nik: "3201010101800001",
        nama: "Ahmad Fauzi",
        jenis_kelamin: "Laki-laki",
        status_hubungan: "Kepala Keluarga",
      },
      {
        nik: "3201010101820002",
        nama: "Siti Aminah",
        jenis_kelamin: "Perempuan",
        status_hubungan: "Istri",
      },
      {
        nik: "3201010101100003",
        nama: "Rizky Fauzi",
        jenis_kelamin: "Laki-laki",
        status_hubungan: "Anak",
      },
    ],
  };

  it("maps calon.* from the Anak member", () => {
    const result = mapKkToWizard(kkFixture);
    expect(result["calon.nik"]).toBe("3201010101100003");
    expect(result["calon.nama_lengkap"]).toBe("Rizky Fauzi");
    expect(result["calon.jenis_kelamin"]).toBe("L");
  });

  it("maps calon.alamat from the KK header, not the member row", () => {
    const result = mapKkToWizard(kkFixture);
    expect(result["calon.alamat"]).toBe("Jl. Nusantara No. 5");
  });

  it("normalizes anak gender Perempuan -> P", () => {
    const fixture = {
      ...kkFixture,
      anggota: [
        ...kkFixture.anggota.slice(0, 2),
        { nik: "3201010101100004", nama: "Dewi Fauzi", jenis_kelamin: "Perempuan", status_hubungan: "Anak" },
      ],
    };
    const result = mapKkToWizard(fixture);
    expect(result["calon.jenis_kelamin"]).toBe("P");
  });

  it("maps ortu.nama_ayah from Kepala Keluarga (male)", () => {
    const result = mapKkToWizard(kkFixture);
    expect(result["ortu.nama_ayah"]).toBe("Ahmad Fauzi");
  });

  it("maps ortu.nama_ibu from Istri", () => {
    const result = mapKkToWizard(kkFixture);
    expect(result["ortu.nama_ibu"]).toBe("Siti Aminah");
  });

  it("omits calon.* entirely when no Anak member is present", () => {
    const noAnak = {
      ...kkFixture,
      anggota: kkFixture.anggota.filter((m) => m.status_hubungan !== "Anak"),
    };
    const result = mapKkToWizard(noAnak);
    expect("calon.nik" in result).toBe(false);
    expect("calon.nama_lengkap" in result).toBe(false);
    expect("calon.jenis_kelamin" in result).toBe(false);
    expect("calon.alamat" in result).toBe(false);
  });

  it("still maps ortu fields even when no Anak member", () => {
    const noAnak = {
      ...kkFixture,
      anggota: kkFixture.anggota.filter((m) => m.status_hubungan !== "Anak"),
    };
    const result = mapKkToWizard(noAnak);
    expect(result["ortu.nama_ayah"]).toBe("Ahmad Fauzi");
    expect(result["ortu.nama_ibu"]).toBe("Siti Aminah");
  });

  it("returns empty object when anggota is empty and no header address", () => {
    const result = mapKkToWizard({ anggota: [] });
    expect(result).toEqual({});
  });

  it("omits ortu.nama_ayah when no Kepala Keluarga or Suami present", () => {
    const noAyah = {
      ...kkFixture,
      anggota: [
        { nik: "3201010101820002", nama: "Siti Aminah", jenis_kelamin: "Perempuan", status_hubungan: "Istri" },
        { nik: "3201010101100003", nama: "Rizky Fauzi", jenis_kelamin: "Laki-laki", status_hubungan: "Anak" },
      ],
    };
    const result = mapKkToWizard(noAyah);
    expect("ortu.nama_ayah" in result).toBe(false);
    expect(result["ortu.nama_ibu"]).toBe("Siti Aminah");
  });
});
