/**
 * Ekstrakurikuler · Raport akhir semester (pembina view).
 *
 * Alur pembina: pilih program → "Generate Raport semua peserta" (rekap
 * kehadiran diisi otomatis oleh server) → atur predikat inline dengan saran
 * default yang bisa diubah → finalkan. Mirror pola autosave row-state
 * (idle|dirty|saving|saved|error) dari EntriNilaiGrid: setiap baris raport
 * memantau status simpannya sendiri sehingga sukses/gagal terlihat per baris.
 */
import { useCallback, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  createResource,
  listResource,
  updateResource,
  useResourceList,
} from "@sekolahpro/api-client";
import {
  Badge,
  Button,
  Input,
  PageHeader,
  SearchableSelect,
  SectionCard,
  Select,
  StatCard,
  IconFlag,
  IconCheck,
  type SearchableOption,
} from "@sekolahpro/ui";
import { DonutChart, type ChartDatum, type Tone } from "../components/viz";
import { PageGuide, type PageGuideStep } from "../components/guide";
import { useEkskulContext } from "../lib/ekskulContext";
import { useEkskulRole, ROLE_LABEL } from "../lib/ekskulRole";
import {
  ALL_PREDIKAT,
  predikatFromKehadiran,
  type Predikat,
} from "../lib/predikatFromKehadiran";

/* ------------------------------------------------------------------ */
/* Types & constants                                                   */
/* ------------------------------------------------------------------ */

const DOCTYPE_PROGRAM = "Ekstrakurikuler";
const DOCTYPE_PENDAFTARAN = "Pendaftaran Ekstrakurikuler";
const DOCTYPE_RAPORT = "Raport Ekstrakurikuler";
const DOCTYPE_SISWA = "Siswa";

const STATUS_DRAFT = "Draft";
const STATUS_FINAL = "Final";
const STATUS_AKTIF = "Aktif";
const NO_LIMIT = 0;
const PROGRAM_PAGE = 50;

/** Raport row returned by the list query. Recap fields are server-snapshot, read-only. */
interface RaportRow {
  name: string;
  siswa: string;
  status?: string;
  predikat?: string;
  deskripsi?: string;
  jumlah_hadir?: number;
  jumlah_pertemuan?: number;
  persentase_kehadiran?: number;
}

/** Autosave lifecycle for a single raport row (mirrors EntriNilaiGrid cell). */
type RowStatus = "idle" | "dirty" | "saving" | "saved" | "error";

/** Per-row save state keyed by raport name. */
interface RowState {
  status: RowStatus;
  error?: string;
}

type RowStateMap = Record<string, RowState>;

/** Predikat → chart Tone, in descending quality so the donut reads top-down. */
const PREDIKAT_TONE: Record<Predikat, Tone> = {
  "Sangat Baik": "emerald",
  Baik: "brand",
  Cukup: "amber",
  Kurang: "rose",
};

const RAPORT_FIELDS = [
  "name",
  "siswa",
  "status",
  "predikat",
  "deskripsi",
  "jumlah_hadir",
  "jumlah_pertemuan",
  "persentase_kehadiran",
];

const GUIDE_STEPS: PageGuideStep[] = [
  {
    title: "Pilih program ekstrakurikuler",
    detail: "Cari program pada tahun ajaran berjalan untuk menerbitkan raport pesertanya.",
    roles: ["pembina"],
  },
  {
    title: "Generate Raport semua peserta",
    detail: "Satu ketuk membuat raport untuk tiap peserta aktif. Rekap kehadiran diisi server otomatis.",
    roles: ["pembina"],
  },
  {
    title: "Pilih predikat (saran sudah terisi)",
    detail: "Predikat disarankan dari persentase kehadiran. Ubah bila perlu — tersimpan otomatis.",
    roles: ["pembina"],
  },
  {
    title: "Finalkan raport",
    detail: "Setelah predikat & catatan benar, tekan Finalkan. Raport final terkunci untuk wali.",
    roles: ["pembina", "kepala"],
  },
];

