/**
 * Akademik · Input Nilai Test (daftar + buat Asesmen).
 *
 * Redesign goals (presentation + guidance + visualization only — NO behavior
 * change): a guided flow tailored to Guru, with a PageGuide, a numbered
 * workflow strip, summary StatCards + a horizontal bar chart of test count per
 * komponen derived from the already-loaded rows, and a cleaner test list with
 * status badges. All data wiring (doctype/field names, filters, the create
 * payload, query invalidation, and routing) is preserved exactly as before.
 */
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";
import {
  Badge,
  Button,
  Modal,
  PageHeader,
  SectionCard,
  StatCard,
  SearchableSelect,
  type SearchableOption,
  cn,
  IconPlus,
} from "@sekolahpro/ui";
import { createResource, listResource, useResourceList } from "@sekolahpro/api-client";
import { useSessionStore } from "@sekolahpro/auth";
import { useQueryClient } from "@tanstack/react-query";
import { useAkademikContextOptional } from "../lib/akademikContext";
import { PageGuide } from "../components/guide";
import { HBarChart, type ChartDatum, type Tone } from "../components/viz";
import { useAkademikRole, ROLE_LABEL, type AkademikRole } from "../lib/akademikRole";

interface AsesmenRow {
  name: string;
  judul: string;
  komponen?: string;
  tanggal?: string;
  rombel?: string;
  mata_pelajaran?: string;
}

const ASESMEN_FIELDS = ["name", "judul", "komponen", "tanggal", "rombel", "mata_pelajaran"];

/** Maximum number of komponen bars rendered in the distribution chart. */
const MAX_KOMPONEN_BARS = 6;
/** Rotating tones used to color komponen bars for visual variety. */
const KOMPONEN_TONES: Tone[] = ["brand", "violet", "sky", "emerald", "amber", "rose"];
/** Storage key so the page guide remembers its collapsed state per user. */
const GUIDE_STORAGE_ID = "asesmen-list";

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

