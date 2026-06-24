import { describe, it, expect } from "vitest";
import {
  enforceSinglePrimary,
  mapEntriNilaiRows,
  mapMutasiRows,
  mapWaliDocToRows,
  mapWaliRowsToDoc,
  siswaDocToForm,
  siswaDocToView,
  siswaFormToDoc,
  type SiswaDoc,
} from "./siswaMapper";
import type { Siswa, WaliRow } from "../../data/siswa";

const baseForm: Partial<Siswa> = {
  nis: "20240001",
  nisn: "0012345678",
  namaLengkap: "Budi Santoso",
  jenisKelamin: "Laki-laki",
  tempatLahir: "Bandung",
  tanggalLahir: "2008-05-01",
  agama: "Islam",
  kewarganegaraan: "WNI",
  jenjang: "JENJANG-SMA",
  tahunMasuk: "2024/2025",
  desa: "Sukamaju",
  kabupaten: "Kota Bandung",
};

describe("siswaFormToDoc", () => {
  it("maps camelCase form values to snake_case doctype keys", () => {
    const doc = siswaFormToDoc(baseForm);
    expect(doc.nama_lengkap).toBe("Budi Santoso");
    expect(doc.jenis_kelamin).toBe("Laki-laki");
    expect(doc.tahun_masuk).toBe("2024/2025");
    expect(doc.jenjang).toBe("JENJANG-SMA");
    expect(doc.desa_kelurahan).toBe("Sukamaju");
    expect(doc.kabupaten_kota).toBe("Kota Bandung");
  });

  it("drops server-owned and non-doctype fields", () => {
    const doc = siswaFormToDoc({
      ...baseForm,
      sekolah: "sekolah-a" as Siswa["sekolah"],
      status: "Aktif",
      kelas: "X-IPA-1",
      rombel: "X-IPA-1 A",
      telepon: "08123",
      email: "a@b.c",
      fotoUrl: "blob:http://x/y",
      fotoConsentId: "CONSENT-1",
    });
    expect(doc).not.toHaveProperty("sekolah");
    expect(doc).not.toHaveProperty("status");
    expect(doc).not.toHaveProperty("kelas");
    expect(doc).not.toHaveProperty("rombel");
    expect(doc).not.toHaveProperty("telepon");
    expect(doc).not.toHaveProperty("email");
    expect(doc).not.toHaveProperty("foto");
    expect(doc).not.toHaveProperty("fotoUrl");
    expect(doc).not.toHaveProperty("foto_consent_id");
    expect(doc).not.toHaveProperty("nisn_status");
  });

  it("never sends an empty value that would override a server default", () => {
    const doc = siswaFormToDoc({ ...baseForm, asalSekolah: "", noSttb: undefined });
    expect(doc).not.toHaveProperty("asal_sekolah");
    expect(doc).not.toHaveProperty("no_sttb");
  });

  it("coerces checkbox booleans to 0/1", () => {
    expect(siswaFormToDoc({ ...baseForm, penerimaKip: true }).penerima_kip).toBe(1);
    expect(siswaFormToDoc({ ...baseForm, penerimaKip: false }).penerima_kip).toBe(0);
  });

  it("whitelists optional Select fields and omits invalid values", () => {
    const valid = siswaFormToDoc({ ...baseForm, jarakRumah: "1 - 3 km", kebutuhanKhusus: "Normal" });
    expect(valid.jarak_rumah).toBe("1 - 3 km");
    expect(valid.kebutuhan_khusus).toBe("Normal");

    const invalid = siswaFormToDoc({ ...baseForm, jarakRumah: "5 km", kebutuhanKhusus: "Tunanetra" });
    expect(invalid).not.toHaveProperty("jarak_rumah");
    expect(invalid).not.toHaveProperty("kebutuhan_khusus");
  });

  it("serializes wali with correct child field names and no dead fields", () => {
    const wali: WaliRow[] = [
      { hubungan: "Ayah", nama: "Pak Budi", telepon: "0812", nikAyah: "3273", isPrimary: true, pekerjaan: "Swasta" },
    ];
    const doc = siswaFormToDoc({ ...baseForm, wali });
    const rows = doc.wali as Record<string, unknown>[];
    expect(rows).toHaveLength(1);
    expect(rows[0]!.no_hp).toBe("0812");
    expect(rows[0]!.nik_ayah).toBe("3273");
    expect(rows[0]!.is_primary).toBe(1);
    expect(rows[0]).not.toHaveProperty("penghasilan");
    expect(rows[0]).not.toHaveProperty("alamat");
    expect(rows[0]).not.toHaveProperty("telepon");
  });
});

