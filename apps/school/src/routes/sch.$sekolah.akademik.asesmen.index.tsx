import { useCallback, useMemo, useState } from "react";
import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";
import {
  Badge,
  Button,
  Modal,
  PageHeader,
  SectionCard,
  SearchableSelect,
  type SearchableOption,
  IconPlus,
} from "@sekolahpro/ui";
import { createResource, listResource, useResourceList } from "@sekolahpro/api-client";
import { useSessionStore } from "@sekolahpro/auth";
import { useQueryClient } from "@tanstack/react-query";
import { useAkademikContextOptional } from "../lib/akademikContext";

interface AsesmenRow {
  name: string;
  judul: string;
  komponen?: string;
  tanggal?: string;
  rombel?: string;
  mata_pelajaran?: string;
}

const ASESMEN_FIELDS = ["name", "judul", "komponen", "tanggal", "rombel", "mata_pelajaran"];

async function loadRombel(q: string): Promise<SearchableOption[]> {
  const filters: Array<[string, string, string]> = q ? [["nama_rombel", "like", `%${q}%`]] : [];
  filters.push(["status", "=", "Aktif"]);
  const rows = await listResource<{ name: string; nama_rombel?: string; tingkat?: number }>(
    "Rombongan Belajar",
    { fields: ["name", "nama_rombel", "tingkat"], filters, order_by: "`tingkat` asc, `nama_rombel` asc", limit_page_length: 40 },
  );
  return rows.map((r) => {
    const opt: SearchableOption = { value: r.name, label: r.nama_rombel ?? r.name };
    if (r.tingkat != null) opt.hint = `Tingkat ${r.tingkat}`;
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
  return rows.map((r) => {
    const opt: SearchableOption = { value: r.name, label: r.nama_mapel ?? r.name };
    if (r.kode_mapel) opt.hint = r.kode_mapel;
    return opt;
  });
}

function AsesmenListPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const navigate = useNavigate();
  const ctx = useAkademikContextOptional();
  const [rombel, setRombel] = useState("");
  const [mapel, setMapel] = useState("");
  const [openCreate, setOpenCreate] = useState(false);

  const filters = useMemo(() => {
    const out: Array<[string, string, string]> = [];
    if (rombel) out.push(["rombel", "=", rombel]);
    if (mapel) out.push(["mata_pelajaran", "=", mapel]);
    if (ctx?.tahunAjaran) out.push(["tahun_ajaran", "=", ctx.tahunAjaran]);
    return out;
  }, [rombel, mapel, ctx?.tahunAjaran]);

  const listQ = useResourceList<AsesmenRow>("Asesmen", {
    fields: ASESMEN_FIELDS,
    filters,
    order_by: "`tanggal` desc",
    limit_page_length: 100,
  });
  const rows = listQ.data ?? [];
  const ready = !!(rombel && mapel);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Akademik · Input Nilai Test"
        title="Input Nilai Test"
        description="Pilih kelas & mapel, lalu buka/buat test untuk input nilai cepat satu kelas."
        actions={
          <Button onClick={() => setOpenCreate(true)} disabled={!ready}>
            <span className="h-4 w-4 mr-1.5"><IconPlus /></span>
            Test Baru
          </Button>
        }
      />

      <SectionCard title="Kelas & Mapel" description="Tentukan rombel dan mata pelajaran yang mau dinilai.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-fg">Rombongan Belajar</label>
            <SearchableSelect value={rombel} onChange={setRombel} loadOptions={loadRombel} placeholder="Cari rombel…" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-fg">Mata Pelajaran</label>
            <SearchableSelect value={mapel} onChange={setMapel} loadOptions={loadMapel} placeholder="Cari mapel…" />
          </div>
        </div>
        {!ready ? (
          <div className="mt-3 text-xs text-muted-fg">Pilih rombel + mapel untuk melihat & membuat test.</div>
        ) : null}
      </SectionCard>

      {ready ? (
        <SectionCard title="Daftar Test" description="Klik test untuk input nilai siswa.">
          {listQ.isLoading ? (
            <div className="text-sm text-muted-fg">Memuat…</div>
          ) : rows.length === 0 ? (
            <div className="text-sm text-muted-fg">Belum ada test. Klik “Test Baru” untuk membuat.</div>
          ) : (
            <ul className="divide-y divide-border -my-2">
              {rows.map((r) => (
                <li key={r.name} className="py-2.5">
                  <Link
                    to="/sch/$sekolah/akademik/asesmen/$id"
                    params={{ sekolah, id: r.name }}
                    className="flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-fg group-hover:text-brand truncate">{r.judul}</div>
                      <div className="text-xs text-muted-fg">
                        {r.komponen ?? "—"}
                        {r.tanggal ? ` · ${r.tanggal}` : ""}
                      </div>
                    </div>
                    {r.komponen ? <Badge tone="brand">{r.komponen}</Badge> : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      ) : null}

      <CreateTestModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        rombel={rombel}
        mapel={mapel}
        defaultTa={ctx?.tahunAjaran ?? ""}
        onCreated={(id) => {
          setOpenCreate(false);
          navigate({ to: "/sch/$sekolah/akademik/asesmen/$id", params: { sekolah, id } });
        }}
      />
    </div>
  );
}

interface CreateProps {
  open: boolean;
  onClose: () => void;
  rombel: string;
  mapel: string;
  defaultTa: string;
  onCreated: (id: string) => void;
}

function CreateTestModal({ open, onClose, rombel, mapel, defaultTa, onCreated }: CreateProps) {
  const qc = useQueryClient();
  const activeSekolah = useSessionStore((s) => s.activeSekolah);
  const [judul, setJudul] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [komponen, setKomponen] = useState("");
  const [semester, setSemester] = useState("");
  const [ta, setTa] = useState(defaultTa);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadKomponen = useCallback(
    async (q: string): Promise<SearchableOption[]> => {
      const filters: Array<[string, string, string]> = [["mata_pelajaran", "=", mapel]];
      if (q) filters.push(["nama", "like", `%${q}%`]);
      const rows = await listResource<{ name: string; nama?: string; bobot?: number }>("Komponen Nilai", {
        fields: ["name", "nama", "bobot"],
        filters,
        order_by: "`nama` asc",
        limit_page_length: 40,
      });
      return rows.map((r) => {
        const opt: SearchableOption = { value: r.name, label: r.nama ?? r.name };
        if (r.bobot != null) opt.hint = `Bobot ${r.bobot}%`;
        return opt;
      });
    },
    [mapel],
  );

  const loadSemester = useCallback(async (q: string): Promise<SearchableOption[]> => {
    const filters: Array<[string, string, string]> = q ? [["name", "like", `%${q}%`]] : [];
    const rows = await listResource<{ name: string }>("Semester", { fields: ["name"], filters, limit_page_length: 30 });
    return rows.map((r) => ({ value: r.name, label: r.name }));
  }, []);

  const loadTa = useCallback(async (q: string): Promise<SearchableOption[]> => {
    const filters: Array<[string, string, string]> = q ? [["nama", "like", `%${q}%`]] : [];
    const rows = await listResource<{ name: string; nama?: string }>("Tahun Ajaran", {
      fields: ["name", "nama"],
      filters,
      order_by: "`nama` desc",
      limit_page_length: 30,
    });
    return rows.map((r) => ({ value: r.name, label: r.nama ?? r.name }));
  }, []);

  const ready = !!(judul.trim() && tanggal && komponen && semester && ta);

  const submit = async () => {
    if (!ready) {
      setError("Lengkapi judul, tanggal, komponen, semester, dan tahun ajaran.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        judul: judul.trim(),
        tanggal,
        komponen,
        mata_pelajaran: mapel,
        rombel,
        semester,
        tahun_ajaran: ta,
      };
      if (activeSekolah?.name) body.sekolah = activeSekolah.name;
      const created = await createResource<{ name: string }>("Asesmen", body);
      await qc.invalidateQueries({ queryKey: ["resource:list", "Asesmen"] });
      onCreated(created.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat test.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Test Baru" description="Buat test/ulangan untuk kelas & mapel terpilih." size="md">
      <div className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-fg">Judul Test<span className="text-rose-600 ml-0.5">*</span></label>
          <input
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            placeholder="mis. Ulangan Harian Bab 3"
            className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-fg">Tanggal<span className="text-rose-600 ml-0.5">*</span></label>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-fg">Komponen / Jenis<span className="text-rose-600 ml-0.5">*</span></label>
            <SearchableSelect value={komponen} onChange={setKomponen} loadOptions={loadKomponen} placeholder="UH / UTS / UAS…" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-fg">Semester<span className="text-rose-600 ml-0.5">*</span></label>
            <SearchableSelect value={semester} onChange={setSemester} loadOptions={loadSemester} placeholder="Pilih semester…" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-fg">Tahun Ajaran<span className="text-rose-600 ml-0.5">*</span></label>
            <SearchableSelect value={ta} onChange={setTa} loadOptions={loadTa} placeholder="Pilih TA…" />
          </div>
        </div>
        {error ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</div>
        ) : null}
        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
          <Button type="button" onClick={submit} disabled={busy || !ready}>
            {busy ? "Membuat…" : "Buat & Input Nilai"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akademik/asesmen/")({ component: AsesmenListPage });
