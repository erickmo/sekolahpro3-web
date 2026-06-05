import { describe, it, expect } from "vitest";
import { mapKtpToSiswa, mapKtpToWali } from "./ocrMapping";

describe("ocrMapping", () => {
  describe("mapKtpToSiswa", () => {
    it("maps all KTP fields to Siswa form keys", () => {
      expect(
        mapKtpToSiswa({
          nik: "3171234567890123",
          nama: "BUDI SANTOSO",
          jenis_kelamin: "Laki-laki",
          tempat_lahir: "JAKARTA",
          tanggal_lahir: "1985-08-17",
          agama: "Islam",
          alamat: "JL MERDEKA",
        }),
      ).toEqual({
        nik: "3171234567890123",
        namaLengkap: "BUDI SANTOSO",
        jenisKelamin: "Laki-laki",
        tempatLahir: "JAKARTA",
        tanggalLahir: "1985-08-17",
        agama: "Islam",
        alamat: "JL MERDEKA",
      });
    });

    it("omits absent fields", () => {
      expect(mapKtpToSiswa({ nik: "3171234567890123" })).toEqual({
        nik: "3171234567890123",
      });
    });

    it("omits empty-string values", () => {
      expect(mapKtpToSiswa({ nik: "3171234567890123", nama: "" })).toEqual({
        nik: "3171234567890123",
      });
    });

    it("ignores unknown OCR keys", () => {
      expect(mapKtpToSiswa({ unknown_field: "X", nik: "123" })).toEqual({
        nik: "123",
      });
    });
  });

  describe("mapKtpToWali — NIK routing by hubungan", () => {
    it("routes NIK to nikAyah for Ayah", () => {
      expect(mapKtpToWali({ nik: "x", nama: "BUDI" }, "Ayah")).toEqual({
        nama: "BUDI",
        nikAyah: "x",
      });
    });

    it("routes NIK to nikIbu for Ibu", () => {
      expect(mapKtpToWali({ nik: "y" }, "Ibu")).toEqual({ nikIbu: "y" });
    });

    it("routes NIK to nik (generic) for Wali", () => {
      expect(mapKtpToWali({ nik: "z" }, "Wali")).toEqual({ nik: "z" });
    });

    it("includes pekerjaan and alamat when present", () => {
      expect(
        mapKtpToWali({ nama: "SRI", pekerjaan: "Guru", alamat: "JL DAMAI" }, "Ibu"),
      ).toEqual({ nama: "SRI", pekerjaan: "Guru", alamat: "JL DAMAI" });
    });

    it("omits empty pekerjaan/alamat", () => {
      expect(mapKtpToWali({ nama: "ANI", pekerjaan: "", alamat: "" }, "Wali")).toEqual({
        nama: "ANI",
      });
    });
  });
});
