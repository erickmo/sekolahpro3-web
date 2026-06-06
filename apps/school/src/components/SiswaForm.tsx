import { useRef, useState, type FormEvent } from "react";
import {
  Avatar,
  Badge,
  Button,
  Checkbox,
  DatePicker,
  FormField,
  FormGrid,
  IdScanField,
  Input,
  SearchableSelect,
  SectionCard,
  Textarea,
  IconCheck,
} from "@sekolahpro/ui";
import type { Agama, JenisKelamin, Siswa, StatusSiswa, WaliRow } from "../data/siswa";
import { WaliModal } from "./SiswaModals";
import { scanIdentitas } from "../lib/ocrApi";
import { mapKtpToSiswa } from "../lib/ocrMapping";

export type SiswaFormValues = Omit<Siswa,
  "nilai" | "absensi" | "tagihan" | "pembayaran" | "mutasi" | "dokumen" | "aktivitas" |
  "rataNilai" | "persenKehadiran" | "saldoTagihan"
>;

// Tanggal lahir: rentang lebar untuk lompatan tahun cepat (mundur jauh).
const BIRTH_YEAR_FROM = 1940;
const CURRENT_YEAR = new Date().getFullYear();
// Tanggal diterima bersifat akademik/transaksional, jadi rentang sempit.
const ENROLL_YEAR_FROM = CURRENT_YEAR - 10;
const ENROLL_YEAR_TO = CURRENT_YEAR + 1;

interface SiswaFormProps {
  initial?: Partial<SiswaFormValues>;
  mode: "create" | "edit";
  onCancel: () => void;
  onSubmit: (values: SiswaFormValues) => void;
  submitting?: boolean;
}

const STATUS_OPTIONS: StatusSiswa[] = ["Calon", "Aktif", "Alumni", "Pindah Keluar", "DO"];
const JK_OPTIONS: JenisKelamin[] = ["Laki-laki", "Perempuan"];
const AGAMA_OPTIONS: Agama[] = ["Islam", "Kristen", "Katolik", "Hindu", "Budha", "Konghucu"];
const JENJANG_OPTIONS = ["SD", "SMP", "SMA", "SMK"];
const TAHUN_OPTIONS = ["2022/2023", "2023/2024", "2024/2025", "2025/2026"];
const KELAS_OPTIONS = ["X-IPA-1","X-IPA-2","X-IPS-1","XI-IPA-1","XI-IPA-2","XI-IPS-1","XII-IPA-1","XII-IPA-2","XII-IPS-1"];
const KEBUTUHAN_OPTIONS = ["Normal","Tunanetra","Tunarungu","Tunagrahita","Tunadaksa","Autisme","ADHD","Lainnya"];
const TRANSPORT_OPTIONS = ["Jalan Kaki","Sepeda","Sepeda Motor","Mobil","Angkutan Umum","Antar Jemput"];

function defaults(initial?: Partial<SiswaFormValues>): SiswaFormValues {
  return {
    nis: "",
    nisn: "",
    nik: "",
    namaLengkap: "",
    namaPanggilan: "",
    jenisKelamin: "Laki-laki",
    tempatLahir: "",
    tanggalLahir: "",
    agama: "Islam",
    kewarganegaraan: "WNI",
    status: "Calon",
    jenjang: "SMA",
    kelas: KELAS_OPTIONS[0]!,
    rombel: "",
    tahunMasuk: TAHUN_OPTIONS[2]!,
    asalSekolah: "",
    noSttb: "",
    tanggalDiterima: "",
    kebutuhanKhusus: "Normal",
    alatTransportasi: "",
    jarakRumah: "",
    waktuTempuh: "",
    penghasilanOrtu: "",
    penerimaKip: false,
    noKip: "",
    penerimaKps: false,
    noKps: "",
    alamat: "",
    rt: "",
    rw: "",
    desa: "",
    kecamatan: "",
    kabupaten: "",
    provinsi: "",
    kodePos: "",
    telepon: "",
    email: "",
    fotoUrl: "",
    wali: [],
    ...initial,
  } as SiswaFormValues;
}