/* ------------------------------------------------------------------ */
/* Pure helpers                                                        */
/* ------------------------------------------------------------------ */

/** Effective predikat for a row: saved value, else suggestion from attendance. */
function effectivePredikat(row: RaportRow): Predikat {
  if (row.predikat && (ALL_PREDIKAT as readonly string[]).includes(row.predikat)) {
    return row.predikat as Predikat;
  }
  return predikatFromKehadiran(row.persentase_kehadiran ?? 0);
}

/** Human-readable attendance recap: "85% · 17/20". */
function formatKehadiran(row: RaportRow): string {
  const persen = row.persentase_kehadiran ?? 0;
  const hadir = row.jumlah_hadir ?? 0;
  const total = row.jumlah_pertemuan ?? 0;
  return `${persen}% · ${hadir}/${total}`;
}

/** Donut data of predikat distribution across rows (one slice per band). */
function predikatChart(rows: readonly RaportRow[]): ChartDatum[] {
  const counts = new Map<Predikat, number>();
  for (const r of rows) {
    const p = effectivePredikat(r);
    counts.set(p, (counts.get(p) ?? 0) + 1);
  }
  return ALL_PREDIKAT.filter((p) => (counts.get(p) ?? 0) > 0).map(
    (p): ChartDatum => ({ label: p, value: counts.get(p) ?? 0, tone: PREDIKAT_TONE[p] }),
  );
}

/** Count how many rows are already Final. */
function countFinal(rows: readonly RaportRow[]): number {
  return rows.filter((r) => r.status === STATUS_FINAL).length;
}

/** Siswa whose enrollment is active but who have no raport yet. */
function missingSiswa(active: readonly string[], existing: readonly RaportRow[]): string[] {
  const have = new Set(existing.map((r) => r.siswa));
  return active.filter((s) => !have.has(s));
}

/* ------------------------------------------------------------------ */
/* Data hooks                                                          */
/* ------------------------------------------------------------------ */

/** Async loader for the program SearchableSelect, scoped to the active TA. */
function useProgramLoader(tahunAjaran: string): (q: string) => Promise<SearchableOption[]> {
  return useCallback(
    async (q: string): Promise<SearchableOption[]> => {
      const filters: [string, string, string][] = [["tahun_ajaran", "=", tahunAjaran]];
      if (q) filters.push(["nama", "like", `%${q}%`]);
      const rows = await listResource<{ name: string; nama?: string; kategori?: string }>(
        DOCTYPE_PROGRAM,
        { fields: ["name", "nama", "kategori"], filters, order_by: "`nama` asc", limit_page_length: PROGRAM_PAGE },
      );
      return rows.map((r): SearchableOption => ({
        value: r.name,
        label: r.nama ?? r.name,
        ...(r.kategori ? { hint: r.kategori } : {}),
      }));
    },
    [tahunAjaran],
  );
}

/* ------------------------------------------------------------------ */
/* Route component                                                     */
/* ------------------------------------------------------------------ */

