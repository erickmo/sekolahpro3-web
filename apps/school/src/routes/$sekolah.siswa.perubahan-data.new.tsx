import { useCallback, useEffect, useState } from "react";
import { createFileRoute, useNavigate, useSearch, useParams} from "@tanstack/react-router";
import { getResource, listResource, useResourceCreate } from "@sekolahpro/api-client";
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

type CriticalField = "nama_lengkap" | "nik" | "tanggal_lahir" | "nisn";

const CRITICAL_FIELDS: { value: CriticalField; label: string; help: string; type: "text" | "date" }[] = [
  {
    value: "nama_lengkap",
    label: "Nama Lengkap",
    help: "Perubahan nama wajib disertai akta atau penetapan pengadilan.",
    type: "text",
  },
  {
    value: "nik",
    label: "NIK (16 digit)",
    help: "Perubahan NIK wajib disertai KK terbaru sesuai Dukcapil.",
    type: "text",
  },
  {
    value: "tanggal_lahir",
    label: "Tanggal Lahir",
    help: "Perubahan tgl lahir wajib disertai akta kelahiran asli.",
    type: "date",
  },
  {
    value: "nisn",
    label: "NISN (10 digit)",
    help: "Perubahan NISN wajib koordinasi dengan Operator Dapodik.",
    type: "text",
  },
];

const MIN_REASON_LEN = 30;

interface FormState {
  siswa: string;
  field_diubah: CriticalField | "";
  nilai_lama: string;
  nilai_baru: string;
  alasan: string;
  lampiran_url: string;
}