/** Format an ISO date string to the Indonesian short locale, safely. */
function formatTanggal(iso?: string): string {
  if (!iso) return "Tanggal belum diatur";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Build the "jumlah test per komponen" chart data from the loaded rows.
 * Empty/unknown komponen is grouped under "Lainnya"; only the top bars are kept.
 */
function buildKomponenChart(rows: AsesmenRow[]): ChartDatum[] {
  const counts = new Map<string, number>();
  for (const r of rows) {
    const key = r.komponen?.trim() || "Lainnya";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_KOMPONEN_BARS)
    .map(([label, value], i) => {
      // Index is always in range; fall back to "brand" to satisfy exact types.
      const tone: Tone = KOMPONEN_TONES[i % KOMPONEN_TONES.length] ?? "brand";
      return { label, value, tone };
    });
}

/** One step in the guided Guru workflow strip. */
interface FlowStep {
  icon: ReactNode;
  title: string;
  detail: string;
}

/**
 * Workflow strip showing the 4-step Guru flow. `activeIndex` highlights the
 * step the teacher is currently on (selection -> create -> input -> done).
 */
function WorkflowStrip({ steps, activeIndex }: { steps: FlowStep[]; activeIndex: number }): ReactNode {
  return (
    <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {steps.map((s, i) => {
        const done = i < activeIndex;
        const active = i === activeIndex;
        return (
          <li
            key={s.title}
            className={cn(
              "flex items-start gap-3 rounded-lg border p-3 transition-colors",
              active ? "border-brand bg-brand/5" : done ? "border-emerald-200 bg-emerald-50/40" : "border-border bg-bg",
            )}
          >
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                active ? "bg-brand text-white" : done ? "bg-emerald-500 text-white" : "bg-muted text-muted-fg",
              )}
            >
              {done ? <span className="h-4 w-4"><IconCheckGlyph /></span> : i + 1}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-sm font-medium text-fg">
                <span className="h-4 w-4 text-muted-fg">{s.icon}</span>
                {s.title}
              </div>
              <p className="mt-0.5 text-xs text-muted-fg">{s.detail}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** The 4 friendly steps of the Guru input-nilai flow, in Bahasa Indonesia. */
const FLOW_STEPS: FlowStep[] = [
  { icon: <IconUsersGlyph />, title: "Pilih kelas & mapel", detail: "Tentukan rombel dan mata pelajaran yang akan dinilai." },
  { icon: <IconPlus className="h-4 w-4 shrink-0" />, title: "Buat test", detail: "Beri judul, tanggal, komponen, semester, dan tahun ajaran." },
  { icon: <IconEditPencil />, title: "Input nilai per siswa", detail: "Isi nilai satu kelas dengan cepat di halaman test." },
  { icon: <IconCheckGlyph />, title: "Nilai masuk komponen", detail: "Nilai otomatis terhitung pada komponen mata pelajaran." },
];

/**
 * Inline, dependency-free SVG glyphs. Defined locally so the page never relies
 * on icon exports that may not exist in the shared UI package.
 */
function Glyph({ children }: { children: ReactNode }): ReactNode {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-full w-full" aria-hidden>
      {children}
    </svg>
  );
}

/** Pencil/edit glyph. */
function IconEditPencil(): ReactNode {
  return (
    <Glyph>
      <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" strokeLinecap="round" strokeLinejoin="round" />
    </Glyph>
  );
}

/** Book glyph (represents a test/asesmen). */
function IconBookGlyph(): ReactNode {
  return (
    <Glyph>
      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v15H6.5A2.5 2.5 0 0 0 4 19.5Z" strokeLinejoin="round" />
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20v5H6.5A2.5 2.5 0 0 1 4 19.5Z" strokeLinejoin="round" />
    </Glyph>
  );
}

/** Check/done glyph. */
function IconCheckGlyph(): ReactNode {
  return (
    <Glyph>
      <path d="m20 6-11 11-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </Glyph>
  );
}

/** Bar-chart glyph. */
function IconChartGlyph(): ReactNode {
  return (
    <Glyph>
      <path d="M3 3v18h18" strokeLinecap="round" />
      <rect x="7" y="11" width="3" height="6" rx="0.5" />
      <rect x="13" y="7" width="3" height="10" rx="0.5" />
    </Glyph>
  );
}

/** People/users glyph. */
function IconUsersGlyph(): ReactNode {
  return (
    <Glyph>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3 20a6 6 0 0 1 12 0M16 5.5a3.5 3.5 0 0 1 0 6.5M17 20a6 6 0 0 0-1.5-4" strokeLinecap="round" />
    </Glyph>
  );
}

/** Clock glyph. */
function IconClockGlyph(): ReactNode {
  return (
    <Glyph>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </Glyph>
  );
}

/** Small role-focus chip describing what each role does on this page. */
function RoleFocus({ role, active, text }: { role: AkademikRole; active: boolean; text: string }): ReactNode {
  return (
    <div
      className={cn(
        "rounded-lg border p-3 text-xs",
        active ? "border-brand bg-brand/5" : "border-border bg-bg",
      )}
    >
      <div className="mb-1 flex items-center gap-1.5">
        <span className="font-medium text-fg">{ROLE_LABEL[role]}</span>
        {active ? <Badge tone="brand">Anda</Badge> : null}
      </div>
      <p className="text-muted-fg">{text}</p>
    </div>
  );
}

function AsesmenListPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const navigate = useNavigate();
  const ctx = useAkademikContextOptional();
  const { primary, isGuru, isAdmin, isKepala } = useAkademikRole();
  const periodeSuffix = ctx?.tahunAjaran ? ` · Periode: ${ctx.tahunAjaran} ${ctx.semester}` : "";
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

  // Derived presentation-only metrics from already-loaded rows.
  const komponenChart = useMemo(() => buildKomponenChart(rows), [rows]);
  const distinctKomponen = useMemo(
    () => new Set(rows.map((r) => r.komponen?.trim()).filter(Boolean)).size,
    [rows],
  );
  const activeStep = !ready ? 0 : rows.length === 0 ? 1 : 2;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Akademik · Input Nilai Test"
        title="Input Nilai Test"
        description={`Pilih kelas & mapel, lalu buka/buat test untuk input nilai cepat satu kelas.${periodeSuffix}`}
        actions={
          <Button onClick={() => setOpenCreate(true)} disabled={!ready}>
            <IconPlus className="mr-1.5 h-4 w-4 shrink-0" />
            Test Baru
          </Button>
        }
      />

      <PageGuide
        storageId={GUIDE_STORAGE_ID}
        intro="Halaman ini membantu Guru menilai satu kelas dengan cepat: pilih kelas & mapel, buat test, lalu input nilai per siswa. Nilai otomatis masuk ke komponen mata pelajaran."
        steps={[
          {
            title: "Pilih rombel & mata pelajaran",
            detail: "Gunakan dua kolom di bawah. Daftar test akan muncul setelah keduanya dipilih.",
            roles: ["guru", "admin"],
          },
          {
            title: "Buat test baru",
            detail: 'Klik "Test Baru", isi judul, tanggal, komponen (UH/UTS/UAS), semester, dan tahun ajaran.',
            roles: ["guru"],
          },
          {
            title: "Input nilai per siswa",
            detail: "Setelah test dibuat Anda langsung diarahkan ke halaman input nilai satu kelas.",
            roles: ["guru"],
          },
          {
            title: "Pantau cakupan penilaian",
            detail: "Kepala sekolah & admin dapat melihat berapa test per komponen sudah dibuat lewat ringkasan di bawah.",
            roles: ["kepala", "admin"],
          },
        ]}
        tips={[
          "Komponen menentukan bobot nilai pada rapor — pastikan memilih komponen yang benar.",
          "Satu test = satu penilaian untuk satu kelas. Buat test terpisah untuk UH, UTS, dan UAS.",
        ]}
      />

      <SectionCard title="Alur input nilai" description="Empat langkah singkat untuk Guru.">
        <WorkflowStrip steps={FLOW_STEPS} activeIndex={activeStep} />
      </SectionCard>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <RoleFocus
          role="guru"
          active={isGuru}
          text="Membuat test & meng-input nilai siswa untuk kelas yang diampu."
        />
        <RoleFocus
          role="kepala"
          active={isKepala}
          text="Memantau cakupan penilaian: berapa test & komponen yang sudah berjalan."
        />
        <RoleFocus
          role="admin"
          active={isAdmin}
          text="Memastikan periode, komponen, dan mapel tersedia untuk seluruh guru."
        />
      </div>

      <SectionCard title="Kelas & Mapel" description="Tentukan rombel dan mata pelajaran yang mau dinilai.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          <div className="mt-3 rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-fg">
            Pilih rombel + mapel untuk melihat & membuat test.
          </div>
        ) : null}
      </SectionCard>

      {ready ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label="Jumlah Test"
              value={listQ.isLoading ? "…" : rows.length}
              hint="Pada kelas & mapel terpilih"
              icon={<IconBookGlyph />}
              accent="brand"
            />
            <StatCard
              label="Jenis Komponen"
              value={listQ.isLoading ? "…" : distinctKomponen}
              hint="Komponen nilai yang dipakai"
              icon={<IconChartGlyph />}
              accent="violet"
            />
            <StatCard
              label="Test Terbaru"
              value={listQ.isLoading ? "…" : rows[0] ? formatTanggal(rows[0].tanggal) : "—"}
              hint={rows[0]?.judul ?? "Belum ada test"}
              icon={<IconClockGlyph />}
              accent="emerald"
            />
          </div>

          <SectionCard title="Jumlah Test per Komponen" description="Sebaran test pada kelas & mapel terpilih.">
            {rows.length === 0 ? (
              <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-fg">
                Belum ada data untuk divisualisasikan.
              </div>
            ) : (
              <HBarChart data={komponenChart} valueFormatter={(v) => `${v} test`} />
            )}
          </SectionCard>

          <SectionCard title="Daftar Test" description="Klik test untuk input nilai siswa.">
            {listQ.isLoading ? (
              <div className="text-sm text-muted-fg">Memuat…</div>
            ) : rows.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                <span className="h-8 w-8 text-muted-fg"><IconBookGlyph /></span>
                <div className="text-sm font-medium text-fg">Belum ada test</div>
                <p className="max-w-xs text-xs text-muted-fg">
                  Buat test pertama untuk kelas & mapel ini, lalu input nilai satu kelas dengan cepat.
                </p>
                <Button className="mt-1" onClick={() => setOpenCreate(true)}>
                  <IconPlus className="mr-1.5 h-4 w-4 shrink-0" />
                  Test Baru
                </Button>
              </div>
            ) : (
              <ul className="-my-2 divide-y divide-border">
                {rows.map((r) => (
                  <li key={r.name} className="py-2.5">
                    <Link
                      to="/sch/$sekolah/akademik/asesmen/$id"
                      params={{ sekolah, id: r.name }}
                      className="group flex items-center justify-between gap-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                          <span className="h-4 w-4"><IconBookGlyph /></span>
                        </span>
                        <div className="min-w-0">
                          <div className="truncate font-medium text-fg group-hover:text-brand">{r.judul}</div>
                          <div className="text-xs text-muted-fg">{formatTanggal(r.tanggal)}</div>
                        </div>
                      </div>
                      {r.komponen ? (
                        <Badge tone="brand">{r.komponen}</Badge>
                      ) : (
                        <span className="shrink-0 text-xs text-muted-fg">Tanpa komponen</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </>
      ) : null}

      <CreateTestModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        rombel={rombel}
        mapel={mapel}
        defaultTa={ctx?.tahunAjaran ?? ""}
        roleLabel={ROLE_LABEL[primary]}
        sekolah={sekolah}
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
  roleLabel: string;
  /** Tenant scope from the route (`/sch/$sekolah`); always present. */
  sekolah: string;
  onCreated: (id: string) => void;
}

/**
 * Resolve the tenant (sekolah) for a new Asesmen. The field is mandatory on the
 * doctype, so prefer the explicit session school but fall back to the route
 * param (guaranteed on `/sch/$sekolah`) instead of silently omitting it.
 * Returns null only when neither source is available.
 */
export function resolveAsesmenTenant(
  activeSekolahName: string | undefined,
  urlSekolah: string,
): string | null {
  return activeSekolahName || urlSekolah || null;
}

/** Labelled field wrapper for the create form (keeps the modal markup tidy). */
function FormRow({ label, required, children }: { label: string; required?: boolean; children: ReactNode }): ReactNode {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-fg">
        {label}
        {required ? <span className="ml-0.5 text-rose-600">*</span> : null}
      </label>
      {children}
    </div>
  );
}

function CreateTestModal({ open, onClose, rombel, mapel, defaultTa, roleLabel, sekolah, onCreated }: CreateProps) {
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
    // Asesmen.sekolah is mandatory (multi-tenant). Never POST without it: if the
    // session store has not hydrated yet, fall back to the route tenant param.
    const tenant = resolveAsesmenTenant(activeSekolah?.name, sekolah);
    if (!tenant) {
      setError("Sekolah tidak diketahui pada sesi ini. Muat ulang halaman lalu coba lagi.");
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
        sekolah: tenant,
      };
      const created = await createResource<{ name: string }>("Asesmen", body);
      await qc.invalidateQueries({ queryKey: ["resource:list", "Asesmen"] });
      onCreated(created.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat test.");
    } finally {
      setBusy(false);
    }
  };

  const inputClass =
    "w-full rounded-md border border-border bg-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40";

  return (
    <Modal open={open} onClose={onClose} title="Test Baru" description="Buat test/ulangan untuk kelas & mapel terpilih." size="md">
      <div className="space-y-4">
        <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-fg">
          Sebagai <span className="font-medium text-fg">{roleLabel}</span>, isi detail test di bawah. Setelah dibuat Anda
          langsung diarahkan ke halaman input nilai satu kelas.
        </div>

        <FormRow label="Judul Test" required>
          <input
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            placeholder="mis. Ulangan Harian Bab 3"
            className={inputClass}
          />
        </FormRow>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormRow label="Tanggal" required>
            <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className={inputClass} />
          </FormRow>
          <FormRow label="Komponen / Jenis" required>
            <SearchableSelect value={komponen} onChange={setKomponen} loadOptions={loadKomponen} placeholder="UH / UTS / UAS…" />
          </FormRow>
          <FormRow label="Semester" required>
            <SearchableSelect value={semester} onChange={setSemester} loadOptions={loadSemester} placeholder="Pilih semester…" />
          </FormRow>
          <FormRow label="Tahun Ajaran" required>
            <SearchableSelect value={ta} onChange={setTa} loadOptions={loadTa} placeholder="Pilih TA…" />
          </FormRow>
        </div>

        {error ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</div>
        ) : null}

        <div className="flex justify-end gap-2 border-t border-border pt-2">
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