describe("mapWaliRowsToDoc / mapWaliDocToRows round-trip", () => {
  it("preserves the shared fields across a round trip", () => {
    const rows: WaliRow[] = [
      { hubungan: "Ibu", nama: "Ibu Ani", telepon: "0813", email: "ani@x.id", nikIbu: "9999", pendidikan: "S1", isPrimary: false },
    ];
    const back = mapWaliDocToRows(mapWaliRowsToDoc(rows) as never);
    expect(back[0]!.hubungan).toBe("Ibu");
    expect(back[0]!.nama).toBe("Ibu Ani");
    expect(back[0]!.telepon).toBe("0813");
    expect(back[0]!.email).toBe("ani@x.id");
    expect(back[0]!.nikIbu).toBe("9999");
    expect(back[0]!.pendidikan).toBe("S1");
  });
});

describe("enforceSinglePrimary", () => {
  it("marks exactly one row primary", () => {
    const rows: WaliRow[] = [
      { hubungan: "Ayah", nama: "A", isPrimary: true },
      { hubungan: "Ibu", nama: "B", isPrimary: true },
    ];
    const out = enforceSinglePrimary(rows, 1);
    expect(out.filter((r) => r.isPrimary)).toHaveLength(1);
    expect(out[1]!.isPrimary).toBe(true);
    expect(out[0]!.isPrimary).toBe(false);
  });
});

describe("siswaDocToForm", () => {
  it("maps snake_case doc to camelCase form values", () => {
    const doc: SiswaDoc = {
      name: "20240001",
      nis: "20240001",
      nisn: "0012345678",
      nama_lengkap: "Budi",
      jenis_kelamin: "Laki-laki",
      kabupaten_kota: "Kota Bandung",
      desa_kelurahan: "Sukamaju",
      wali: [{ hubungan: "Ayah", nama: "Pak Budi", no_hp: "0812", is_primary: 1 }],
    };
    const form = siswaDocToForm(doc);
    expect(form.namaLengkap).toBe("Budi");
    expect(form.kabupaten).toBe("Kota Bandung");
    expect(form.desa).toBe("Sukamaju");
    expect(form.wali).toHaveLength(1);
    expect(form.wali![0]!.telepon).toBe("0812");
    expect(form.wali![0]!.isPrimary).toBe(true);
  });

  it("falls back to name when nis is absent", () => {
    expect(siswaDocToForm({ name: "X1" }).nis).toBe("X1");
  });
});

describe("siswaDocToView", () => {
  it("returns a complete Siswa with empty relations and zero summaries", () => {
    const view = siswaDocToView({ name: "X1", nis: "X1", nama_lengkap: "Budi" });
    expect(view.nilai).toEqual([]);
    expect(view.absensi).toEqual([]);
    expect(view.tagihan).toEqual([]);
    expect(view.pembayaran).toEqual([]);
    expect(view.dokumen).toEqual([]);
    expect(view.aktivitas).toEqual([]);
    expect(view.wali).toEqual([]);
    expect(view.rataNilai).toBe(0);
    expect(view.persenKehadiran).toBe(0);
    expect(view.saldoTagihan).toBe(0);
    expect(view.kelas).toBe("");
    expect(view.rombel).toBe("");
  });

  it("stays safe for every array consumer (no undefined relations)", () => {
    const view = siswaDocToView({ name: "X1" });
    expect(() => view.tagihan.filter((t) => t.status !== "Lunas")).not.toThrow();
    expect(() => view.pembayaran.reduce((s, p) => s + p.jumlah, 0)).not.toThrow();
    expect(() => view.nilai.slice(0, 5)).not.toThrow();
  });
});

describe("mapMutasiRows / mapEntriNilaiRows", () => {
  it("maps Drop Out to DO and picks a keterangan", () => {
    const out = mapMutasiRows([
      { name: "M1", jenis_mutasi: "Drop Out", tanggal_mutasi: "2026-01-01", keterangan_do: "alasan" },
    ]);
    expect(out[0]!.jenis).toBe("DO");
    expect(out[0]!.keterangan).toBe("alasan");
  });

  it("maps entri nilai ref rows with safe placeholders", () => {
    const out = mapEntriNilaiRows([{ name: "EN1", mata_pelajaran: "Matematika" }]);
    expect(out[0]!.mapel).toBe("Matematika");
    expect(out[0]!.pengetahuan).toBe(0);
    expect(out[0]!.predikat).toBe("C");
  });
});
