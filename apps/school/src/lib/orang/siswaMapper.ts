// Pure mapping layer between the camelCase Siswa view/form model and the
// snake_case "Siswa" backend doctype (sekolahpro/siswa/doctype/siswa).
//
// Layer: domain/mapping. Holds NO react, NO hooks, NO IO — only deterministic
// transforms so it can be unit-tested in isolation and reused by the create,
// edit, and detail routes (single source of truth for field contracts).
//
// Source of truth for field names + Select options: the backend doctype JSON
// (siswa.json, wali_siswa.json). Any mismatch here silently corrupts saves, so
// the option whitelists below MUST mirror the doctype Select options exactly.

import type {
  Agama,
  JenisKelamin,
  MutasiRow,
  NilaiRow,
  Siswa,
  StatusSiswa,
  WaliRow,
} from "../../data/siswa";

// ── Backend doctype shapes (snake_case) ───────────────────────────────────

/** "Wali Siswa" child row (siswa/doctype/wali_siswa), returned inline on the
 *  parent Siswa doc fetch. Field names match the doctype exactly. */
export type WaliSiswaDoc = {
  name?: string;
  hubungan?: "Ayah" | "Ibu" | "Wali";
  nama?: string;
  nik_ortu?: string;
  nik_ayah?: string;
  nama_ayah_kk?: string;
  nik_ibu?: string;
  nama_ibu_kk?: string;
  pendidikan?: string;
  pekerjaan?: string;
  no_hp?: string;
  email?: string;
  is_primary?: 0 | 1 | boolean;
  wali_consent_id?: string;
};

/** Backend "Siswa" doctype (snake_case). `name` == nis (autoname field:nis). */
export type SiswaDoc = {
  name?: string;
  nis?: string;
  nisn?: string;
  nisn_status?: string;
  tanggal_request_nisn?: string;
  nama_lengkap?: string;
  nama_panggilan?: string;
  jenis_kelamin?: JenisKelamin;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  agama?: string;
  kewarganegaraan?: "WNI" | "WNA";
  nik?: string;
  no_kk?: string;
  foto?: string;
  foto_consent_id?: string;
  status?: string;
  kebutuhan_khusus?: string;
  alat_transportasi?: string;
  jarak_rumah?: string;
  waktu_tempuh?: string;
  penghasilan_ortu?: string;
  penerima_kip?: 0 | 1 | boolean;
  no_kip?: string;
  penerima_kps?: 0 | 1 | boolean;
  no_kps?: string;
  asal_sekolah?: string;
  tahun_masuk?: string;
  jenjang?: string;
  sekolah?: string;
  tanggal_diterima?: string;
  no_sttb?: string;
  alamat?: string;
  rt?: string;
  rw?: string;
  desa_kelurahan?: string;
  kecamatan?: string;
  kabupaten_kota?: string;
  provinsi?: string;
  kode_pos?: string;
  wali?: WaliSiswaDoc[];
};

/** Entri Nilai list-row (akademik/doctype/entri_nilai). Numeric components live
 *  in a child table fetched separately — only ref fields available from list. */
export type EntriNilaiRow = {
  name: string;
  siswa?: string;
  mata_pelajaran?: string;
};

/** Mutasi Siswa list-row (siswa/doctype/mutasi_siswa). */
export type MutasiSiswaDoc = {
  name: string;
  siswa?: string;
  jenis_mutasi?: "Naik Kelas" | "Tinggal Kelas" | "Pindah Keluar" | "Drop Out";
  tanggal_mutasi?: string;
  rombel_asal?: string;
  rombel_tujuan?: string;
  sekolah_tujuan?: string;
  alasan_pindah?: string;
  alasan_do?: string;
  keterangan_do?: string;
};

// ── Select option whitelists (mirror doctype) ─────────────────────────────
// Optional Select fields are server-validated; sending a value outside these
// sets raises a Frappe ValidationError. siswaFormToDoc omits any value not in
// the matching set so a create/update never hard-fails on a Select mismatch.

export const KEBUTUHAN_KHUSUS_OPTIONS = [
  "Normal", "A (Tunanetra)", "B (Tunarungu)", "C (Tunagrahita Ringan)",
  "D (Tunadaksa Ringan)", "E (Tunalaras)", "F (Kesulitan Belajar)",
  "G (Tunaganda)", "H (Gifted)", "I (Talented)", "J (Autis)",
  "K (Tunagrahita Sedang)", "L (Tunadaksa Sedang)", "N (Tunanetra dan Tunarungu)",
] as const;

