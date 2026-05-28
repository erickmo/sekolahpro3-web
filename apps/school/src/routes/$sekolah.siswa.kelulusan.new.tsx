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

type StatusKelulusan = "Lulus" | "Tidak Lulus";

interface FormState {
  siswa: string;
  tahun_ajaran: string;
  status_kelulusan: StatusKelulusan | "";
  no_ijazah: string;
  no_skhun: string;
  tanggal_pengesahan: string;
  melanjutkan_pendidikan: "Ya" | "Tidak" | "Belum Tahu" | "";
  jenjang_lanjutan: string;
  nama_pt: string;
  catatan: string;
}

const INITIAL: FormState = {
  siswa: "",
  tahun_ajaran: "",
  status_kelulusan: "",
  no_ijazah: "",
  no_skhun: "",
  tanggal_pengesahan: "",
  melanjutkan_pendidikan: "",
  jenjang_lanjutan: "",
  nama_pt: "",
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

function KelulusanNewPage() {
  const { sekolah } = useParams({ from: "/$sekolah" });

  const navigate = useNavigate();
  const create = useResourceCreate<{ name: string }>("Kelulusan Siswa");
  const [v, setV] = useState<FormState>(INITIAL);
  const [err, setErr] = useState<string | null>(null);

  const isLulus = v.status_kelulusan === "Lulus";
  const isMelanjutkan = v.melanjutkan_pendidikan === "Ya";

  const update = useCallback(<K extends keyof FormState>(k: K, val: FormState[K]) => {
    setV((prev) => ({ ...prev, [k]: val }));
  }, []);

  function validate(): string | null {
    if (!v.siswa) return "Pilih siswa.";
    if (!v.tahun_ajaran.trim()) return "Isi tahun ajaran (mis. 2025/2026).";
    if (!v.status_kelulusan) return "Pilih status kelulusan.";
    if (isLulus && !v.no_ijazah.trim()) return "No. Ijazah wajib untuk siswa Lulus.";
    if (isLulus && !v.tanggal_pengesahan) return "Tanggal pengesahan wajib.";
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
        tahun_ajaran: v.tahun_ajaran,
        status_kelulusan: v.status_kelulusan,
        no_ijazah: v.no_ijazah || undefined,
        no_skhun: v.no_skhun || undefined,
        tanggal_pengesahan: v.tanggal_pengesahan || undefined,
        melanjutkan_pendidikan: v.melanjutkan_pendidikan || undefined,
        jenjang_lanjutan: v.jenjang_lanjutan || undefined,
        nama_pt: v.nama_pt || undefined,
        catatan: v.catatan || undefined,
        workflow_state: "Draft",
      });
      void navigate({ to: "/$sekolah/siswa/kelulusan/$id", params: { sekolah, id: doc.name } });
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Gagal menyimpan kelulusan.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PageHeader
        eyebrow="Siswa › Kelulusan"
        title="Proses Kelulusan Baru"
        description="Catat pengesahan kelulusan siswa. Setelah approved, Arsip Ijazah akan dibuat otomatis (retensi 25 tahun)."
      />

      <SectionCard title="Data Siswa & Status">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Siswa" required>
            <SearchableSelect
              value={v.siswa}
              onChange={(val) => update("siswa", val)}
              loadOptions={loadSiswa}
              placeholder="Cari NIS atau nama…"
            />
          </FormField>
          <FormField label="Tahun Ajaran" required hint="Format: 2025/2026">
            <Input
              value={v.tahun_ajaran}
              onChange={(e) => update("tahun_ajaran", e.target.value)}
              placeholder="2025/2026"
            />
          </FormField>
        </div>
        <div className="mt-4">
          <FormField label="Status Kelulusan" required>
            <div className="grid gap-2 sm:grid-cols-2">
              {(["Lulus", "Tidak Lulus"] as StatusKelulusan[]).map((s) => (
                <label
                  key={s}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                    v.status_kelulusan === s
                      ? s === "Lulus"
                        ? "border-emerald-500 bg-emerald-500/5"
                        : "border-danger bg-danger/5"
                      : "border-border hover:border-brand/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="status_kelulusan"
                    checked={v.status_kelulusan === s}
                    onChange={() => update("status_kelulusan", s)}
                  />
                  <span className="font-medium">{s}</span>
                </label>
              ))}
            </div>
          </FormField>
        </div>
      </SectionCard>

      {isLulus ? (
        <SectionCard
          title="Ijazah & SKHUN"
          action={<Badge tone="warning" dot>Dual-control</Badge>}
        >
          <p className="mb-4 text-xs text-muted-fg">
            Perlu approval Ka-TU dan Kepsek. Setelah approved, Arsip Ijazah otomatis dibuat (retensi 25 tahun, Permendikbud).
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="No. Ijazah" required>
              <Input
                value={v.no_ijazah}
                onChange={(e) => update("no_ijazah", e.target.value)}
                placeholder="Format Kemendikbud"
              />
            </FormField>
            <FormField label="No. SKHUN">
              <Input
                value={v.no_skhun}
                onChange={(e) => update("no_skhun", e.target.value)}
              />
            </FormField>
            <FormField label="Tanggal Pengesahan" required>
              <DatePicker
                value={v.tanggal_pengesahan}
                onChange={(val) => update("tanggal_pengesahan", val)}
              />
            </FormField>
          </div>
        </SectionCard>
      ) : null}

      {isLulus ? (
        <SectionCard
          title="Alumni Tracker"
          action={<span className="text-xs text-muted-fg">Opsional — untuk tracer study</span>}
        >
          <FormField label="Melanjutkan Pendidikan?">
            <div className="flex flex-wrap gap-2">
              {(["Ya", "Tidak", "Belum Tahu"] as const).map((s) => (
                <label
                  key={s}
                  className={`cursor-pointer rounded-md border px-3 py-1.5 text-sm transition-colors ${
                    v.melanjutkan_pendidikan === s
                      ? "border-brand bg-brand/10 text-brand"
                      : "border-border hover:border-brand/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="melanjutkan_pendidikan"
                    className="sr-only"
                    checked={v.melanjutkan_pendidikan === s}
                    onChange={() => update("melanjutkan_pendidikan", s)}
                  />
                  {s}
                </label>
              ))}
            </div>
          </FormField>
          {isMelanjutkan ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <FormField label="Jenjang Lanjutan" hint="D3, S1, dst">
                <Input
                  value={v.jenjang_lanjutan}
                  onChange={(e) => update("jenjang_lanjutan", e.target.value)}
                />
              </FormField>
              <FormField label="Nama PT/Universitas">
                <Input
                  value={v.nama_pt}
                  onChange={(e) => update("nama_pt", e.target.value)}
                />
              </FormField>
            </div>
          ) : null}
        </SectionCard>
      ) : null}

      <SectionCard title="Catatan">
        <FormField label="Catatan Tambahan">
          <Textarea
            value={v.catatan}
            onChange={(e) => update("catatan", e.target.value)}
            rows={3}
            placeholder="Catatan opsional untuk approver…"
          />
        </FormField>
      </SectionCard>

      {err ? (
        <div className="rounded-md border border-danger/40 bg-danger/5 px-3 py-2 text-sm text-danger">
          {err}
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => navigate({ to: "/$sekolah/siswa/kelulusan", params: { sekolah } })}>
          Batal
        </Button>
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? "Menyimpan…" : "Simpan sebagai Draft"}
        </Button>
      </div>
    </form>
  );
}

export const Route = createFileRoute("/$sekolah/siswa/kelulusan/new")({ component: KelulusanNewPage });