/** Top-level raport manager: program picker + generate + grid + summary. */
function RaportManager() {
  const ctx = useEkskulContext();
  const { primary } = useEkskulRole();
  const [program, setProgram] = useState("");
  const loadProgram = useProgramLoader(ctx.tahunAjaran);

  const pesertaQ = useResourceList<{ siswa: string }>(
    DOCTYPE_PENDAFTARAN,
    {
      fields: ["siswa"],
      filters: [["ekstrakurikuler", program], ["status", "=", STATUS_AKTIF]] as [string, string, string][],
      limit_page_length: NO_LIMIT,
    },
    { enabled: !!program },
  );
  const raportQ = useResourceList<RaportRow>(
    DOCTYPE_RAPORT,
    {
      fields: RAPORT_FIELDS,
      filters: [["ekstrakurikuler", program], ["semester", "=", ctx.semester]] as [string, string, string][],
      limit_page_length: NO_LIMIT,
    },
    { enabled: !!program },
  );

  const peserta = useMemo(() => pesertaQ.data ?? [], [pesertaQ.data]);
  const raports = useMemo(() => raportQ.data ?? [], [raportQ.data]);
  const namaBySiswa = useSiswaNames(raports);
  const pending = useMemo(
    () => missingSiswa(peserta.map((p) => p.siswa), raports),
    [peserta, raports],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Ekstrakurikuler · Raport"
        title="Raport Akhir Semester"
        description="Terbitkan raport tiap peserta — rekap kehadiran otomatis, tinggal pilih predikat lalu finalkan."
      />

      <PageGuide
        storageId="ekskul-raport"
        title="Cara menerbitkan raport"
        intro="Generate untuk semua peserta, lalu konfirmasi predikat yang sudah disarankan dan finalkan."
        steps={GUIDE_STEPS}
        roleLabels={ROLE_LABEL}
      />

      <ProgramPicker
        value={program}
        onChange={setProgram}
        loadOptions={loadProgram}
        roleLabel={ROLE_LABEL[primary]}
      />

      {!program ? (
        <EmptyHint
          title="Pilih program lebih dulu"
          detail="Cari satu program ekstrakurikuler untuk melihat dan menerbitkan raport pesertanya."
        />
      ) : (
        <RaportBody
          program={program}
          semester={ctx.semester}
          peserta={peserta}
          raports={raports}
          pending={pending}
          namaBySiswa={namaBySiswa}
          loading={pesertaQ.isLoading || raportQ.isLoading}
          onRefetch={raportQ.refetch}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Siswa name resolution                                               */
/* ------------------------------------------------------------------ */

/** Fetch nama_lengkap for the raport rows' siswa and index by name. */
function useSiswaNames(raports: readonly RaportRow[]): Map<string, string> {
  const ids = useMemo(() => raports.map((r) => r.siswa).filter(Boolean), [raports]);
  const siswaQ = useResourceList<{ name: string; nama_lengkap?: string }>(
    DOCTYPE_SISWA,
    {
      fields: ["name", "nama_lengkap"],
      filters: ids.length > 0 ? ([["name", "in", ids.join(",")]] as [string, string, string][]) : [],
      limit_page_length: NO_LIMIT,
    },
    { enabled: ids.length > 0 },
  );
  return useMemo(() => {
    const map = new Map<string, string>();
    for (const s of siswaQ.data ?? []) map.set(s.name, s.nama_lengkap ?? s.name);
    return map;
  }, [siswaQ.data]);
}

/* ------------------------------------------------------------------ */
/* Program picker                                                      */
/* ------------------------------------------------------------------ */

interface ProgramPickerProps {
  value: string;
  onChange: (v: string) => void;
  loadOptions: (q: string) => Promise<SearchableOption[]>;
  roleLabel: string;
}

/** Sticky-ish card to pick the program whose raports we manage. */
function ProgramPicker({ value, onChange, loadOptions, roleLabel }: ProgramPickerProps) {
  return (
    <SectionCard
      title="Program ekstrakurikuler"
      description="Pilih program pada tahun ajaran berjalan untuk menerbitkan raportnya."
      action={<Badge tone="brand">{roleLabel}</Badge>}
    >
      <div className="max-w-md">
        <SearchableSelect
          id="ekskul-raport-program"
          value={value}
          onChange={onChange}
          loadOptions={loadOptions}
          placeholder="Cari program…"
          className="w-full"
        />
      </div>
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/* Body (after a program is picked)                                    */
/* ------------------------------------------------------------------ */

interface RaportBodyProps {
  program: string;
  semester: string;
  peserta: { siswa: string }[];
  raports: RaportRow[];
  pending: string[];
  namaBySiswa: Map<string, string>;
  loading: boolean;
  onRefetch: () => void;
}

/** Renders stats, generate CTA, grid and summary for the picked program. */
function RaportBody({
  program,
  semester,
  peserta,
  raports,
  pending,
  namaBySiswa,
  loading,
  onRefetch,
}: RaportBodyProps) {
  const [rowState, setRowState] = useState<RowStateMap>({});
  const setRow = useCallback((name: string, state: RowState) => {
    setRowState((s) => ({ ...s, [name]: state }));
  }, []);

  if (loading) {
    return <div className="py-12 text-center text-sm text-muted-fg">Memuat data raport…</div>;
  }
  if (peserta.length === 0) {
    return (
      <EmptyHint
        title="Program ini belum punya peserta aktif"
        detail="Daftarkan peserta di menu Pendaftaran terlebih dahulu, lalu kembali untuk menerbitkan raport."
      />
    );
  }

  const finalCount = countFinal(raports);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Peserta Aktif" value={peserta.length} hint="Pendaftaran berjalan" icon={<IconFlag />} accent="brand" />
        <StatCard label="Raport Dibuat" value={raports.length} hint={`${pending.length} belum dibuat`} icon={<IconCheck />} accent="violet" />
        <StatCard label="Sudah Final" value={finalCount} hint={`${raports.length - finalCount} masih draft`} icon={<IconCheck />} accent="emerald" />
      </div>

      <GenerateButton
        program={program}
        semester={semester}
        pending={pending}
        onDone={onRefetch}
      />

      {raports.length === 0 ? (
        <EmptyHint
          title="Belum ada raport untuk peserta"
          detail="Tekan tombol Generate di atas untuk membuat raport semua peserta aktif sekaligus."
        />
      ) : (
        <>
          <RaportGrid
            rows={raports}
            namaBySiswa={namaBySiswa}
            rowState={rowState}
            setRow={setRow}
            onRefetch={onRefetch}
          />
          <RaportSummary rows={raports} finalCount={finalCount} />
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Generate button                                                     */
/* ------------------------------------------------------------------ */

interface GenerateButtonProps {
  program: string;
  semester: string;
  pending: string[];
  onDone: () => void;
}

/**
 * Bulk-create a Draft raport for every active peserta WITHOUT one yet.
 * Runs sequentially (for…of + await) to avoid hammering the backend, then
 * refetches and reports how many were created.
 */
function GenerateButton({ program, semester, pending, onDone }: GenerateButtonProps) {
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<number | null>(null);

  const run = useCallback(async () => {
    setBusy(true);
    setCreated(null);
    let made = 0;
    for (const siswa of pending) {
      await createResource(DOCTYPE_RAPORT, {
        siswa,
        ekstrakurikuler: program,
        semester,
        status: STATUS_DRAFT,
      });
      made += 1;
    }
    setBusy(false);
    setCreated(made);
    onDone();
  }, [pending, program, semester, onDone]);

  return (
    <SectionCard
      title="Generate raport"
      description="Membuat raport Draft untuk tiap peserta aktif yang belum punya raport. Rekap kehadiran diisi server otomatis."
    >
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => void run()} disabled={busy || pending.length === 0}>
          {busy ? "Membuat…" : `Generate Raport semua peserta (${pending.length})`}
        </Button>
        {pending.length === 0 ? (
          <span className="text-xs text-muted-fg">Semua peserta aktif sudah punya raport.</span>
        ) : null}
        {created !== null ? (
          <Badge tone={created > 0 ? "success" : "neutral"}>{created} dibuat</Badge>
        ) : null}
      </div>
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/* Grid                                                                */
/* ------------------------------------------------------------------ */

interface RaportGridProps {
  rows: RaportRow[];
  namaBySiswa: Map<string, string>;
  rowState: RowStateMap;
  setRow: (name: string, state: RowState) => void;
  onRefetch: () => void;
}

/** Table of raport rows; one editable RaportRowItem per existing raport. */
function RaportGrid({ rows, namaBySiswa, rowState, setRow, onRefetch }: RaportGridProps) {
  return (
    <SectionCard
      title={`${rows.length} raport peserta`}
      description="Atur predikat & catatan (tersimpan otomatis), lalu finalkan tiap baris."
      padded={false}
    >
      <div className="overflow-auto">
        <table className="min-w-full border-separate border-spacing-0 text-sm">
          <thead className="bg-muted">
            <tr>
              {["Siswa", "Kehadiran", "Predikat", "Deskripsi", "Status", "Aksi"].map((h) => (
                <th
                  key={h}
                  className="px-3 py-2 text-left text-xs uppercase tracking-wider text-muted-fg border-b border-border whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <RaportRowItem
                key={row.name}
                row={row}
                nama={namaBySiswa.get(row.siswa) ?? row.siswa}
                state={rowState[row.name] ?? { status: "idle" }}
                setRow={setRow}
                onRefetch={onRefetch}
              />
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/* Row                                                                 */
/* ------------------------------------------------------------------ */

interface RaportRowItemProps {
  row: RaportRow;
  nama: string;
  state: RowState;
  setRow: (name: string, state: RowState) => void;
  onRefetch: () => void;
}

/** Patch payload autosaved for a raport row. */
interface SavePatch {
  predikat: Predikat;
  deskripsi: string;
}

/**
 * Autosave callbacks for a single raport row, sharing the per-row status map.
 * `save` persists predikat/deskripsi; `finalize` locks the row to Final
 * (guarded by `predikat`). Both reflect saving/saved/error back into rowState.
 */
function useRaportRowSave(name: string, setRow: (n: string, s: RowState) => void, onRefetch: () => void) {
  const save = useCallback(
    async (patch: SavePatch): Promise<void> => {
      setRow(name, { status: "saving" });
      try {
        await updateResource(DOCTYPE_RAPORT, name, {
          predikat: patch.predikat,
          deskripsi: patch.deskripsi,
        });
        setRow(name, { status: "saved" });
      } catch (err) {
        setRow(name, { status: "error", error: errMsg(err) });
      }
    },
    [name, setRow],
  );

  const finalize = useCallback(
    async (predikat: Predikat): Promise<void> => {
      if (!predikat) return;
      setRow(name, { status: "saving" });
      try {
        await updateResource(DOCTYPE_RAPORT, name, { status: STATUS_FINAL, predikat });
        setRow(name, { status: "saved" });
        onRefetch();
      } catch (err) {
        setRow(name, { status: "error", error: errMsg(err) });
      }
    },
    [name, setRow, onRefetch],
  );

  return { save, finalize };
}

/**
 * One raport row with inline autosave. Predikat defaults to the saved value or
 * a kehadiran-based suggestion; deskripsi is free text. Editing either field
 * autosaves; "Finalkan" sets status Final (guarded: predikat must be set).
 */
function RaportRowItem({ row, nama, state, setRow, onRefetch }: RaportRowItemProps) {
  const [predikat, setPredikat] = useState<Predikat>(effectivePredikat(row));
  const [deskripsi, setDeskripsi] = useState(row.deskripsi ?? "");
  const isFinal = row.status === STATUS_FINAL;
  const { save, finalize } = useRaportRowSave(row.name, setRow, onRefetch);

  return (
    <tr className="hover:bg-muted/40 align-top">
      <td className="px-3 py-2 border-b border-border min-w-[12rem]">
        <div className="font-medium text-fg truncate">{nama}</div>
        <div className="text-[11px] text-muted-fg font-mono truncate">{row.siswa}</div>
      </td>
      <td className="px-3 py-2 border-b border-border whitespace-nowrap tabular-nums text-muted-fg">
        {formatKehadiran(row)}
      </td>
      <td className="px-3 py-2 border-b border-border">
        <PredikatSelect
          value={predikat}
          disabled={isFinal}
          onChange={(p) => {
            setPredikat(p);
            setRow(row.name, { status: "dirty" });
            void save({ predikat: p, deskripsi });
          }}
        />
      </td>
      <td className="px-3 py-2 border-b border-border min-w-[14rem]">
        <Input
          value={deskripsi}
          disabled={isFinal}
          placeholder="Catatan singkat…"
          onChange={(e) => {
            setDeskripsi(e.target.value);
            setRow(row.name, { status: "dirty" });
          }}
          onBlur={() => void save({ predikat, deskripsi })}
        />
      </td>
      <td className="px-3 py-2 border-b border-border whitespace-nowrap">
        <StatusBadge
          rowStatus={state.status}
          {...(row.status ? { status: row.status } : {})}
          {...(state.error ? { error: state.error } : {})}
        />
      </td>
      <td className="px-3 py-2 border-b border-border whitespace-nowrap">
        {isFinal ? (
          <span className="text-xs text-muted-fg">Terkunci</span>
        ) : (
          <Button
            size="sm"
            variant="outline"
            disabled={!predikat || state.status === "saving"}
            onClick={() => void finalize(predikat)}
          >
            Finalkan
          </Button>
        )}
      </td>
    </tr>
  );
}

/* ------------------------------------------------------------------ */
/* Predikat select                                                     */
/* ------------------------------------------------------------------ */

interface PredikatSelectProps {
  value: Predikat;
  disabled?: boolean;
  onChange: (p: Predikat) => void;
}

/** Native Select over ALL_PREDIKAT. Auto-suggested default is preselected. */
function PredikatSelect({ value, disabled, onChange }: PredikatSelectProps) {
  return (
    <Select
      value={value}
      disabled={disabled ?? false}
      className="w-36"
      onChange={(e) => onChange(e.target.value as Predikat)}
    >
      {ALL_PREDIKAT.map((p) => (
        <option key={p} value={p}>
          {p}
        </option>
      ))}
    </Select>
  );
}

/* ------------------------------------------------------------------ */
/* Status badge + summary                                              */
/* ------------------------------------------------------------------ */

/** Map the row's autosave status to a small tone + label badge. */
function StatusBadge({
  status,
  rowStatus,
  error,
}: {
  status?: string;
  rowStatus: RowStatus;
  error?: string;
}) {
  if (rowStatus === "saving") return <Badge tone="brand" dot>Menyimpan…</Badge>;
  if (rowStatus === "error") return <Badge tone="danger" dot>{error ?? "Gagal"}</Badge>;
  if (rowStatus === "saved") return <Badge tone="success" dot>Tersimpan</Badge>;
  if (rowStatus === "dirty") return <Badge tone="warning" dot>Belum disimpan</Badge>;
  return status === STATUS_FINAL ? (
    <Badge tone="success">Final</Badge>
  ) : (
    <Badge tone="neutral">Draft</Badge>
  );
}

/** Donut of predikat distribution + a Draft vs Final count. */
function RaportSummary({ rows, finalCount }: { rows: RaportRow[]; finalCount: number }) {
  const chart = useMemo(() => predikatChart(rows), [rows]);
  const draftCount = rows.length - finalCount;
  return (
    <SectionCard title="Ringkasan predikat" description="Sebaran predikat & progres finalisasi raport.">
      <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
        <DonutChart
          data={chart}
          centerTop={rows.length}
          centerBottom="raport"
        />
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Badge tone="success">Final</Badge>
            <span className="tabular-nums text-fg">{finalCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone="neutral">Draft</Badge>
            <span className="tabular-nums text-fg">{draftCount}</span>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/* Shared empty state                                                  */
/* ------------------------------------------------------------------ */

/** Bordered hint card used for the various empty states. */
function EmptyHint({ title, detail }: { title: string; detail: string }) {
  return (
    <SectionCard title={title}>
      <p className="text-sm text-muted-fg">{detail}</p>
    </SectionCard>
  );
}

/** Normalize an unknown thrown value into a user-facing message. */
function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : "Gagal menyimpan";
}

export const Route = createFileRoute("/sch/$sekolah/akademik/$ta/ekskul/raport/")({
  component: RaportManager,
});
