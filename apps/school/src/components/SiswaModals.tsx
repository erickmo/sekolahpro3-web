import { useState, type FormEvent } from "react";
import {
  Button,
  Checkbox,
  DatePicker,
  FormField,
  FormGrid,
  Input,
  Modal,
  SearchableSelect,
  Textarea,
} from "@sekolahpro/ui";
import type {
  AbsensiRow,
  DokumenRow,
  MutasiRow,
  PembayaranRow,
  TagihanRow,
  WaliRow,
} from "../data/siswa";

interface BaseModalProps {
  open: boolean;
  onClose: () => void;
}

// ─── Wali ───────────────────────────────────────────────────────────────────

interface WaliModalProps extends BaseModalProps {
  initial?: Partial<WaliRow>;
  onSubmit: (w: WaliRow) => void;
}

export function WaliModal({ open, onClose, initial, onSubmit }: WaliModalProps) {
  const [v, setV] = useState<WaliRow>({
    hubungan: "Ayah",
    nama: "",
    nik: "",
    nikAyah: "",
    nikIbu: "",
    namaAyahKk: "",
    isPrimary: false,
    pekerjaan: "",
    penghasilan: "",
    pendidikan: "",
    telepon: "",
    email: "",
    alamat: "",
    ...initial,
  });
  const [err, setErr] = useState<Record<string, string>>({});

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!v.nama.trim()) errs.nama = "Wajib diisi";
    if (v.nik && !/^\d{16}$/.test(v.nik)) errs.nik = "NIK harus 16 digit";
    if (v.hubungan === "Ayah" && v.nikAyah && !/^\d{16}$/.test(v.nikAyah)) {
      errs.nikAyah = "NIK Ayah harus 16 digit";
    }
    if (v.hubungan === "Ibu" && v.nikIbu && !/^\d{16}$/.test(v.nikIbu)) {
      errs.nikIbu = "NIK Ibu harus 16 digit";
    }
    if (Object.keys(errs).length) { setErr(errs); return; }
    onSubmit(v);
    onClose();
  };

  const isAyah = v.hubungan === "Ayah";
  const isIbu = v.hubungan === "Ibu";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Edit Wali" : "Tambah Wali"}
      description="Data Ayah, Ibu, atau Wali resmi (child table dari Siswa)"
      size="lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
          <Button type="button" onClick={(e) => submit(e as unknown as FormEvent)}>Simpan</Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <FormGrid cols={2}>
          <FormField label="Hubungan" required>
            <SearchableSelect
              value={v.hubungan}
              onChange={(val) => setV({ ...v, hubungan: val as WaliRow["hubungan"] })}
              options={[
                { value: "Ayah", label: "Ayah" },
                { value: "Ibu", label: "Ibu" },
                { value: "Wali", label: "Wali" },
              ]}
            />
          </FormField>
          <FormField label="Nama Lengkap" required error={err.nama}>
            <Input value={v.nama} onChange={(e) => setV({ ...v, nama: e.target.value })} />
          </FormField>
          {isAyah ? (
            <>
              <FormField label="NIK Ayah (KK)" hint="16 digit, dari KK" error={err.nikAyah}>
                <Input
                  inputMode="numeric"
                  maxLength={16}
                  value={v.nikAyah ?? ""}
                  onChange={(e) => setV({ ...v, nikAyah: e.target.value.replace(/\D/g, "") })}
                />
              </FormField>
              <FormField label="Nama Ayah (KK)" hint="Sesuai Kartu Keluarga untuk Dapodik">
                <Input value={v.namaAyahKk ?? ""} onChange={(e) => setV({ ...v, namaAyahKk: e.target.value })} />
              </FormField>
            </>
          ) : null}
          {isIbu ? (
            <FormField label="NIK Ibu (KK)" hint="16 digit, dari KK" error={err.nikIbu}>
              <Input
                inputMode="numeric"
                maxLength={16}
                value={v.nikIbu ?? ""}
                onChange={(e) => setV({ ...v, nikIbu: e.target.value.replace(/\D/g, "") })}
              />
            </FormField>
          ) : null}
          <FormField label="NIK (generic)" hint="16 digit — fallback bila NIK Ayah/Ibu kosong" error={err.nik}>
            <Input inputMode="numeric" maxLength={16} value={v.nik ?? ""} onChange={(e) => setV({ ...v, nik: e.target.value.replace(/\D/g, "") })} />
          </FormField>
          <FormField label="Telepon">
            <Input type="tel" value={v.telepon ?? ""} onChange={(e) => setV({ ...v, telepon: e.target.value })} />
          </FormField>
          <FormField label="Pekerjaan">
            <Input value={v.pekerjaan ?? ""} onChange={(e) => setV({ ...v, pekerjaan: e.target.value })} />
          </FormField>
          <FormField label="Penghasilan">
            <Input value={v.penghasilan ?? ""} onChange={(e) => setV({ ...v, penghasilan: e.target.value })} placeholder="contoh: Rp 3-5 juta" />
          </FormField>
          <FormField label="Pendidikan Terakhir">
            <SearchableSelect
              value={v.pendidikan ?? ""}
              onChange={(val) => setV({ ...v, pendidikan: val })}
              options={["SD","SMP","SMA/SMK","D1","D2","D3","S1","S2","S3"].map((p) => ({ value: p, label: p }))}
              placeholder="— Pilih —"
            />
          </FormField>
          <FormField label="Email">
            <Input type="email" value={v.email ?? ""} onChange={(e) => setV({ ...v, email: e.target.value })} />
          </FormField>
          <FormField label="Alamat" className="sm:col-span-2">
            <Textarea rows={2} value={v.alamat ?? ""} onChange={(e) => setV({ ...v, alamat: e.target.value })} />
          </FormField>
          <FormField label="Wali Utama" className="sm:col-span-2" hint="Hanya 1 wali per siswa boleh ditandai sebagai utama — menerima semua notifikasi dan approval portal">
            <Checkbox
              checked={!!v.isPrimary}
              onChange={(e) => setV({ ...v, isPrimary: e.target.checked })}
              label="Tandai sebagai wali utama (primary contact)"
            />
          </FormField>
        </FormGrid>
      </form>
    </Modal>
  );
}

