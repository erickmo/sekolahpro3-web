/**
 * Modals untuk detail Pendaftaran PPDB:
 *   - UploadDokumenModal — create Dokumen PPDB (Attach link + jenis)
 *   - JadwalWawancaraModal — create Wawancara PPDB (datetime + pewawancara)
 *   - EditWaliModal — update wali fields di Calon Siswa terkait
 *
 * Semua modal: controlled (open/onClose), self-contained mutation + feedback.
 */

import { useEffect, useState, type ReactNode } from "react";
import {
  Button,
  FormField,
  FormGrid,
  Input,
  Modal,
  SearchableSelect,
  type SearchableOption,
} from "@sekolahpro/ui";
import { listResource, useResourceCreate, useResourceUpdate } from "@sekolahpro/api-client";

const inputCls =
  "h-9 w-full rounded-md border border-border bg-bg px-3 text-sm focus:border-brand focus:outline-none";

const USER_DOCTYPE = "User";
const USER_LABEL_FIELD = "full_name";

/** Section heading + grid wrapper for one logical group of fields. */
function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string | undefined;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-muted/20 p-4 sm:p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-fg">{title}</h3>
        {description ? <p className="text-xs text-muted-fg mt-0.5">{description}</p> : null}
      </div>
      <FormGrid cols={2}>{children}</FormGrid>
    </section>
  );
}

/** Async option loader for a Frappe link field (OR-search name + label). */
async function searchLink(
  doctype: string,
  labelField: string,
  q: string,
): Promise<SearchableOption[]> {
  const rows = await listResource<Record<string, string>>(doctype, {
    fields: ["name", labelField],
    ...(q
      ? {
          or_filters: [
            ["name", "like", `%${q}%`],
            [labelField, "like", `%${q}%`],
          ] as [string, string, unknown][],
        }
      : {}),
    limit_page_length: 20,
    order_by: "modified desc",
  });
  return rows.map((r) => ({
    value: r.name ?? "",
    label: r[labelField] ? `${r[labelField]} (${r.name})` : (r.name ?? ""),
  }));
}