const INITIAL: FormState = {
  siswa: "",
  field_diubah: "",
  nilai_lama: "",
  nilai_baru: "",
  alasan: "",
  lampiran_url: "",
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

function PerubahanNewPage() {
  const { sekolah } = useParams({ from: "/$sekolah" });

  const navigate = useNavigate();
  const search = useSearch({ from: "/$sekolah/siswa/perubahan-data/new" }) as { siswa?: string };
  const create = useResourceCreate<{ name: string }>("Perubahan Data Siswa");
  const [v, setV] = useState<FormState>({ ...INITIAL, siswa: search.siswa ?? "" });
  const [fetchingOld, setFetchingOld] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const update = useCallback(<K extends keyof FormState>(k: K, val: FormState[K]) => {
    setV((prev) => ({ ...prev, [k]: val }));
  }, []);

  useEffect(() => {
    if (!v.siswa || !v.field_diubah) {
      setV((p) => ({ ...p, nilai_lama: "" }));
      return;
    }
    let cancelled = false;
    setFetchingOld(true);
    void (async () => {
      try {
        const doc = await getResource<Record<string, unknown>>("Siswa", v.siswa);
        if (cancelled) return;
        const raw = doc[v.field_diubah];
        setV((p) => ({ ...p, nilai_lama: raw == null ? "" : String(raw) }));
      } catch {
        if (!cancelled) setV((p) => ({ ...p, nilai_lama: "" }));
      } finally {
        if (!cancelled) setFetchingOld(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [v.siswa, v.field_diubah]);

  function validate(): string | null {
    if (!v.siswa) return "Pilih siswa.";
    if (!v.field_diubah) return "Pilih field yang akan diubah.";
    if (!v.nilai_baru.trim()) return "Isi nilai baru.";
    if (v.nilai_baru.trim() === v.nilai_lama.trim()) {
      return "Nilai baru sama dengan nilai lama — tidak ada perubahan.";
    }
    if (v.field_diubah === "nik" && !/^\d{16}$/.test(v.nilai_baru.trim())) {
      return "NIK harus 16 digit angka.";
    }
    if (v.field_diubah === "nisn" && !/^\d{10}$/.test(v.nilai_baru.trim())) {
      return "NISN harus 10 digit angka.";
    }
    if (v.alasan.trim().length < MIN_REASON_LEN) {
      return `Alasan minimal ${MIN_REASON_LEN} karakter.`;
    }
    if (!v.lampiran_url.trim()) {
      return "Lampiran (URL/file) wajib untuk perubahan data kritis.";
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
        field_diubah: v.field_diubah,
        nilai_lama: v.nilai_lama || undefined,
        nilai_baru: v.nilai_baru,
        alasan: v.alasan,
        lampiran_url: v.lampiran_url,
        workflow_state: "Draft",
      });
      void navigate({ to: "/$sekolah/siswa/perubahan-data/$id", params: { sekolah, id: doc.name } });
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Gagal menyimpan permintaan.");
    }
  }

  const selectedField = CRITICAL_FIELDS.find((f) => f.value === v.field_diubah);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PageHeader
        eyebrow="Siswa › Perubahan Data"
        title="Ajukan Perubahan Data Kritis"
        description="Edit langsung data kritis (nama, NIK, tgl lahir, NISN) tidak diizinkan. Ajukan perubahan via workflow dual-control."
      />

      <SectionCard title="Pilih Siswa & Field">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Siswa" required>
            <SearchableSelect
              value={v.siswa}
              onChange={(val) => update("siswa", val)}
              loadOptions={loadSiswa}
              placeholder="Cari NIS atau nama…"
            />
          </FormField>
          <FormField label="Field yang Diubah" required>
            <SearchableSelect
              value={v.field_diubah}
              onChange={(val) => update("field_diubah", val as CriticalField)}
              options={CRITICAL_FIELDS.map((f) => ({ value: f.value, label: f.label }))}
              placeholder="Pilih field…"
            />
          </FormField>
        </div>
        {selectedField ? (
          <div className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-700">
            {selectedField.help}
          </div>
        ) : null}
      </SectionCard>

      {v.siswa && v.field_diubah ? (
        <SectionCard
          title="Diff Data"
          action={<Badge tone="warning" dot>Dual-control</Badge>}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Data Saat Ini">
              <div className="flex h-10 items-center rounded-md border border-border bg-muted/40 px-3 text-sm text-muted-fg">
                {fetchingOld ? "Memuat…" : v.nilai_lama || "—"}
              </div>
            </FormField>
            <FormField label={selectedField?.label ?? "Data Baru"} required>
              {selectedField?.type === "date" ? (
                <DatePicker
                  value={v.nilai_baru}
                  onChange={(val) => update("nilai_baru", val)}
                  className="border-brand/60 focus:ring-brand"
                />
              ) : (
                <Input
                  type="text"
                  value={v.nilai_baru}
                  onChange={(e) => update("nilai_baru", e.target.value)}
                  className="border-brand/60 focus:ring-brand"
                />
              )}
            </FormField>
          </div>
          <div className="mt-4">
            <FormField
              label="Alasan Perubahan"
              hint={`Minimal ${MIN_REASON_LEN} karakter — jelaskan dasar hukum perubahan.`}
              required
            >
              <Textarea
                value={v.alasan}
                onChange={(e) => update("alasan", e.target.value)}
                rows={4}
                placeholder="Contoh: Perubahan nama berdasarkan penetapan pengadilan No. … tanggal …"
              />
            </FormField>
          </div>
          <div className="mt-4">
            <FormField
              label="Lampiran Bukti"
              hint="URL file lampiran (akta/KK/penetapan). Wajib diisi sebelum approval Kepsek."
              required
            >
              <Input
                value={v.lampiran_url}
                onChange={(e) => update("lampiran_url", e.target.value)}
                placeholder="https://… atau path File doctype"
              />
            </FormField>
          </div>
        </SectionCard>
      ) : null}

      {err ? (
        <div className="rounded-md border border-danger/40 bg-danger/5 px-3 py-2 text-sm text-danger">
          {err}
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => navigate({ to: "/$sekolah/siswa/perubahan-data", params: { sekolah } })}>
          Batal
        </Button>
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? "Menyimpan…" : "Simpan sebagai Draft"}
        </Button>
      </div>
    </form>
  );
}

export const Route = createFileRoute("/$sekolah/siswa/perubahan-data/new")({ component: PerubahanNewPage });