export const ALAT_TRANSPORTASI_OPTIONS = [
  "Jalan Kaki", "Sepeda", "Sepeda Motor", "Kendaraan Pribadi", "Angkutan Umum",
  "Jemputan Sekolah", "Andong/Delman", "Perahu/Sampan", "Lainnya",
] as const;

export const JARAK_RUMAH_OPTIONS = [
  "Kurang dari 1 km", "1 - 3 km", "3 - 5 km", "5 - 10 km", "10 - 20 km",
  "Lebih dari 20 km",
] as const;

export const WAKTU_TEMPUH_OPTIONS = [
  "Kurang dari 30 menit", "30 - 60 menit", "1 - 2 jam", "Lebih dari 2 jam",
] as const;

export const PENGHASILAN_ORTU_OPTIONS = [
  "Kurang dari Rp. 500,000", "Rp. 500,000 - Rp. 999,999",
  "Rp. 1,000,000 - Rp. 1,999,999", "Rp. 2,000,000 - Rp. 4,999,999",
  "Rp. 5,000,000 - Rp. 20,000,000", "Lebih dari Rp. 20,000,000",
] as const;

/** Returns `value` if it is a member of `options`, else undefined (so the key
 *  is dropped from the payload). Guards every optional Select against the
 *  server-side option validation. */
function selectOrOmit(value: string | undefined | null, options: readonly string[]): string | undefined {
  if (!value) return undefined;
  return options.includes(value) ? value : undefined;
}

/** Drop keys whose value is undefined/null/empty-string so partial patches and
 *  create payloads never overwrite a server default (e.g. nisn_status) with an
 *  empty value and never send fields the user left blank. */
function pruneEmpty(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === "") continue;
    out[k] = v;
  }
  return out;
}

// ── Wali (child table) ────────────────────────────────────────────────────

/** Map UI wali rows → "Wali Siswa" child docs. Targets the exact child field
 *  set (no `penghasilan`/`alamat` — those do not exist on the doctype and were
 *  silently dropped by the previous serializer). `telepon` → `no_hp`. */
export function mapWaliRowsToDoc(rows: WaliRow[]): Record<string, unknown>[] {
  return rows.map((w) =>
    pruneEmpty({
      hubungan: w.hubungan,
      nama: w.nama,
      nik_ortu: w.nik,
      nik_ayah: w.nikAyah,
      nik_ibu: w.nikIbu,
      nama_ayah_kk: w.namaAyahKk,
      pendidikan: w.pendidikan,
      pekerjaan: w.pekerjaan,
      no_hp: w.telepon,
      email: w.email,
      is_primary: w.isPrimary ? 1 : 0,
    }),
  );
}

/** Map "Wali Siswa" child docs → UI wali rows (reverse of mapWaliRowsToDoc). */
export function mapWaliDocToRows(wali: WaliSiswaDoc[]): WaliRow[] {
  return wali.map((w) => {
    const row: WaliRow = {
      hubungan: w.hubungan ?? "Wali",
      nama: w.nama ?? "",
    };
    if (w.nik_ortu) row.nik = w.nik_ortu;
    if (w.nik_ayah) row.nikAyah = w.nik_ayah;
    if (w.nik_ibu) row.nikIbu = w.nik_ibu;
    if (w.nama_ayah_kk) row.namaAyahKk = w.nama_ayah_kk;
    if (w.pendidikan) row.pendidikan = w.pendidikan;
    if (w.pekerjaan) row.pekerjaan = w.pekerjaan;
    if (w.no_hp) row.telepon = w.no_hp;
    if (w.email) row.email = w.email;
    if (w.is_primary === 1 || w.is_primary === true) row.isPrimary = true;
    return row;
  });
}

/** Force exactly one primary wali at `primaryIdx` (UU: tepat 1 wali utama).
 *  Pure — moved out of the route so create/edit/detail share one rule. */
export function enforceSinglePrimary(rows: WaliRow[], primaryIdx: number): WaliRow[] {
  return rows.map((r, i) => ({ ...r, isPrimary: i === primaryIdx }));
}

// ── Mutasi / Nilai list-row mappers (moved from the detail route) ──────────