// ─── Tagihan ────────────────────────────────────────────────────────────────

interface TagihanModalProps extends BaseModalProps {
  onSubmit: (t: TagihanRow) => void;
}

export function TagihanModal({ open, onClose, onSubmit }: TagihanModalProps) {
  const [v, setV] = useState<TagihanRow>({
    id: `INV-${Date.now().toString(36).toUpperCase()}`,
    judul: "",
    jatuhTempo: "",
    jumlah: 0,
    status: "Tertunda",
    dibayar: 0,
  });
  const [err, setErr] = useState<Record<string, string>>({});

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!v.judul.trim()) errs.judul = "Wajib diisi";
    if (!v.jatuhTempo) errs.jatuhTempo = "Wajib diisi";
    if (v.jumlah <= 0) errs.jumlah = "Harus > 0";
    if (Object.keys(errs).length) { setErr(errs); return; }
    onSubmit(v);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Buat Tagihan"
      description="Tagihan baru untuk siswa"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
          <Button type="button" onClick={(e) => submit(e as unknown as FormEvent)}>Simpan</Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <FormGrid cols={2}>
          <FormField label="ID Tagihan" className="sm:col-span-2">
            <Input value={v.id} onChange={(e) => setV({ ...v, id: e.target.value })} />
          </FormField>
          <FormField label="Judul" required error={err.judul} className="sm:col-span-2">
            <Input value={v.judul} onChange={(e) => setV({ ...v, judul: e.target.value })} placeholder="contoh: SPP April 2026" />
          </FormField>
          <FormField label="Jatuh Tempo" required error={err.jatuhTempo}>
            <DatePicker value={v.jatuhTempo} onChange={(val) => setV({ ...v, jatuhTempo: val })} />
          </FormField>
          <FormField label="Jumlah (Rp)" required error={err.jumlah}>
            <Input inputMode="numeric" value={String(v.jumlah || "")} onChange={(e) => setV({ ...v, jumlah: Number(e.target.value.replace(/\D/g, "")) || 0 })} />
          </FormField>
          <FormField label="Status">
            <SearchableSelect
              value={v.status}
              onChange={(val) => setV({ ...v, status: val as TagihanRow["status"] })}
              options={["Tertunda","Jatuh Tempo","Cicilan","Lunas"].map((o) => ({ value: o, label: o }))}
            />
          </FormField>
        </FormGrid>
      </form>
    </Modal>
  );
}

