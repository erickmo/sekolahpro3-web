import { useCallback, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
  type SearchableOption,
} from "@sekolahpro/ui";

type Purpose = "Publikasi Foto" | "Data Dapodik" | "Sharing Mitra" | "Medis Darurat";
type Method = "Tatap Muka" | "Tanda Tangan Digital" | "WhatsApp" | "Email" | "Portal Wali";

const PURPOSES: { value: Purpose; desc: string }[] = [
  { value: "Publikasi Foto", desc: "Foto siswa untuk medsos sekolah, mading, brosur, atau dokumentasi acara." },
  { value: "Data Dapodik", desc: "Sinkronisasi data lengkap siswa ke Dapodik Kemendikbud." },
  { value: "Sharing Mitra", desc: "Berbagi data ke mitra (program beasiswa, kerja sama industri)." },
  { value: "Medis Darurat", desc: "Akses data medis & kontak wali untuk situasi darurat di sekolah." },
];

const METHODS: Method[] = ["Tatap Muka", "Tanda Tangan Digital", "WhatsApp", "Email", "Portal Wali"];

interface FormState {
  siswa: string;
  wali: string;
  purpose: Purpose | "";
  granted_method: Method | "";
  granted_at: string;
  expires_at: string;
  catatan: string;
}

const INITIAL: FormState = {
  siswa: "",
  wali: "",
  purpose: "",
  granted_method: "",
  granted_at: "",
  expires_at: "",
  catatan: "",
};

async function loadSiswa(query: string): Promise<SearchableOption[]> {
  const params: Parameters<typeof listResource>[1] = {
    fields: ["name", "nama_lengkap"],
    limit_page_length: 20,
  };
  if (query) params.filters = [["name", "like", `%${query}%`]];
  const rows = await listResource<{ name: string; nama_lengkap: string }>("Siswa", params);
  return rows.map((r) => ({ value: r.name, label: r.nama_lengkap ?? r.name }));
}

async function loadWali(query: string): Promise<SearchableOption[]> {
  const params: Parameters<typeof listResource>[1] = {
    fields: ["name", "nama"],
    limit_page_length: 20,
  };
  if (query) params.filters = [["nama", "like", `%${query}%`]];
  const rows = await listResource<{ name: string; nama: string }>("Wali Siswa", params);
  return rows.map((r) => ({ value: r.name, label: r.nama ?? r.name }));
}

function PersetujuanNewPage() {
  const navigate = useNavigate();
  const create = useResourceCreate<{ name: string }>("Persetujuan Wali");
  const [v, setV] = useState<FormState>(INITIAL);
  const [err, setErr] = useState<string | null>(null);

  const update = useCallback(<K extends keyof FormState>(k: K, val: FormState[K]) => {
    setV((prev) => ({ ...prev, [k]: val }));
  }, []);

  function validate(): string | null {
    if (!v.siswa) return "Pilih siswa.";
    if (!v.wali) return "Pilih wali pemberi persetujuan.";
    if (!v.purpose) return "Pilih tujuan pemrosesan data.";
    if (!v.granted_method) return "Pilih cara persetujuan diberikan.";
    if (!v.granted_at) return "Tanggal pemberian persetujuan wajib diisi.";
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
        siswa: v.siswa,
        wali: v.wali,
        purpose: v.purpose,
        granted_method: v.granted_method,
        granted_at: v.granted_at,
        expires_at: v.expires_at || undefined,
        catatan: v.catatan || undefined,
        status: "Granted",
      });
      void navigate({ to: "/siswa/persetujuan/$id", params: { id: doc.name } });
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Gagal menyimpan persetujuan.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PageHeader
        eyebrow="Siswa › Persetujuan Wali"
        title="Catat Persetujuan Wali Baru"
        description="UU PDP Pasal 9 — setiap pemrosesan data wajib consent granular per tujuan. JANGAN catat 'Setuju Semua' di sini."
      />

      <div className="rounded-md border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-xs text-amber-800">
        ⚠ Konfirmasi langsung dengan wali sebelum menyimpan. Default consent = OFF; gunakan form ini
        hanya untuk mencatat persetujuan eksplisit yang sudah diberikan.
      </div>

      <SectionCard title="Pihak">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Siswa" required>
            <SearchableSelect
              value={v.siswa}
              onChange={(val) => update("siswa", val)}
              loadOptions={loadSiswa}
              placeholder="Cari NIS atau nama…"
            />
          </FormField>
          <FormField label="Wali Pemberi Consent" required hint="Hanya wali aktif yang dicatat di KK">
            <SearchableSelect
              value={v.wali}
              onChange={(val) => update("wali", val)}
              loadOptions={loadWali}
              placeholder="Cari nama wali…"
            />
          </FormField>
        </div>
      </SectionCard>

      <SectionCard title="Tujuan Pemrosesan Data" action={<Badge tone="warning" dot>Granular</Badge>}>
        <p className="mb-3 text-xs text-muted-fg">Pilih SATU tujuan. Setiap consent record = 1 purpose.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {PURPOSES.map((p) => (
            <label
              key={p.value}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                v.purpose === p.value ? "border-brand bg-brand/5" : "border-border hover:border-brand/50"
              }`}
            >
              <input
                type="radio"
                name="purpose"
                checked={v.purpose === p.value}
                onChange={() => update("purpose", p.value)}
                className="mt-1"
              />
              <div className="min-w-0">
                <div className="font-medium text-fg">{p.value}</div>
                <div className="text-xs text-muted-fg">{p.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Bukti Persetujuan">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Cara Persetujuan Diberikan" required>
            <select
              value={v.granted_method}
              onChange={(e) => update("granted_method", e.target.value as Method)}
              className="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            >
              <option value="">Pilih cara…</option>
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Tanggal Pemberian" required>
            <Input
              type="datetime-local"
              value={v.granted_at}
              onChange={(e) => update("granted_at", e.target.value)}
            />
          </FormField>
          <FormField label="Berlaku Sampai" hint="Kosongkan = tidak ada expiry (wali harus cabut manual)">
            <Input
              type="date"
              value={v.expires_at}
              onChange={(e) => update("expires_at", e.target.value)}
            />
          </FormField>
        </div>
        <div className="mt-4">
          <FormField label="Catatan" hint="Misal: ref no surat, link dokumen tanda tangan digital, dll.">
            <Textarea
              value={v.catatan}
              onChange={(e) => update("catatan", e.target.value)}
              rows={3}
            />
          </FormField>
        </div>
      </SectionCard>

      {err ? (
        <div className="rounded-md border border-danger/40 bg-danger/5 px-3 py-2 text-sm text-danger">
          {err}
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => navigate({ to: "/siswa/persetujuan" })}>
          Batal
        </Button>
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? "Menyimpan…" : "Simpan Persetujuan"}
        </Button>
      </div>
    </form>
  );
}

export const Route = createFileRoute("/siswa/persetujuan/new")({ component: PersetujuanNewPage });