export function mapMutasiRows(rows: MutasiSiswaDoc[]): MutasiRow[] {
  return rows.map((r) => {
    const jenis: MutasiRow["jenis"] =
      r.jenis_mutasi === "Drop Out" ? "DO" : (r.jenis_mutasi ?? "Naik Kelas");
    const ket = r.alasan_pindah ?? r.keterangan_do ?? r.alasan_do ?? undefined;
    const row: MutasiRow = { tanggal: r.tanggal_mutasi ?? "", jenis };
    if (r.rombel_asal) row.dari = r.rombel_asal;
    if (r.rombel_tujuan ?? r.sekolah_tujuan) row.ke = r.rombel_tujuan ?? r.sekolah_tujuan;
    if (ket) row.keterangan = ket;
    return row;
  });
}

export function mapEntriNilaiRows(rows: EntriNilaiRow[]): NilaiRow[] {
  return rows.map((r) => ({
    mapel: r.mata_pelajaran ?? r.name,
    guru: "—",
    pengetahuan: 0,
    keterampilan: 0,
    predikat: "C",
  }));
}

// ── Doc → form / view ─────────────────────────────────────────────────────

/** Map a backend Siswa doc → camelCase form values for the edit prefill.
 *  Returns Partial<Siswa>: the doctype cannot fill UI-only fields (kelas,
 *  rombel, telepon, email) — those stay blank and are dropped on save. */
export function siswaDocToForm(doc: SiswaDoc): Partial<Siswa> {
  return {
    nis: doc.nis ?? doc.name ?? "",
    nisn: doc.nisn ?? "",
    nik: doc.nik,
    noKk: doc.no_kk,
    namaLengkap: doc.nama_lengkap ?? "",
    namaPanggilan: doc.nama_panggilan,
    jenisKelamin: doc.jenis_kelamin ?? "Laki-laki",
    tempatLahir: doc.tempat_lahir ?? "",
    tanggalLahir: doc.tanggal_lahir ?? "",
    agama: (doc.agama as Agama) ?? "Islam",
    kewarganegaraan: doc.kewarganegaraan ?? "WNI",
    status: (doc.status as StatusSiswa) ?? "Aktif",
    jenjang: doc.jenjang ?? "",
    tahunMasuk: doc.tahun_masuk ?? "",
    asalSekolah: doc.asal_sekolah,
    noSttb: doc.no_sttb,
    tanggalDiterima: doc.tanggal_diterima,
    kebutuhanKhusus: doc.kebutuhan_khusus ?? "Normal",
    alatTransportasi: doc.alat_transportasi,
    jarakRumah: doc.jarak_rumah,
    waktuTempuh: doc.waktu_tempuh,
    penghasilanOrtu: doc.penghasilan_ortu,
    penerimaKip: !!doc.penerima_kip,
    noKip: doc.no_kip,
    penerimaKps: !!doc.penerima_kps,
    noKps: doc.no_kps,
    alamat: doc.alamat,
    rt: doc.rt,
    rw: doc.rw,
    desa: doc.desa_kelurahan,
    kecamatan: doc.kecamatan,
    kabupaten: doc.kabupaten_kota,
    provinsi: doc.provinsi,
    kodePos: doc.kode_pos,
    fotoConsentId: doc.foto_consent_id,
    wali: doc.wali?.length ? mapWaliDocToRows(doc.wali) : [],
  };
}

/** Map a backend Siswa doc → a COMPLETE Siswa view model for the detail page.
 *  Relation arrays default to empty and summaries to 0 (their real sources are
 *  wired separately / deferred), so every consumer (.filter/.reduce/.slice)
 *  stays safe. UI-only fields with no doctype source default to "". */