// ─── Pembayaran ─────────────────────────────────────────────────────────────

interface PembayaranModalProps extends BaseModalProps {
  tagihanList?: TagihanRow[];
  onSubmit: (p: PembayaranRow) => void;
}

export function PembayaranModal({ open, onClose, tagihanList, onSubmit }: PembayaranModalProps) {
  const [v, setV] = useState<PembayaranRow>({
    id: `PAY-${Date.now().toString(36).toUpperCase()}`,
    tanggal: new Date().toISOString().slice(0, 10),
    metode: "Transfer",
    jumlah: 0,
    ref: "",
    penerima: "Bendahara",
  });
  const [refTagihan, setRefTagihan] = useState<string>("");
  const [err, setErr] = useState<Record<string, string>>({});

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (v.jumlah <= 0) errs.jumlah = "Harus > 0";
    if (!v.tanggal) errs.tanggal = "Wajib diisi";
    if (Object.keys(errs).length) { setErr(errs); return; }
    onSubmit({ ...v, ref: v.ref || refTagihan });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Catat Pembayaran"
      description="Catat pembayaran masuk"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
          <Button type="button" onClick={(e) => submit(e as unknown as FormEvent)}>Simpan</Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <FormGrid cols={2}>
          {tagihanList && tagihanList.length > 0 ? (
            <FormField label="Tagihan" className="sm:col-span-2">
              <SearchableSelect
                value={refTagihan}
                onChange={(val) => setRefTagihan(val)}
                options={tagihanList
                  .filter((t) => t.status !== "Lunas")
                  .map((t) => ({ value: t.id, label: `${t.id} · ${t.judul}` }))}
                placeholder="— Pilih tagihan —"
              />
            </FormField>
          ) : null}
          <FormField label="Tanggal" required error={err.tanggal}>
            <DatePicker value={v.tanggal} onChange={(val) => setV({ ...v, tanggal: val })} />
          </FormField>
          <FormField label="Jumlah (Rp)" required error={err.jumlah}>
            <Input inputMode="numeric" value={String(v.jumlah || "")} onChange={(e) => setV({ ...v, jumlah: Number(e.target.value.replace(/\D/g, "")) || 0 })} />
          </FormField>
          <FormField label="Metode" required>
            <SearchableSelect
              value={v.metode}
              onChange={(val) => setV({ ...v, metode: val as PembayaranRow["metode"] })}
              options={["Tunai","Transfer","QRIS","Virtual Account"].map((o) => ({ value: o, label: o }))}
            />
          </FormField>
          <FormField label="Referensi">
            <Input value={v.ref} onChange={(e) => setV({ ...v, ref: e.target.value })} placeholder="No. invoice / VA" />
          </FormField>
          <FormField label="Penerima" className="sm:col-span-2">
            <Input value={v.penerima} onChange={(e) => setV({ ...v, penerima: e.target.value })} />
          </FormField>
        </FormGrid>
      </form>
    </Modal>
  );
}

// ─── Mutasi ─────────────────────────────────────────────────────────────────

interface MutasiModalProps extends BaseModalProps {
  onSubmit: (m: MutasiRow) => void;
}

export function MutasiModal({ open, onClose, onSubmit }: MutasiModalProps) {
  const [v, setV] = useState<MutasiRow>({
    tanggal: new Date().toISOString().slice(0, 10),
    jenis: "Naik Kelas",
    dari: "",
    ke: "",
    keterangan: "",
  });
  const [err, setErr] = useState<Record<string, string>>({});

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!v.tanggal) { setErr({ tanggal: "Wajib diisi" }); return; }
    onSubmit(v);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Catat Mutasi"
      description="Perubahan status atau kelas siswa"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
          <Button type="button" onClick={(e) => submit(e as unknown as FormEvent)}>Simpan</Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <FormGrid cols={2}>
          <FormField label="Tanggal" required error={err.tanggal}>
            <DatePicker value={v.tanggal} onChange={(val) => setV({ ...v, tanggal: val })} />
          </FormField>
          <FormField label="Jenis" required>
            <SearchableSelect
              value={v.jenis}
              onChange={(val) => setV({ ...v, jenis: val as MutasiRow["jenis"] })}
              options={["Naik Kelas","Tinggal Kelas","Pindah Keluar","DO","Masuk"].map((o) => ({ value: o, label: o }))}
            />
          </FormField>
          <FormField label="Dari">
            <Input value={v.dari ?? ""} onChange={(e) => setV({ ...v, dari: e.target.value })} placeholder="contoh: X-IPA-1" />
          </FormField>
          <FormField label="Ke">
            <Input value={v.ke ?? ""} onChange={(e) => setV({ ...v, ke: e.target.value })} placeholder="contoh: XI-IPA-1" />
          </FormField>
          <FormField label="Keterangan" className="sm:col-span-2">
            <Textarea rows={3} value={v.keterangan ?? ""} onChange={(e) => setV({ ...v, keterangan: e.target.value })} />
          </FormField>
        </FormGrid>
      </form>
    </Modal>
  );
}