function ErrLine({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return (
    <div className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-800">
      {msg}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
//  UploadDokumenModal
// ──────────────────────────────────────────────────────────────────────────────

const JENIS_DOKUMEN = ["Akta Lahir", "Kartu Keluarga", "Ijazah", "Rapor", "Foto", "Surat Keterangan", "Lainnya"];

interface UploadProps {
  open: boolean;
  onClose: () => void;
  pendaftaranName: string;
  onSaved?: () => void;
}

export function UploadDokumenModal({ open, onClose, pendaftaranName, onSaved }: UploadProps) {
  const [jenis, setJenis] = useState("Akta Lahir");
  const [berkas, setBerkas] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const create = useResourceCreate("Dokumen PPDB");

  const reset = () => {
    setJenis("Akta Lahir");
    setBerkas("");
    setErr(null);
  };

  const submit = async () => {
    setErr(null);
    if (!berkas) {
      setErr("Path berkas wajib diisi.");
      return;
    }
    try {
      await create.mutateAsync({
        pendaftaran_ppdb: pendaftaranName,
        jenis,
        berkas,
      });
      reset();
      onSaved?.();
      onClose();
    } catch (e) {
      setErr((e as Error)?.message ?? "Gagal mengunggah dokumen.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose(); }}
      title="Unggah Dokumen PPDB"
      description="Lampirkan berkas dukungan pendaftaran. Tanda * wajib diisi."
      size="mega"
      tone="brand"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => { reset(); onClose(); }}>Batal</Button>
          <Button onClick={submit} disabled={!berkas || create.isPending}>
            {create.isPending ? "Mengunggah..." : "Simpan"}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <FormSection title="Dokumen" description="Jenis dan lokasi berkas yang diunggah.">
          <FormField label="Jenis Dokumen">
            <SearchableSelect
              value={jenis}
              onChange={(v) => setJenis(v)}
              options={JENIS_DOKUMEN.map((j) => ({ value: j, label: j }))}
              placeholder="— pilih —"
            />
          </FormField>
          <FormField
            label="Path Berkas (URL atau /files/...)"
            required
            className="col-span-2"
            hint="Upload file dulu ke Frappe File doctype, lalu tempel path-nya di sini."
          >
            <Input
              value={berkas}
              onChange={(e) => setBerkas(e.target.value)}
              placeholder="/files/akta-lahir.pdf"
            />
          </FormField>
        </FormSection>
        <ErrLine msg={err} />
      </div>
    </Modal>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
//  JadwalWawancaraModal
// ──────────────────────────────────────────────────────────────────────────────

interface WawancaraProps {
  open: boolean;
  onClose: () => void;
  pendaftaranName: string;
  onSaved?: () => void;
}

export function JadwalWawancaraModal({ open, onClose, pendaftaranName, onSaved }: WawancaraProps) {
  const [tanggal, setTanggal] = useState("");
  const [pewawancara, setPewawancara] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const create = useResourceCreate("Wawancara PPDB");

  const reset = () => {
    setTanggal("");
    setPewawancara("");
    setErr(null);
  };

  const submit = async () => {
    setErr(null);
    if (!tanggal) {
      setErr("Tanggal & waktu wajib diisi.");
      return;
    }
    try {
      await create.mutateAsync({
        pendaftaran_ppdb: pendaftaranName,
        tanggal_wawancara: tanggal,
        pewawancara: pewawancara || undefined,
      });
      reset();
      onSaved?.();
      onClose();
    } catch (e) {
      setErr((e as Error)?.message ?? "Gagal menjadwalkan wawancara.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose(); }}
      title="Jadwalkan Wawancara"
      description="Tetapkan waktu dan pewawancara. Tanda * wajib diisi."
      size="mega"
      tone="brand"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => { reset(); onClose(); }}>Batal</Button>
          <Button onClick={submit} disabled={!tanggal || create.isPending}>
            {create.isPending ? "Menyimpan..." : "Jadwalkan"}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <FormSection title="Jadwal Wawancara" description="Waktu pelaksanaan dan petugas pewawancara.">
          {/* Field tanggal_wawancara menyimpan tanggal + jam, sehingga tetap
              memakai input datetime-local (DatePicker hanya mendukung tanggal). */}
          <FormField label="Tanggal & Waktu" required htmlFor="ppdb-wawancara-tanggal">
            <input
              id="ppdb-wawancara-tanggal"
              type="datetime-local"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className={inputCls}
            />
          </FormField>
          <FormField label="Pewawancara (User)">
            <SearchableSelect
              value={pewawancara}
              onChange={(v) => setPewawancara(v)}
              loadOptions={(q) => searchLink(USER_DOCTYPE, USER_LABEL_FIELD, q)}
              placeholder="Cari pewawancara…"
            />
          </FormField>
        </FormSection>
        <ErrLine msg={err} />
      </div>
    </Modal>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
//  EditWaliModal
// ──────────────────────────────────────────────────────────────────────────────

interface WaliInitial {
  nama_wali?: string | undefined;
  hubungan_wali?: string | undefined;
  no_hp_wali?: string | undefined;
  pekerjaan_wali?: string | undefined;
  penghasilan_wali?: string | undefined;
}

interface WaliProps {
  open: boolean;
  onClose: () => void;
  calonName: string;
  initial?: WaliInitial;
  onSaved?: () => void;
}

export function EditWaliModal({ open, onClose, calonName, initial, onSaved }: WaliProps) {
  const [form, setForm] = useState<WaliInitial>({});
  const [err, setErr] = useState<string | null>(null);
  const update = useResourceUpdate("Calon Siswa");

  useEffect(() => {
    if (open) setForm(initial ?? {});
  }, [open, initial]);

  const set = (k: keyof WaliInitial, v: string) => setForm((cur) => ({ ...cur, [k]: v }));

  const submit = async () => {
    setErr(null);
    try {
      await update.mutateAsync({
        name: calonName,
        patch: {
          nama_wali: form.nama_wali ?? undefined,
          hubungan_wali: form.hubungan_wali ?? undefined,
          no_hp_wali: form.no_hp_wali ?? undefined,
          pekerjaan_wali: form.pekerjaan_wali ?? undefined,
          penghasilan_wali: form.penghasilan_wali ?? undefined,
        },
      });
      onSaved?.();
      onClose();
    } catch (e) {
      setErr((e as Error)?.message ?? "Gagal menyimpan wali.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Data Wali"
      description="Wali tersimpan di Calon Siswa (1 wali per calon)."
      size="mega"
      tone="brand"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={submit} disabled={update.isPending}>
            {update.isPending ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <FormSection title="Data Wali" description="Identitas dan kontak wali calon siswa.">
          <FormField label="Nama Wali">
            <Input value={form.nama_wali ?? ""} onChange={(e) => set("nama_wali", e.target.value)} />
          </FormField>
          <FormField label="Hubungan">
            <SearchableSelect
              value={form.hubungan_wali ?? ""}
              onChange={(v) => set("hubungan_wali", v)}
              options={[
                { value: "Ayah", label: "Ayah" },
                { value: "Ibu", label: "Ibu" },
                { value: "Wali", label: "Wali" },
              ]}
              placeholder="— pilih —"
            />
          </FormField>
          <FormField label="No HP Wali">
            <Input value={form.no_hp_wali ?? ""} onChange={(e) => set("no_hp_wali", e.target.value)} />
          </FormField>
          <FormField label="Pekerjaan">
            <Input value={form.pekerjaan_wali ?? ""} onChange={(e) => set("pekerjaan_wali", e.target.value)} />
          </FormField>
          <FormField label="Penghasilan" className="col-span-2">
            <Input value={form.penghasilan_wali ?? ""} onChange={(e) => set("penghasilan_wali", e.target.value)} />
          </FormField>
        </FormSection>
        <ErrLine msg={err} />
      </div>
    </Modal>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
//  Helpers (non-modal): mailto + WA deep link + print kartu peserta
// ──────────────────────────────────────────────────────────────────────────────

export function openMailto(email: string | undefined, subject: string) {
  if (!email) {
    window.alert("Email calon tidak tersedia.");
    return;
  }
  const href = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
  window.location.href = href;
}

export function openWa(noHp: string | undefined, msg: string) {
  if (!noHp) {
    window.alert("No HP calon tidak tersedia.");
    return;
  }
  // Normalisasi: hapus karakter non-digit, prefix 62 untuk Indonesia.
  let digits = noHp.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = "62" + digits.slice(1);
  else if (!digits.startsWith("62")) digits = "62" + digits;
  const href = `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`;
  window.open(href, "_blank", "noopener,noreferrer");
}
