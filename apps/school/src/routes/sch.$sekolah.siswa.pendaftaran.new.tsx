import { useCallback, useState } from "react";
import { createFileRoute, useNavigate, useParams} from "@tanstack/react-router";
import { listResource, useResourceCreate } from "@sekolahpro/api-client";
import {
  Badge,
  Button,
  Input,
  PageHeader,
  SectionCard,
  Textarea,
  FormField,
  SearchableSelect,
  DatePicker,
  type SearchableOption,
} from "@sekolahpro/ui";
import { PageGuide } from "../components/guide";
import { SISWA_PAGE_GUIDES } from "../components/siswa/pageGuides";
import { SCHOOL_ROLE_LABEL } from "../lib/schoolGuideRole";

type JenisPendaftaran = "Reguler" | "Mutasi" | "Beasiswa" | "Khusus";
type JenisKelamin = "Laki-laki" | "Perempuan";

const JENIS_OPTIONS: { value: JenisPendaftaran; desc: string }[] = [
  { value: "Reguler", desc: "PPDB jalur reguler — calon siswa baru." },
  { value: "Mutasi", desc: "Pindahan dari sekolah lain (gunakan Mutasi Masuk untuk verifikasi Dapodik)." },
  { value: "Beasiswa", desc: "Jalur khusus penerima beasiswa." },
  { value: "Khusus", desc: "Anak guru, pertimbangan kepsek, dll." },
];

interface FormState {
  nama_lengkap: string;
  nisn: string;
  nik: string;
  jenis_kelamin: JenisKelamin | "";
  tempat_lahir: string;
  tanggal_lahir: string;
  asal_sekolah: string;
  jenis_pendaftaran: JenisPendaftaran | "";
  tanggal_daftar: string;
  rombel_target: string;
  telepon_wali: string;
  email_wali: string;
  catatan: string;
}

const INITIAL: FormState = {
  nama_lengkap: "",
  nisn: "",
  nik: "",
  jenis_kelamin: "",
  tempat_lahir: "",
  tanggal_lahir: "",
  asal_sekolah: "",
  jenis_pendaftaran: "",
  tanggal_daftar: "",
  rombel_target: "",
  telepon_wali: "",
  email_wali: "",
  catatan: "",
};

async function loadRombel(query: string): Promise<SearchableOption[]> {
  const params: Parameters<typeof listResource>[1] = {
    fields: ["name", "nama_rombel", "kapasitas", "terisi"],
    limit_page_length: 20,
  };
  if (query) params.filters = [["nama_rombel", "like", `%${query}%`]];
  const rows = await listResource<{
    name: string;
    nama_rombel: string;
    kapasitas?: number;
    terisi?: number;
  }>("Rombongan Belajar", params);
  return rows.map((r) => {
    const opt: SearchableOption = { value: r.name, label: r.nama_rombel ?? r.name };
    if (r.kapasitas != null && r.terisi != null) {
      opt.hint = `${r.terisi}/${r.kapasitas} terisi`;
    }
    return opt;
  });
}

function PendaftaranNewPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });

  const navigate = useNavigate();
  const create = useResourceCreate<{ name: string }>("Pendaftaran Siswa");
  const [v, setV] = useState<FormState>(INITIAL);
  const [err, setErr] = useState<string | null>(null);

  const update = useCallback(<K extends keyof FormState>(k: K, val: FormState[K]) => {
    setV((prev) => ({ ...prev, [k]: val }));
  }, []);

  function validate(): string | null {
    if (!v.nama_lengkap.trim()) return "Nama lengkap wajib.";
    if (!v.jenis_kelamin) return "Pilih jenis kelamin.";
    if (!v.tanggal_lahir) return "Tanggal lahir wajib.";
    if (!v.jenis_pendaftaran) return "Pilih jenis pendaftaran.";
    if (!v.tanggal_daftar) return "Tanggal daftar wajib.";
    if (v.nisn && !/^\d{10}$/.test(v.nisn)) return "NISN harus 10 digit.";
    if (v.nik && !/^\d{16}$/.test(v.nik)) return "NIK harus 16 digit.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const msg = validate();
    if (msg) {
      setErr(msg);
      return;
    }
    setErr(null);
    try {
      const doc = await create.mutateAsync({
        nama_lengkap: v.nama_lengkap,
        nisn: v.nisn || undefined,
        nik: v.nik || undefined,
        jenis_kelamin: v.jenis_kelamin,
        tempat_lahir: v.tempat_lahir || undefined,
        tanggal_lahir: v.tanggal_lahir,
        asal_sekolah: v.asal_sekolah || undefined,
        jenis_pendaftaran: v.jenis_pendaftaran,
        tanggal_daftar: v.tanggal_daftar,
        rombel_target: v.rombel_target || undefined,
        telepon_wali: v.telepon_wali || undefined,
        email_wali: v.email_wali || undefined,
        catatan: v.catatan || undefined,
        status: "Draft",
      });
      void navigate({ to: "/sch/$sekolah/siswa/pendaftaran/$id", params: { sekolah, id: doc.name } });
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Gagal menyimpan pendaftaran.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PageHeader
        eyebrow="Siswa › Pendaftaran"
        title="Daftarkan Siswa Baru"
        description="Setelah Submitted dan diterima, sistem akan membuat record Siswa + Anggota Rombel otomatis."
      />

      <PageGuide
        storageNamespace="siswa-guide:"
        storageId="pendaftaran-baru"
        title={SISWA_PAGE_GUIDES["pendaftaran-baru"].title}
        intro={SISWA_PAGE_GUIDES["pendaftaran-baru"].intro}
        steps={SISWA_PAGE_GUIDES["pendaftaran-baru"].steps}
        tips={SISWA_PAGE_GUIDES["pendaftaran-baru"].tips}
        roleLabels={SCHOOL_ROLE_LABEL}
      />

      <SectionCard title="Identitas Calon Siswa">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Nama Lengkap" required>
            <Input value={v.nama_lengkap} onChange={(e) => update("nama_lengkap", e.target.value)} />
          </FormField>
          <FormField label="Jenis Kelamin" required>
            <SearchableSelect
              value={v.jenis_kelamin}
              onChange={(val) => update("jenis_kelamin", val as JenisKelamin)}
              options={[
                { value: "Laki-laki", label: "Laki-laki" },
                { value: "Perempuan", label: "Perempuan" },
              ]}
              placeholder="Pilih…"
            />
          </FormField>
          <FormField label="Tempat Lahir">
            <Input value={v.tempat_lahir} onChange={(e) => update("tempat_lahir", e.target.value)} />
          </FormField>
          <FormField label="Tanggal Lahir" required>
            <DatePicker
              value={v.tanggal_lahir}
              onChange={(val) => update("tanggal_lahir", val)}
            />
          </FormField>
          <FormField label="NISN" hint="10 digit (jika sudah ada)">
            <Input
              value={v.nisn}
              onChange={(e) => update("nisn", e.target.value)}
              maxLength={10}
              inputMode="numeric"
            />
          </FormField>
          <FormField label="NIK" hint="16 digit dari KK">
            <Input
              value={v.nik}
              onChange={(e) => update("nik", e.target.value)}
              maxLength={16}
              inputMode="numeric"
            />
          </FormField>
        </div>
      </SectionCard>

      <SectionCard title="Pendaftaran">
        <FormField label="Jenis Pendaftaran" required>
          <div className="grid gap-2 sm:grid-cols-2">
            {JENIS_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                  v.jenis_pendaftaran === opt.value
                    ? "border-brand bg-brand/5"
                    : "border-border hover:border-brand/50"
                }`}
              >
                <input
                  type="radio"
                  name="jenis_pendaftaran"
                  checked={v.jenis_pendaftaran === opt.value}
                  onChange={() => update("jenis_pendaftaran", opt.value)}
                  className="mt-1"
                />
                <div className="min-w-0">
                  <div className="font-medium text-fg">{opt.value}</div>
                  <div className="text-xs text-muted-fg">{opt.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </FormField>
        {v.jenis_pendaftaran === "Mutasi" ? (
          <div className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-800">
            Untuk pindahan dari sekolah lain, gunakan flow{" "}
            <a href="/sch/$sekolah/siswa/mutasi-masuk/new" className="underline">
              Mutasi Masuk
            </a>{" "}
            yang punya verifikasi Dapodik. Form ini hanya untuk kasus khusus.
          </div>
        ) : null}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <FormField label="Tanggal Daftar" required>
            <DatePicker
              value={v.tanggal_daftar}
              onChange={(val) => update("tanggal_daftar", val)}
            />
          </FormField>
          <FormField label="Asal Sekolah" hint="SMP/SD asal — opsional untuk Reguler">
            <Input value={v.asal_sekolah} onChange={(e) => update("asal_sekolah", e.target.value)} />
          </FormField>
          <FormField label="Rombel Target" hint="Pilih rombel yang masih punya kapasitas">
            <SearchableSelect
              value={v.rombel_target}
              onChange={(val) => update("rombel_target", val)}
              loadOptions={loadRombel}
              placeholder="Cari rombel…"
            />
          </FormField>
        </div>
      </SectionCard>

      <SectionCard title="Kontak Wali">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Telepon Wali" hint="No. HP aktif untuk verifikasi">
            <Input value={v.telepon_wali} onChange={(e) => update("telepon_wali", e.target.value)} />
          </FormField>
          <FormField label="Email Wali">
            <Input
              type="email"
              value={v.email_wali}
              onChange={(e) => update("email_wali", e.target.value)}
            />
          </FormField>
        </div>
        <div className="mt-4">
          <FormField label="Catatan">
            <Textarea
              value={v.catatan}
              onChange={(e) => update("catatan", e.target.value)}
              rows={3}
              placeholder="Catatan opsional…"
            />
          </FormField>
        </div>
      </SectionCard>

      {err ? (
        <div className="rounded-md border border-danger/40 bg-danger/5 px-3 py-2 text-sm text-danger">
          {err}
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-2">
        <Badge tone="neutral">
          Detail wali lengkap dapat ditambah setelah pendaftaran disubmit
        </Badge>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/sch/$sekolah/siswa/pendaftaran", params: { sekolah } })}>
            Batal
          </Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? "Menyimpan…" : "Simpan sebagai Draft"}
          </Button>
        </div>
      </div>
    </form>
  );
}

export const Route = createFileRoute("/sch/$sekolah/siswa/pendaftaran/new")({ component: PendaftaranNewPage });