// ─── Dokumen ────────────────────────────────────────────────────────────────

interface DokumenModalProps extends BaseModalProps {
  onSubmit: (d: DokumenRow) => void;
}

const DOKUMEN_TIPE: DokumenRow["tipe"][] = ["Ijazah","Akta","KK","KTP","Foto","Rapor","Lainnya"];

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function DokumenModal({ open, onClose, onSubmit }: DokumenModalProps) {
  const [v, setV] = useState<DokumenRow>({
    nama: "",
    tipe: "Lainnya",
    ukuran: "",
    diunggah: new Date().toISOString().slice(0, 10),
    url: "",
  });
  const [wajib, setWajib] = useState(false);
  const [err, setErr] = useState<Record<string, string>>({});

  const onFile = (file: File | null) => {
    if (!file) return;
    setV((prev) => ({
      ...prev,
      nama: prev.nama || file.name,
      ukuran: formatSize(file.size),
    }));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!v.nama.trim()) { setErr({ nama: "Wajib diisi" }); return; }
    onSubmit(v);
    console.info("[dokumen] wajib?", wajib);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Unggah Dokumen"
      description="Tambahkan dokumen pendukung siswa"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
          <Button type="button" onClick={(e) => submit(e as unknown as FormEvent)}>Simpan</Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <FormField label="File">
          <input
            type="file"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-brand file:text-white file:px-3 file:py-2 file:text-sm file:cursor-pointer hover:file:bg-brand/90"
          />
        </FormField>
        <FormGrid cols={2}>
          <FormField label="Nama Dokumen" required error={err.nama} className="sm:col-span-2">
            <Input value={v.nama} onChange={(e) => setV({ ...v, nama: e.target.value })} />
          </FormField>
          <FormField label="Tipe" required>
            <SearchableSelect
              value={v.tipe}
              onChange={(val) => setV({ ...v, tipe: val as DokumenRow["tipe"] })}
              options={DOKUMEN_TIPE.map((t) => ({ value: t, label: t }))}
            />
          </FormField>
          <FormField label="Ukuran">
            <Input value={v.ukuran} onChange={(e) => setV({ ...v, ukuran: e.target.value })} placeholder="otomatis dari file" />
          </FormField>
          <FormField label="Tanggal Unggah">
            <DatePicker value={v.diunggah} onChange={(val) => setV({ ...v, diunggah: val })} />
          </FormField>
          <FormField label="URL">
            <Input value={v.url ?? ""} onChange={(e) => setV({ ...v, url: e.target.value })} placeholder="https://..." />
          </FormField>
        </FormGrid>
        <Checkbox
          label="Tandai sebagai dokumen wajib"
          checked={wajib}
          onChange={(e) => setWajib(e.target.checked)}
        />
      </form>
    </Modal>
  );
}

// ─── Confirm ────────────────────────────────────────────────────────────────

interface ConfirmModalProps extends BaseModalProps {
  title: string;
  description?: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
}

export function ConfirmModal({ open, onClose, title, description, confirmLabel = "Konfirmasi", danger, onConfirm }: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button
            onClick={() => { onConfirm(); onClose(); }}
            className={danger ? "!bg-rose-600 hover:!bg-rose-700" : ""}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {description && <p className="text-sm text-muted-fg">{description}</p>}
    </Modal>
  );
}

// ─── Catatan ────────────────────────────────────────────────────────────────

export interface CatatanPayload {
  judul: string;
  isi: string;
  kategori: "Umum" | "Akademik" | "Disiplin" | "Kesehatan" | "Keuangan";
  pribadi: boolean;
}

