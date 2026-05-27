import { useState } from "react";
import { Button, PageHeader, SectionCard, SearchableSelect, type SearchableOption } from "@sekolahpro/ui";
import { listResource } from "@sekolahpro/api-client";

export interface EntriNilaiSelection {
  rombel: string;
  mapel: string;
  semester: string;
  tahunAjaran: string;
}

interface Props {
  initial?: Partial<EntriNilaiSelection>;
  onStart: (sel: EntriNilaiSelection) => void;
}

const SEMESTER_OPTIONS: SearchableOption[] = [
  { value: "Ganjil", label: "Ganjil" },
  { value: "Genap", label: "Genap" },
];

async function loadRombel(q: string): Promise<SearchableOption[]> {
  const filters: Array<[string, string, string]> = q ? [["nama_rombel", "like", `%${q}%`]] : [];
  filters.push(["status", "=", "Aktif"]);
  const rows = await listResource<{ name: string; nama_rombel?: string; tingkat?: number; jumlah_siswa?: number }>(
    "Rombongan Belajar",
    {
      fields: ["name", "nama_rombel", "tingkat", "jumlah_siswa"],
      filters,
      order_by: "`tingkat` asc, `nama_rombel` asc",
      limit_page_length: 40,
    },
  );
  return rows.map((r): SearchableOption => {
    const opt: SearchableOption = { value: r.name, label: r.nama_rombel ?? r.name };
    const tags: string[] = [];
    if (r.tingkat != null) tags.push(`Tingkat ${r.tingkat}`);
    if (r.jumlah_siswa != null) tags.push(`${r.jumlah_siswa} siswa`);
    if (tags.length > 0) opt.hint = tags.join(" · ");
    return opt;
  });
}

async function loadMapel(q: string): Promise<SearchableOption[]> {
  const filters: Array<[string, string, string]> = q ? [["nama_mapel", "like", `%${q}%`]] : [];
  const rows = await listResource<{ name: string; nama_mapel?: string; kode_mapel?: string }>("Mata Pelajaran", {
    fields: ["name", "nama_mapel", "kode_mapel"],
    filters,
    order_by: "`kode_mapel` asc",
    limit_page_length: 40,
  });
  return rows.map((r): SearchableOption => {
    const opt: SearchableOption = { value: r.name, label: r.nama_mapel ?? r.name };
    if (r.kode_mapel) opt.hint = r.kode_mapel;
    return opt;
  });
}

async function loadTA(q: string): Promise<SearchableOption[]> {
  const filters: Array<[string, string, string]> = q ? [["nama", "like", `%${q}%`]] : [];
  const rows = await listResource<{ name: string; nama?: string; is_current?: 0 | 1 }>("Tahun Ajaran", {
    fields: ["name", "nama", "is_current"],
    filters,
    order_by: "`nama` desc",
    limit_page_length: 30,
  });
  return rows.map((r): SearchableOption => {
    const opt: SearchableOption = { value: r.name, label: r.nama ?? r.name };
    if (r.is_current) opt.hint = "Berjalan";
    return opt;
  });
}

export function EntriNilaiSelector({ initial, onStart }: Props) {
  const [rombel, setRombel] = useState(initial?.rombel ?? "");
  const [mapel, setMapel] = useState(initial?.mapel ?? "");
  const [semester, setSemester] = useState(initial?.semester ?? "");
  const [tahunAjaran, setTahunAjaran] = useState(initial?.tahunAjaran ?? "");
  const [error, setError] = useState<string | null>(null);

  const ready = rombel && mapel && semester && tahunAjaran;

  const submit = () => {
    if (!ready) {
      setError("Lengkapi semua pilihan untuk memulai entri nilai.");
      return;
    }
    onStart({ rombel, mapel, semester, tahunAjaran });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Akademik · Entri Nilai"
        title="Pilih konteks entri nilai"
        description="Tentukan rombel, mata pelajaran, semester, dan tahun ajaran sebelum membuka editor grid."
      />
      <SectionCard
        title="Konteks"
        description="Editor menampilkan matriks siswa × komponen sesuai pilihan di bawah."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Rombongan Belajar" required>
            <SearchableSelect value={rombel} onChange={setRombel} loadOptions={loadRombel} placeholder="Cari rombel…" />
          </Field>
          <Field label="Mata Pelajaran" required>
            <SearchableSelect value={mapel} onChange={setMapel} loadOptions={loadMapel} placeholder="Cari mapel…" />
          </Field>
          <Field label="Semester" required>
            <SearchableSelect value={semester} onChange={setSemester} options={SEMESTER_OPTIONS} placeholder="Pilih semester…" />
          </Field>
          <Field label="Tahun Ajaran" required>
            <SearchableSelect value={tahunAjaran} onChange={setTahunAjaran} loadOptions={loadTA} placeholder="Cari TA…" />
          </Field>
        </div>
        {error ? (
          <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {error}
          </div>
        ) : null}
        <div className="mt-4 flex justify-end">
          <Button onClick={submit} disabled={!ready}>
            Buka Editor Nilai
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-fg">
        {label}
        {required ? <span className="text-rose-600 ml-0.5">*</span> : null}
      </label>
      {children}
    </div>
  );
}