type Errors = Partial<Record<keyof SiswaFormValues, string>>;

function validate(v: SiswaFormValues): Errors {
  const e: Errors = {};
  if (!v.namaLengkap.trim()) e.namaLengkap = "Wajib diisi";
  if (!v.nis.trim()) e.nis = "Wajib diisi";
  if (!v.nisn.trim()) e.nisn = "Wajib diisi";
  if (v.nisn && !/^\d{10}$/.test(v.nisn)) e.nisn = "NISN harus 10 digit";
  if (!v.tanggalLahir) e.tanggalLahir = "Wajib diisi";
  if (!v.tempatLahir.trim()) e.tempatLahir = "Wajib diisi";
  if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) e.email = "Format email tidak valid";
  if (v.nik && !/^\d{16}$/.test(v.nik)) e.nik = "NIK harus 16 digit";
  return e;
}

export function SiswaForm({ initial, mode, onCancel, onSubmit, submitting }: SiswaFormProps) {
  const [values, setValues] = useState<SiswaFormValues>(() => defaults(initial));
  const [errors, setErrors] = useState<Errors>({});
  const [waliModalOpen, setWaliModalOpen] = useState(false);
  const [waliEditIdx, setWaliEditIdx] = useState<number | null>(null);
  const fotoInputRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof SiswaFormValues>(key: K, val: SiswaFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleFotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    set("fotoUrl", URL.createObjectURL(file));
  };

  const waliRows: WaliRow[] = values.wali ?? [];

  const handleWaliSubmit = (w: WaliRow) => {
    const next = waliEditIdx != null
      ? waliRows.map((r, i) => (i === waliEditIdx ? w : r))
      : [...waliRows, w];
    set("wali", next);
    setWaliEditIdx(null);
  };

  const handleWaliRemove = (idx: number) => {
    set("wali", waliRows.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const errs = validate(values);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      const firstKey = Object.keys(errs)[0];
      const el = document.querySelector(`[name="${firstKey}"]`) as HTMLElement | null;
      el?.focus();
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setErrors({});
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <SectionCard title="Identitas" description="Data dasar siswa">
        {/* OCR auto-fill: scan KTP to pre-populate identity fields. */}
        <IdScanField
          jenis="KTP"
          onScan={(blob, jenis) => scanIdentitas(blob, jenis).then((r) => ({ fields: r.fields, confidence: r.confidence }))}
          onApply={(fields) =>
            setValues((prev) => ({ ...prev, ...(mapKtpToSiswa(fields) as Partial<SiswaFormValues>) }))
          }
        />
        <FormGrid cols={3}>
          <FormField label="Nama Lengkap" required error={errors.namaLengkap}>
            <Input name="namaLengkap" value={values.namaLengkap} onChange={(e) => set("namaLengkap", e.target.value)} />
          </FormField>
          <FormField label="Nama Panggilan">
            <Input name="namaPanggilan" value={values.namaPanggilan ?? ""} onChange={(e) => set("namaPanggilan", e.target.value)} />
          </FormField>
          <FormField label="Jenis Kelamin" required>
            <SearchableSelect
              value={values.jenisKelamin}
              onChange={(v) => set("jenisKelamin", v as JenisKelamin)}
              options={JK_OPTIONS.map((j) => ({ value: j, label: j }))}
            />
          </FormField>
          <FormField label="Tempat Lahir" required error={errors.tempatLahir}>
            <Input name="tempatLahir" value={values.tempatLahir} onChange={(e) => set("tempatLahir", e.target.value)} />
          </FormField>
          <FormField label="Tanggal Lahir" required error={errors.tanggalLahir}>
            <DatePicker
              name="tanggalLahir"
              value={values.tanggalLahir}
              onChange={(v) => set("tanggalLahir", v)}
              captionLayout="dropdown-buttons"
              fromYear={BIRTH_YEAR_FROM}
              toYear={CURRENT_YEAR}
            />
          </FormField>
          <FormField label="Agama" required>
            <SearchableSelect
              value={values.agama}
              onChange={(v) => set("agama", v as Agama)}
              options={AGAMA_OPTIONS.map((a) => ({ value: a, label: a }))}
            />
          </FormField>
          <FormField label="NIK" hint="16 digit" error={errors.nik}>
            <Input name="nik" inputMode="numeric" maxLength={16} value={values.nik ?? ""} onChange={(e) => set("nik", e.target.value.replace(/\D/g, ""))} />
          </FormField>
          <FormField label="Kewarganegaraan" required>
            <SearchableSelect
              value={values.kewarganegaraan}
              onChange={(v) => set("kewarganegaraan", v as "WNI" | "WNA")}
              options={[
                { value: "WNI", label: "WNI" },
                { value: "WNA", label: "WNA" },
              ]}
            />
          </FormField>
        </FormGrid>
      </SectionCard>

      <SectionCard title="Administrasi Sekolah" description="Identitas akademik & rombel">
        <FormGrid cols={3}>
          <FormField label="NIS" required error={errors.nis}>
            <Input name="nis" value={values.nis} onChange={(e) => set("nis", e.target.value)} disabled={mode === "edit"} />
          </FormField>
          <FormField label="NISN" required hint="10 digit" error={errors.nisn}>
            <Input name="nisn" inputMode="numeric" maxLength={10} value={values.nisn} onChange={(e) => set("nisn", e.target.value.replace(/\D/g, ""))} />
          </FormField>
          <FormField label="Status" required>
            <SearchableSelect
              value={values.status}
              onChange={(v) => set("status", v as StatusSiswa)}
              options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
            />
          </FormField>
          <FormField label="Jenjang" required hint="Ditetapkan otomatis">
            <SearchableSelect
              value={values.jenjang}
              onChange={(v) => set("jenjang", v)}
              options={JENJANG_OPTIONS.map((j) => ({ value: j, label: j }))}
              disabled
            />
          </FormField>
          <FormField label="Kelas" required hint="Ditetapkan otomatis">
            <SearchableSelect
              value={values.kelas}
              onChange={(v) => set("kelas", v)}
              options={KELAS_OPTIONS.map((k) => ({ value: k, label: k }))}
              disabled
            />
          </FormField>
          <FormField label="Rombel" hint="Ditetapkan otomatis">
            <Input
              name="rombel"
              value={values.rombel}
              onChange={(e) => set("rombel", e.target.value)}
              placeholder="contoh: X-IPA-1 A"
              readOnly
              className="bg-muted text-muted-fg cursor-not-allowed"
            />
          </FormField>
          <FormField label="Tahun Masuk" required>
            <SearchableSelect
              value={values.tahunMasuk}
              onChange={(v) => set("tahunMasuk", v)}
              options={TAHUN_OPTIONS.map((t) => ({ value: t, label: t }))}
            />
          </FormField>
          <FormField label="Tanggal Diterima">
            <DatePicker
              name="tanggalDiterima"
              value={values.tanggalDiterima ?? ""}
              onChange={(v) => set("tanggalDiterima", v)}
              captionLayout="dropdown-buttons"
              fromYear={ENROLL_YEAR_FROM}
              toYear={ENROLL_YEAR_TO}
            />
          </FormField>
          <FormField label="Asal Sekolah">
            <Input name="asalSekolah" value={values.asalSekolah ?? ""} onChange={(e) => set("asalSekolah", e.target.value)} />
          </FormField>
          <FormField label="No. STTB / Ijazah">
            <Input name="noSttb" value={values.noSttb ?? ""} onChange={(e) => set("noSttb", e.target.value)} />
          </FormField>
        </FormGrid>
      </SectionCard>

      <SectionCard title="Data Dapodik" description="Kebutuhan khusus, transportasi, bantuan">
        <FormGrid cols={3}>
          <FormField label="Kebutuhan Khusus">
            <SearchableSelect
              value={values.kebutuhanKhusus ?? "Normal"}
              onChange={(v) => set("kebutuhanKhusus", v)}
              options={KEBUTUHAN_OPTIONS.map((k) => ({ value: k, label: k }))}
            />
          </FormField>
          <FormField label="Alat Transportasi">
            <SearchableSelect
              value={values.alatTransportasi ?? ""}
              onChange={(v) => set("alatTransportasi", v)}
              options={TRANSPORT_OPTIONS.map((t) => ({ value: t, label: t }))}
              placeholder="— Pilih —"
            />
          </FormField>
          <FormField label="Jarak Rumah">
            <Input name="jarakRumah" value={values.jarakRumah ?? ""} onChange={(e) => set("jarakRumah", e.target.value)} placeholder="contoh: 5 km" />
          </FormField>
          <FormField label="Waktu Tempuh">
            <Input name="waktuTempuh" value={values.waktuTempuh ?? ""} onChange={(e) => set("waktuTempuh", e.target.value)} placeholder="contoh: 20 menit" />
          </FormField>
          <FormField label="Penghasilan Orang Tua">
            <Input name="penghasilanOrtu" value={values.penghasilanOrtu ?? ""} onChange={(e) => set("penghasilanOrtu", e.target.value)} placeholder="contoh: Rp 3-5 juta" />
          </FormField>
          <div />
          <FormField label="KIP">
            <div className="flex flex-col gap-2">
              <Checkbox label="Penerima KIP" checked={!!values.penerimaKip} onChange={(e) => set("penerimaKip", e.target.checked)} />
              {values.penerimaKip ? (
                <Input name="noKip" value={values.noKip ?? ""} onChange={(e) => set("noKip", e.target.value)} placeholder="No. KIP" />
              ) : null}
            </div>
          </FormField>
          <FormField label="KPS">
            <div className="flex flex-col gap-2">
              <Checkbox label="Penerima KPS" checked={!!values.penerimaKps} onChange={(e) => set("penerimaKps", e.target.checked)} />
              {values.penerimaKps ? (
                <Input name="noKps" value={values.noKps ?? ""} onChange={(e) => set("noKps", e.target.value)} placeholder="No. KPS" />
              ) : null}
            </div>
          </FormField>
        </FormGrid>
      </SectionCard>

      <SectionCard title="Alamat">
        <FormGrid cols={3}>
          <FormField label="Alamat Jalan" className="sm:col-span-2 lg:col-span-3">
            <Textarea name="alamat" rows={2} value={values.alamat ?? ""} onChange={(e) => set("alamat", e.target.value)} />
          </FormField>
          <FormField label="RT">
            <Input name="rt" value={values.rt ?? ""} onChange={(e) => set("rt", e.target.value.replace(/\D/g, ""))} maxLength={3} />
          </FormField>
          <FormField label="RW">
            <Input name="rw" value={values.rw ?? ""} onChange={(e) => set("rw", e.target.value.replace(/\D/g, ""))} maxLength={3} />
          </FormField>
          <FormField label="Kode Pos">
            <Input name="kodePos" value={values.kodePos ?? ""} onChange={(e) => set("kodePos", e.target.value.replace(/\D/g, ""))} maxLength={5} />
          </FormField>
          <FormField label="Desa/Kelurahan">
            <Input name="desa" value={values.desa ?? ""} onChange={(e) => set("desa", e.target.value)} />
          </FormField>
          <FormField label="Kecamatan">
            <Input name="kecamatan" value={values.kecamatan ?? ""} onChange={(e) => set("kecamatan", e.target.value)} />
          </FormField>
          <FormField label="Kabupaten/Kota">
            <Input name="kabupaten" value={values.kabupaten ?? ""} onChange={(e) => set("kabupaten", e.target.value)} />
          </FormField>
          <FormField label="Provinsi">
            <Input name="provinsi" value={values.provinsi ?? ""} onChange={(e) => set("provinsi", e.target.value)} />
          </FormField>
        </FormGrid>
      </SectionCard>

      <SectionCard title="Kontak">
        <FormGrid cols={2}>
          <FormField label="Telepon">
            <Input name="telepon" type="tel" value={values.telepon ?? ""} onChange={(e) => set("telepon", e.target.value)} placeholder="08xx-xxxx-xxxx" />
          </FormField>
          <FormField label="Email" error={errors.email}>
            <Input name="email" type="email" value={values.email ?? ""} onChange={(e) => set("email", e.target.value)} placeholder="nama@sekolah.sch.id" />
          </FormField>
          <FormField label="Foto Siswa" className="sm:col-span-2" hint="JPG/PNG, maks. 2 MB">
            <div className="flex items-center gap-4">
              <Avatar name={values.namaLengkap} src={values.fotoUrl || null} size="lg" />
              <div className="flex flex-col gap-2">
                <input
                  ref={fotoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFotoSelect}
                />
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" onClick={() => fotoInputRef.current?.click()}>
                    {values.fotoUrl ? "Ganti Foto" : "Unggah Foto"}
                  </Button>
                  {values.fotoUrl ? (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        set("fotoUrl", "");
                        if (fotoInputRef.current) fotoInputRef.current.value = "";
                      }}
                    >
                      Hapus
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          </FormField>
        </FormGrid>
      </SectionCard>

      <SectionCard
        title="Wali Siswa"
        description="Data Ayah, Ibu, atau Wali resmi (child table dari Siswa)"
        action={
          <Button type="button" variant="outline" onClick={() => { setWaliEditIdx(null); setWaliModalOpen(true); }}>
            Tambah Wali
          </Button>
        }
      >
        {waliRows.length === 0 ? (
          <p className="text-sm text-muted-fg py-2">Belum ada data wali. Klik “Tambah Wali” untuk menambah.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-fg">
                  <th className="py-2 pr-3 font-medium">Hubungan</th>
                  <th className="py-2 pr-3 font-medium">Nama</th>
                  <th className="py-2 pr-3 font-medium">Pekerjaan</th>
                  <th className="py-2 pr-3 font-medium">Telepon</th>
                  <th className="py-2 pr-3 font-medium">Utama</th>
                  <th className="py-2 pr-3 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {waliRows.map((w, i) => (
                  <tr key={`${i}-${w.hubungan}-${w.nama}`} className="border-b border-border/60">
                    <td className="py-2 pr-3"><Badge tone="brand">{w.hubungan}</Badge></td>
                    <td className="py-2 pr-3">{w.nama}</td>
                    <td className="py-2 pr-3">{w.pekerjaan || "—"}</td>
                    <td className="py-2 pr-3">{w.telepon || "—"}</td>
                    <td className="py-2 pr-3">{w.isPrimary ? <Badge tone="success">Ya</Badge> : "—"}</td>
                    <td className="py-2 pr-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button type="button" variant="ghost" size="sm" onClick={() => { setWaliEditIdx(i); setWaliModalOpen(true); }}>
                          Edit
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => handleWaliRemove(i)}>
                          Hapus
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <WaliModal
        open={waliModalOpen}
        onClose={() => { setWaliModalOpen(false); setWaliEditIdx(null); }}
        initial={waliEditIdx != null ? waliRows[waliEditIdx] : undefined}
        onSubmit={handleWaliSubmit}
      />

      <div className="sticky bottom-0 -mx-1 px-1 py-3 bg-bg/80 backdrop-blur border-t border-border flex items-center justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Batal
        </Button>
        <Button type="submit" disabled={submitting}>
          <span className="h-4 w-4 mr-1.5"><IconCheck /></span>
          {submitting ? "Menyimpan..." : mode === "create" ? "Simpan Siswa" : "Simpan Perubahan"}
        </Button>
      </div>
    </form>
  );
}