interface CatatanModalProps extends BaseModalProps {
  onSubmit: (c: CatatanPayload) => void;
}

export function CatatanModal({ open, onClose, onSubmit }: CatatanModalProps) {
  const [v, setV] = useState<CatatanPayload>({ judul: "", isi: "", kategori: "Umum", pribadi: false });
  const [err, setErr] = useState<Record<string, string>>({});

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!v.judul.trim()) errs.judul = "Wajib diisi";
    if (!v.isi.trim()) errs.isi = "Wajib diisi";
    if (Object.keys(errs).length) { setErr(errs); return; }
    onSubmit(v);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tambah Catatan"
      description="Catatan internal terkait siswa"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
          <Button type="button" onClick={(e) => submit(e as unknown as FormEvent)}>Simpan</Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <FormGrid cols={2}>
          <FormField label="Judul" required error={err.judul} className="sm:col-span-2">
            <Input value={v.judul} onChange={(e) => setV({ ...v, judul: e.target.value })} />
          </FormField>
          <FormField label="Kategori" required>
            <SearchableSelect
              value={v.kategori}
              onChange={(val) => setV({ ...v, kategori: val as CatatanPayload["kategori"] })}
              options={["Umum","Akademik","Disiplin","Kesehatan","Keuangan"].map((o) => ({ value: o, label: o }))}
            />
          </FormField>
          <FormField label="Visibilitas">
            <Checkbox label="Hanya untuk staf (pribadi)" checked={v.pribadi} onChange={(e) => setV({ ...v, pribadi: e.target.checked })} />
          </FormField>
          <FormField label="Isi Catatan" required error={err.isi} className="sm:col-span-2">
            <Textarea rows={5} value={v.isi} onChange={(e) => setV({ ...v, isi: e.target.value })} />
          </FormField>
        </FormGrid>
      </form>
    </Modal>
  );
}

// ─── Pesan ──────────────────────────────────────────────────────────────────

export interface PesanPayload {
  kanal: "Email" | "WhatsApp" | "SMS" | "In-App";
  penerima: string;
  subjek: string;
  isi: string;
}

interface PesanModalProps extends BaseModalProps {
  defaultPenerima?: string;
  defaultKanal?: PesanPayload["kanal"];
  onSubmit: (p: PesanPayload) => void;
}

export function PesanModal({ open, onClose, defaultPenerima, defaultKanal, onSubmit }: PesanModalProps) {
  const [v, setV] = useState<PesanPayload>({
    kanal: defaultKanal ?? "WhatsApp",
    penerima: defaultPenerima ?? "",
    subjek: "",
    isi: "",
  });
  const [err, setErr] = useState<Record<string, string>>({});

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!v.penerima.trim()) errs.penerima = "Wajib diisi";
    if (!v.isi.trim()) errs.isi = "Wajib diisi";
    if (v.kanal === "Email" && !v.subjek.trim()) errs.subjek = "Subjek wajib untuk email";
    if (Object.keys(errs).length) { setErr(errs); return; }
    onSubmit(v);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Kirim Pesan"
      description="Pesan ke siswa atau wali"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
          <Button type="button" onClick={(e) => submit(e as unknown as FormEvent)}>Kirim</Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <FormGrid cols={2}>
          <FormField label="Kanal" required>
            <SearchableSelect
              value={v.kanal}
              onChange={(val) => setV({ ...v, kanal: val as PesanPayload["kanal"] })}
              options={["WhatsApp","Email","SMS","In-App"].map((o) => ({ value: o, label: o }))}
            />
          </FormField>
          <FormField label="Penerima" required error={err.penerima}>
            <Input value={v.penerima} onChange={(e) => setV({ ...v, penerima: e.target.value })} placeholder={v.kanal === "Email" ? "alamat@email" : "+62..."} />
          </FormField>
          {v.kanal === "Email" && (
            <FormField label="Subjek" required error={err.subjek} className="sm:col-span-2">
              <Input value={v.subjek} onChange={(e) => setV({ ...v, subjek: e.target.value })} />
            </FormField>
          )}
          <FormField label="Isi Pesan" required error={err.isi} className="sm:col-span-2">
            <Textarea rows={5} value={v.isi} onChange={(e) => setV({ ...v, isi: e.target.value })} />
          </FormField>
        </FormGrid>
      </form>
    </Modal>
  );
}

// ─── Absensi Manual ─────────────────────────────────────────────────────────

