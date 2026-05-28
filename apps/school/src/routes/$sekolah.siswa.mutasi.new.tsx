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
  type SearchableOption,
} from "@sekolahpro/ui";

type JenisMutasi = "Naik Kelas" | "Tinggal Kelas" | "Pindah Keluar" | "DO";

const JENIS_OPTIONS: { value: JenisMutasi; label: string; desc: string }[] = [
  { value: "Naik Kelas", label: "Naik Kelas", desc: "Pindah ke rombel tingkat berikutnya." },
  { value: "Tinggal Kelas", label: "Tinggal Kelas", desc: "Tidak naik, ulang di rombel sama." },
  { value: "Pindah Keluar", label: "Pindah Keluar", desc: "Pindah ke sekolah lain (perlu Ka-TU + Kepsek)." },
  { value: "DO", label: "Drop Out", desc: "Dikeluarkan (perlu Ka-TU + Kepsek + alasan kuat)." },
];

const MIN_REASON_LEN = 20;

interface FormState {
  siswa: string;
  jenis_mutasi: JenisMutasi | "";
  tanggal_efektif: string;
  rombel_tujuan: string;
  sekolah_tujuan: string;
  alasan: string;
}

const INITIAL: FormState = {
  siswa: "",
  jenis_mutasi: "",
  tanggal_efektif: "",
  rombel_tujuan: "",
  sekolah_tujuan: "",
  alasan: "",
};

function makeLoader(doctype: string, labelField: string) {
  return async (query: string): Promise<SearchableOption[]> => {
    const params: Parameters<typeof listResource>[1] = {
      fields: ["name", labelField],
      limit_page_length: 20,
    };
    if (query) {
      params.filters = [["name", "like", `%${query}%`]];
    }
    const rows = await listResource<Record<string, string>>(doctype, params);
    return rows.map((r) => ({ value: r["name"] ?? "", label: r[labelField] ?? r["name"] ?? "" }));
  };
}

const loadSiswa = makeLoader("Siswa", "nama_lengkap");
const loadRombel = makeLoader("Rombongan Belajar", "nama_rombel");

function MutasiNewPage() {
  const { sekolah } = useParams({ from: "/$sekolah" });

  const navigate = useNavigate();
  const create = useResourceCreate<{ name: string }>("Mutasi Siswa");
  const [v, setV] = useState<FormState>(INITIAL);
  const [err, setErr] = useState<string | null>(null);

  const isDual = v.jenis_mutasi === "Pindah Keluar" || v.jenis_mutasi === "DO";
  const needsRombel = v.jenis_mutasi === "Naik Kelas";
  const needsSekolah = v.jenis_mutasi === "Pindah Keluar";
  const needsAlasan = v.jenis_mutasi === "DO" || v.jenis_mutasi === "Tinggal Kelas" || v.jenis_mutasi === "Pindah Keluar";

  const update = useCallback(<K extends keyof FormState>(k: K, val: FormState[K]) => {
    setV((prev) => ({ ...prev, [k]: val }));
  }, []);

  function validate(): string | null {
    if (!v.siswa) return "Pilih siswa.";
    if (!v.jenis_mutasi) return "Pilih jenis mutasi.";
    if (!v.tanggal_efektif) return "Isi tanggal efektif.";
    if (needsRombel && !v.rombel_tujuan) return "Pilih rombel tujuan.";
    if (needsSekolah && !v.sekolah_tujuan) return "Isi nama sekolah tujuan.";
    if (needsAlasan && v.alasan.trim().length < MIN_REASON_LEN) {
      return `Alasan minimal ${MIN_REASON_LEN} karakter.`;
    }
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
        jenis_mutasi: v.jenis_mutasi,
        tanggal_efektif: v.tanggal_efektif,
        rombel_tujuan: v.rombel_tujuan || undefined,
        sekolah_tujuan: v.sekolah_tujuan || undefined,
        alasan: v.alasan || undefined,
        workflow_state: "Draft",
      });
      void navigate({ to: "/$sekolah/siswa/mutasi/$id", params: { sekolah, id: doc.name } });
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Gagal menyimpan mutasi.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PageHeader
        eyebrow="Siswa › Mutasi"
        title="Ajukan Mutasi Baru"
        description="Catat mutasi siswa (naik kelas, tinggal kelas, pindah keluar, atau drop out)."
      />

      <SectionCard title="Data Siswa & Jenis">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Siswa" required>
            <SearchableSelect
              value={v.siswa}
              onChange={(val) => update("siswa", val)}
              loadOptions={loadSiswa}
              placeholder="Cari NIS atau nama…"
            />
          </FormField>
          <FormField label="Tanggal Efektif" required>
            <Input
              type="date"
              value={v.tanggal_efektif}
              onChange={(e) => update("tanggal_efektif", e.target.value)}
              required
            />
          </FormField>
        </div>
        <div className="mt-4">
          <FormField label="Jenis Mutasi" required>
            <div className="grid gap-2 sm:grid-cols-2">
              {JENIS_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                    v.jenis_mutasi === opt.value
                      ? "border-brand bg-brand/5"
                      : "border-border hover:border-brand/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="jenis_mutasi"
                    value={opt.value}
                    checked={v.jenis_mutasi === opt.value}
                    onChange={() => update("jenis_mutasi", opt.value)}
                    className="mt-1"
                  />
                  <div className="min-w-0">
                    <div className="font-medium text-fg">{opt.label}</div>
                    <div className="text-xs text-muted-fg">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </FormField>
        </div>
      </SectionCard>

      {needsRombel || needsSekolah || needsAlasan ? (
        <SectionCard
          title="Detail Mutasi"
          action={isDual ? <Badge tone="warning" dot>Dual-control</Badge> : undefined}
        >
          {isDual ? (
            <p className="mb-4 text-xs text-muted-fg">
              Perlu approval Ka-TU dan Kepsek setelah submit.
            </p>
          ) : null}
          <div className="grid gap-4 md:grid-cols-2">
            {needsRombel ? (
              <FormField label="Rombel Tujuan" required>
                <SearchableSelect
                  value={v.rombel_tujuan}
                  onChange={(val) => update("rombel_tujuan", val)}
                  loadOptions={loadRombel}
                  placeholder="Pilih rombel tujuan…"
                />
              </FormField>
            ) : null}
            {needsSekolah ? (
              <FormField label="Sekolah Tujuan" required>
                <Input
                  value={v.sekolah_tujuan}
                  onChange={(e) => update("sekolah_tujuan", e.target.value)}
                  placeholder="Nama sekolah penerima"
                />
              </FormField>
            ) : null}
          </div>
          {needsAlasan ? (
            <div className="mt-4">
              <FormField
                label="Alasan"
                hint={`Minimal ${MIN_REASON_LEN} karakter — akan ditampilkan kepada approver.`}
                required
              >
                <Textarea
                  value={v.alasan}
                  onChange={(e) => update("alasan", e.target.value)}
                  rows={4}
                  placeholder="Jelaskan alasan mutasi…"
                />
              </FormField>
            </div>
          ) : null}
        </SectionCard>
      ) : null}

      {err ? (
        <div className="rounded-md border border-danger/40 bg-danger/5 px-3 py-2 text-sm text-danger">
          {err}
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => navigate({ to: "/$sekolah/siswa/mutasi", params: { sekolah } })}>
          Batal
        </Button>
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? "Menyimpan…" : "Simpan sebagai Draft"}
        </Button>
      </div>
    </form>
  );
}

export const Route = createFileRoute("/$sekolah/siswa/mutasi/new")({ component: MutasiNewPage });