export function siswaDocToView(doc: SiswaDoc): Siswa {
  const form = siswaDocToForm(doc);
  return {
    sekolah: (doc.sekolah ?? "") as Siswa["sekolah"],
    nis: form.nis ?? "",
    nisn: form.nisn ?? "",
    nisnStatus: (doc.nisn_status as Siswa["nisnStatus"]) ?? "Belum Diajukan",
    tanggalRequestNisn: doc.tanggal_request_nisn,
    nik: form.nik,
    noKk: form.noKk,
    fotoConsentId: form.fotoConsentId,
    namaLengkap: form.namaLengkap ?? "",
    namaPanggilan: form.namaPanggilan,
    jenisKelamin: form.jenisKelamin ?? "Laki-laki",
    tempatLahir: form.tempatLahir ?? "",
    tanggalLahir: form.tanggalLahir ?? "",
    agama: form.agama ?? "Islam",
    kewarganegaraan: form.kewarganegaraan ?? "WNI",
    status: form.status ?? "Aktif",
    jenjang: form.jenjang ?? "",
    kelas: "",
    rombel: "",
    tahunMasuk: form.tahunMasuk ?? "",
    asalSekolah: form.asalSekolah,
    noSttb: form.noSttb,
    tanggalDiterima: form.tanggalDiterima,
    kebutuhanKhusus: form.kebutuhanKhusus,
    alatTransportasi: form.alatTransportasi,
    jarakRumah: form.jarakRumah,
    waktuTempuh: form.waktuTempuh,
    penghasilanOrtu: form.penghasilanOrtu,
    penerimaKip: form.penerimaKip,
    noKip: form.noKip,
    penerimaKps: form.penerimaKps,
    noKps: form.noKps,
    alamat: form.alamat,
    rt: form.rt,
    rw: form.rw,
    desa: form.desa,
    kecamatan: form.kecamatan,
    kabupaten: form.kabupaten,
    provinsi: form.provinsi,
    kodePos: form.kodePos,
    telepon: "",
    email: "",
    fotoUrl: doc.foto ?? "",
    wali: form.wali ?? [],
    nilai: [],
    absensi: [],
    tagihan: [],
    pembayaran: [],
    mutasi: [],
    dokumen: [],
    aktivitas: [],
    rataNilai: 0,
    persenKehadiran: 0,
    saldoTagihan: 0,
  };
}

// ── Form → doc ────────────────────────────────────────────────────────────

/** Build the snake_case payload for create/update from camelCase form values.
 *
 *  Deliberately DROPS fields that are server-owned or not on the doctype, so
 *  the form can never corrupt them:
 *   - sekolah        → auto_set_tenant from the X-Active-Sekolah header
 *   - status         → read_only, driven by Pendaftaran/Mutasi/Kelulusan
 *   - kelas, rombel  → not Siswa fields (assigned via Anggota Rombel)
 *   - telepon, email → live on the wali child, not the student
 *   - foto/fotoUrl   → a blob: object URL, never persistable as-is
 *   - nisn_status    → omitted so the doctype default ("Belum Terbit") applies
 *  Optional Selects are whitelisted (selectOrOmit) and empties are pruned so a
 *  partial edit only sends fields the user actually set. `jenjang`/`tahun_masuk`
 *  are real Link names supplied by the form's Link pickers. */
export function siswaFormToDoc(v: Partial<Siswa>): Record<string, unknown> {
  return pruneEmpty({
    nis: v.nis,
    nisn: v.nisn,
    nik: v.nik,
    no_kk: v.noKk,
    nama_lengkap: v.namaLengkap,
    nama_panggilan: v.namaPanggilan,
    jenis_kelamin: v.jenisKelamin,
    tempat_lahir: v.tempatLahir,
    tanggal_lahir: v.tanggalLahir,
    agama: v.agama,
    kewarganegaraan: v.kewarganegaraan,
    jenjang: v.jenjang,
    tahun_masuk: v.tahunMasuk,
    asal_sekolah: v.asalSekolah,
    no_sttb: v.noSttb,
    tanggal_diterima: v.tanggalDiterima,
    kebutuhan_khusus: selectOrOmit(v.kebutuhanKhusus, KEBUTUHAN_KHUSUS_OPTIONS),
    alat_transportasi: selectOrOmit(v.alatTransportasi, ALAT_TRANSPORTASI_OPTIONS),
    jarak_rumah: selectOrOmit(v.jarakRumah, JARAK_RUMAH_OPTIONS),
    waktu_tempuh: selectOrOmit(v.waktuTempuh, WAKTU_TEMPUH_OPTIONS),
    penghasilan_ortu: selectOrOmit(v.penghasilanOrtu, PENGHASILAN_ORTU_OPTIONS),
    penerima_kip: v.penerimaKip ? 1 : 0,
    no_kip: v.noKip,
    penerima_kps: v.penerimaKps ? 1 : 0,
    no_kps: v.noKps,
    alamat: v.alamat,
    rt: v.rt,
    rw: v.rw,
    desa_kelurahan: v.desa,
    kecamatan: v.kecamatan,
    kabupaten_kota: v.kabupaten,
    provinsi: v.provinsi,
    kode_pos: v.kodePos,
    // Child table is sent whole (Frappe replaces it). An empty array is allowed
    // through (pruneEmpty keeps [] — it is neither null nor "") so a save that
    // clears all wali rows is honoured.
    wali: v.wali ? mapWaliRowsToDoc(v.wali) : undefined,
  });
}