interface AbsensiModalProps extends BaseModalProps {
  defaultPencatat?: string;
  onSubmit: (a: AbsensiRow) => void;
}

export function AbsensiModal({ open, onClose, defaultPencatat, onSubmit }: AbsensiModalProps) {
  const [v, setV] = useState<AbsensiRow>({
    tanggal: new Date().toISOString().slice(0, 10),
    status: "Hadir",
    keterangan: "",
    pencatat: defaultPencatat ?? "Wali Kelas",
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!v.tanggal) return;
    onSubmit(v);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Catat Absensi Manual"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
          <Button type="button" onClick={(e) => submit(e as unknown as FormEvent)}>Simpan</Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <FormGrid cols={2}>
          <FormField label="Tanggal" required>
            <DatePicker value={v.tanggal} onChange={(val) => setV({ ...v, tanggal: val })} />
          </FormField>
          <FormField label="Status" required>
            <SearchableSelect
              value={v.status}
              onChange={(val) => setV({ ...v, status: val as AbsensiRow["status"] })}
              options={["Hadir","Sakit","Izin","Alpa","Terlambat"].map((o) => ({ value: o, label: o }))}
            />
          </FormField>
          <FormField label="Pencatat" className="sm:col-span-2">
            <Input value={v.pencatat} onChange={(e) => setV({ ...v, pencatat: e.target.value })} />
          </FormField>
          <FormField label="Keterangan" className="sm:col-span-2">
            <Textarea rows={3} value={v.keterangan ?? ""} onChange={(e) => setV({ ...v, keterangan: e.target.value })} />
          </FormField>
        </FormGrid>
      </form>
    </Modal>
  );
}

// ─── Periode Filter ─────────────────────────────────────────────────────────

export interface PeriodeRange {
  from: string;
  to: string;
}

interface PeriodeModalProps extends BaseModalProps {
  initial?: PeriodeRange | undefined;
  onApply: (r: PeriodeRange) => void;
  onClear?: (() => void) | undefined;
}

export function PeriodeModal({ open, onClose, initial, onApply, onClear }: PeriodeModalProps) {
  const [v, setV] = useState<PeriodeRange>(initial ?? { from: "", to: "" });

  const apply = () => {
    onApply(v);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Filter Periode"
      size="sm"
      footer={
        <>
          {onClear && <Button variant="ghost" onClick={() => { onClear(); onClose(); }}>Reset</Button>}
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={apply}>Terapkan</Button>
        </>
      }
    >
      <FormGrid cols={2}>
        <FormField label="Dari">
          <DatePicker value={v.from} onChange={(val) => setV({ ...v, from: val })} />
        </FormField>
        <FormField label="Sampai">
          <DatePicker value={v.to} onChange={(val) => setV({ ...v, to: val })} />
        </FormField>
      </FormGrid>
    </Modal>
  );
}

// ─── Pilih Semester ─────────────────────────────────────────────────────────

export interface SemesterPick {
  tahunAjaran: string;
  semester: "Ganjil" | "Genap";
}

interface SemesterModalProps extends BaseModalProps {
  initial?: SemesterPick;
  onPick: (s: SemesterPick) => void;
}

const TAHUN_AJARAN = ["2022/2023","2023/2024","2024/2025","2025/2026","2026/2027"];

export function SemesterModal({ open, onClose, initial, onPick }: SemesterModalProps) {
  const [v, setV] = useState<SemesterPick>(initial ?? { tahunAjaran: "2025/2026", semester: "Genap" });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Pilih Semester"
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={() => { onPick(v); onClose(); }}>Terapkan</Button>
        </>
      }
    >
      <FormGrid cols={2}>
        <FormField label="Tahun Ajaran">
          <SearchableSelect
            value={v.tahunAjaran}
            onChange={(val) => setV({ ...v, tahunAjaran: val })}
            options={TAHUN_AJARAN.map((t) => ({ value: t, label: t }))}
          />
        </FormField>
        <FormField label="Semester">
          <SearchableSelect
            value={v.semester}
            onChange={(val) => setV({ ...v, semester: val as SemesterPick["semester"] })}
            options={[
              { value: "Ganjil", label: "Ganjil" },
              { value: "Genap", label: "Genap" },
            ]}
          />
        </FormField>
      </FormGrid>
    </Modal>
  );
}
