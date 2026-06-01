import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  Breadcrumb,
  Button,
  PageHeader,
  SectionCard,
  IconArrowLeft,
  IconChart,
} from "@sekolahpro/ui";
import {
  createResource,
  listResource,
  updateResource,
  useResourceList,
} from "@sekolahpro/api-client";
import { Link } from "@tanstack/react-router";
import { useAkademikContextOptional } from "../../lib/akademikContext";
import { ProgressRing, DistributionBar, type DistributionSegment } from "../viz";

interface Selection {
  rombel: string;
  mapel: string;
  semester: string;
  tahunAjaran: string;
}

interface Props {
  selection: Selection;
  onChangeSelection: () => void;
  sekolah?: string;
}

interface RombelDoc {
  name: string;
  nama_rombel?: string;
  tingkat?: number;
  anggota?: AnggotaRombel[];
}

interface AnggotaRombel {
  name?: string;
  siswa: string;
  no_urut?: number;
  status?: string;
}

interface SiswaInfo {
  name: string;
  nama_lengkap?: string;
  nis?: string;
}

interface KomponenNilai {
  name: string;
  nama: string;
  bobot?: number;
}

interface NilaiKomponenChild {
  name?: string;
  komponen: string;
  nilai_raw?: number | null;
}

interface EntriNilaiDoc {
  name: string;
  siswa: string;
  mata_pelajaran: string;
  semester: string;
  tahun_ajaran: string;
  tingkat?: string;
  nilai_akhir?: number;
  komponen?: NilaiKomponenChild[];
}

type CellStatus = "idle" | "dirty" | "saving" | "saved" | "error";

interface CellState {
  value: string;
  baseline: string;
  status: CellStatus;
  error?: string;
}

type GridState = Record<string, Record<string, CellState>>; // [siswa][komponen]

const ROMBEL_FIELDS_GET = ["name", "nama_rombel", "tingkat"];
const KOMPONEN_FIELDS = ["name", "nama", "bobot"];
const SISWA_FIELDS = ["name", "nama_lengkap", "nis"];
const ENTRI_FIELDS = ["name", "siswa", "mata_pelajaran", "semester", "tahun_ajaran", "tingkat", "nilai_akhir"];

function clampNilai(raw: string): { value: string; error: string | null } {
  const t = raw.trim();
  if (t === "") return { value: "", error: null };
  const n = Number(t);
  if (Number.isNaN(n)) return { value: t, error: "Bukan angka" };
  if (n < 0 || n > 100) return { value: t, error: "0–100" };
  return { value: t, error: null };
}

function computeNilaiAkhir(
  cells: Record<string, CellState> | undefined,
  komponen: KomponenNilai[],
): number | null {
  if (!cells) return null;
  let totalBobot = 0;
  let totalNilai = 0;
  let any = false;
  for (const k of komponen) {
    const c = cells[k.name];
    const v = c?.value.trim();
    if (!v) continue;
    const n = Number(v);
    if (Number.isNaN(n)) continue;
    const bobot = Number(k.bobot ?? 0);
    if (bobot <= 0) continue;
    totalBobot += bobot;
    totalNilai += n * bobot;
    any = true;
  }
  if (!any || totalBobot === 0) return null;
  return totalNilai / totalBobot;
}

/** Passing threshold (KKM) used to classify a student's final score. */
const KKM_DEFAULT = 75;
const PERCENT_MAX = 100;

/** Aggregated progress / mastery snapshot for the whole class. */
interface GridSummary {
  totalCells: number;
  filledCells: number;
  fillPercent: number;
  tuntas: number;
  belumTuntas: number;
  belumDinilai: number;
}

/** Count how many component cells in a row hold a valid numeric value. */
function countFilledCells(
  row: Record<string, CellState> | undefined,
  komponen: KomponenNilai[],
): number {
  if (!row) return 0;
  let filled = 0;
  for (const k of komponen) {
    const v = row[k.name]?.value.trim();
    if (v && !Number.isNaN(Number(v))) filled += 1;
  }
  return filled;
}

/**
 * Build the class summary (fill % + mastery split) from the in-memory grid.
 * Derived purely from already-loaded data — no extra network calls.
 */
function buildSummary(
  anggota: AnggotaRombel[],
  grid: GridState,
  komponen: KomponenNilai[],
): GridSummary {
  const totalCells = anggota.length * komponen.length;
  let filledCells = 0;
  let tuntas = 0;
  let belumTuntas = 0;
  let belumDinilai = 0;
  for (const a of anggota) {
    const row = grid[a.siswa];
    filledCells += countFilledCells(row, komponen);
    const akhir = computeNilaiAkhir(row, komponen);
    if (akhir == null) belumDinilai += 1;
    else if (akhir >= KKM_DEFAULT) tuntas += 1;
    else belumTuntas += 1;
  }
  const fillPercent = totalCells === 0 ? 0 : (filledCells / totalCells) * PERCENT_MAX;
  return { totalCells, filledCells, fillPercent, tuntas, belumTuntas, belumDinilai };
}

async function fetchRombelDoc(name: string): Promise<RombelDoc | null> {
  if (!name) return null;
  const rows = await listResource<RombelDoc>("Rombongan Belajar", {
    fields: [...ROMBEL_FIELDS_GET],
    filters: [["name", "=", name]],
    limit_page_length: 1,
  });
  return rows[0] ?? null;
}

async function fetchAnggota(rombelName: string): Promise<AnggotaRombel[]> {
  const rows = await listResource<AnggotaRombel>("Anggota Rombel", {
    fields: ["name", "siswa", "no_urut", "status", "parent"],
    filters: [
      ["parent", "=", rombelName],
      ["status", "=", "Aktif"],
    ],
    order_by: "`no_urut` asc",
    limit_page_length: 200,
  });
  return rows;
}

async function fetchSiswaBatch(names: string[]): Promise<Map<string, SiswaInfo>> {
  if (names.length === 0) return new Map();
  const rows = await listResource<SiswaInfo>("Siswa", {
    fields: SISWA_FIELDS,
    filters: [["name", "in", names.join(",")]],
    limit_page_length: names.length,
  });
  return new Map(rows.map((r) => [r.name, r]));
}

async function fetchEntri(selection: Selection, siswaNames: string[]): Promise<EntriNilaiDoc[]> {
  if (siswaNames.length === 0) return [];
  const rows = await listResource<EntriNilaiDoc>("Entri Nilai", {
    fields: ENTRI_FIELDS,
    filters: [
      ["mata_pelajaran", "=", selection.mapel],
      ["semester", "=", selection.semester],
      ["tahun_ajaran", "=", selection.tahunAjaran],
      ["siswa", "in", siswaNames.join(",")],
    ],
    limit_page_length: siswaNames.length,
  });
  // Fetch child komponen rows for each
  const enriched = await Promise.all(
    rows.map(async (r) => {
      const childRows = await listResource<NilaiKomponenChild>("Nilai Komponen", {
        fields: ["name", "komponen", "nilai_raw", "parent"],
        filters: [["parent", "=", r.name]],
        limit_page_length: 50,
      });
      return { ...r, komponen: childRows };
    }),
  );
  return enriched;
}

export function EntriNilaiGrid({ selection, onChangeSelection, sekolah }: Props) {
  const qc = useQueryClient();
  const [rombel, setRombel] = useState<RombelDoc | null>(null);
  const [anggota, setAnggota] = useState<AnggotaRombel[]>([]);
  const [siswaMap, setSiswaMap] = useState<Map<string, SiswaInfo>>(new Map());
  const [entri, setEntri] = useState<Map<string, EntriNilaiDoc>>(new Map());
  const [grid, setGrid] = useState<GridState>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSummary, setSaveSummary] = useState<{ ok: number; fail: number } | null>(null);
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const registerRef = useCallback((key: string, el: HTMLInputElement | null) => {
    if (el) inputRefs.current.set(key, el);
    else inputRefs.current.delete(key);
  }, []);

  const focusCell = useCallback((siswaIdx: number, komponenIdx: number) => {
    const key = `${siswaIdx}:${komponenIdx}`;
    const el = inputRefs.current.get(key);
    if (el) {
      el.focus();
      el.select();
    }
  }, []);

  const komponenQ = useResourceList<KomponenNilai>("Komponen Nilai", {
    fields: KOMPONEN_FIELDS,
    filters: [["mata_pelajaran", "=", selection.mapel]],
    order_by: "`nama` asc",
    limit_page_length: 50,
  });
  const komponenList = useMemo(() => komponenQ.data ?? [], [komponenQ.data]);
  const totalBobot = useMemo(
    () => komponenList.reduce((acc, k) => acc + Number(k.bobot ?? 0), 0),
    [komponenList],
  );

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const rDoc = await fetchRombelDoc(selection.rombel);
      setRombel(rDoc);
      const ang = await fetchAnggota(selection.rombel);
      setAnggota(ang);
      const siswaNames = ang.map((a) => a.siswa).filter(Boolean);
      const sMap = await fetchSiswaBatch(siswaNames);
      setSiswaMap(sMap);
      const ents = await fetchEntri(selection, siswaNames);
      const eMap = new Map<string, EntriNilaiDoc>();
      const initGrid: GridState = {};
      for (const e of ents) {
        eMap.set(e.siswa, e);
        const row: Record<string, CellState> = {};
        for (const c of e.komponen ?? []) {
          const v = c.nilai_raw != null ? String(c.nilai_raw) : "";
          row[c.komponen] = { value: v, baseline: v, status: "saved" };
        }
        initGrid[e.siswa] = row;
      }
      setEntri(eMap);
      setGrid(initGrid);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Gagal memuat data grid.");
    } finally {
      setLoading(false);
    }
  }, [selection]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const setCell = useCallback((siswa: string, komponen: string, value: string) => {
    const { value: clamped, error } = clampNilai(value);
    setGrid((g) => {
      const prev = g[siswa]?.[komponen];
      const baseline = prev?.baseline ?? "";
      const isClean = clamped === baseline && !error;
      return {
        ...g,
        [siswa]: {
          ...(g[siswa] ?? {}),
          [komponen]: {
            value: clamped,
            baseline,
            status: error ? "error" : isClean ? "saved" : "dirty",
            ...(error ? { error } : {}),
          },
        },
      };
    });
  }, []);

  const revertCell = useCallback((siswa: string, komponen: string) => {
    setGrid((g) => {
      const prev = g[siswa]?.[komponen];
      if (!prev) return g;
      return {
        ...g,
        [siswa]: {
          ...(g[siswa] ?? {}),
          [komponen]: { value: prev.baseline, baseline: prev.baseline, status: "saved" },
        },
      };
    });
  }, []);

  const dirtyRows = useMemo(() => {
    const out: string[] = [];
    for (const a of anggota) {
      const row = grid[a.siswa];
      if (!row) continue;
      const isDirty = Object.values(row).some((c) => c.status === "dirty");
      if (isDirty) out.push(a.siswa);
    }
    return out;
  }, [anggota, grid]);

  // Class progress / mastery snapshot for the summary panel (derived data).
  const summary = useMemo(
    () => buildSummary(anggota, grid, komponenList),
    [anggota, grid, komponenList],
  );

  const akademik = useAkademikContextOptional();
  // Lapor status edit-belum-tersimpan ke konteks Akademik agar bar bisa
  // mengonfirmasi sebelum user mengganti periode.
  useEffect(() => {
    akademik?.setDirty(dirtyRows.length > 0);
    return () => akademik?.setDirty(false);
  }, [dirtyRows.length, akademik]);

  const saveAll = useCallback(async () => {
    if (dirtyRows.length === 0) return;
    setSaving(true);
    setSaveSummary(null);
    let ok = 0;
    let fail = 0;
    const tingkat = rombel?.tingkat != null ? String(rombel.tingkat) : undefined;
    const nextGrid: GridState = { ...grid };
    const nextEntri = new Map(entri);

    for (const siswa of dirtyRows) {
      const row = grid[siswa];
      if (!row) continue;
      const komponenPayload: Array<{ komponen: string; nilai_raw: number | null }> = [];
      for (const k of komponenList) {
        const c = row[k.name];
        if (!c) continue;
        const v = c.value.trim();
        const num = v === "" ? null : Number(v);
        if (v !== "" && Number.isNaN(num as number)) continue;
        komponenPayload.push({ komponen: k.name, nilai_raw: num });
      }

      const existing = entri.get(siswa);
      const body: Record<string, unknown> = {
        siswa,
        mata_pelajaran: selection.mapel,
        semester: selection.semester,
        tahun_ajaran: selection.tahunAjaran,
        komponen: komponenPayload,
      };
      if (tingkat) body.tingkat = tingkat;

      // Mark row cells as saving
      const updatedRow: Record<string, CellState> = { ...row };
      for (const k of komponenList) {
        const c = updatedRow[k.name];
        if (c && c.status === "dirty") updatedRow[k.name] = { ...c, status: "saving" };
      }
      nextGrid[siswa] = updatedRow;
      setGrid({ ...nextGrid });

      try {
        let saved: EntriNilaiDoc;
        if (existing) {
          saved = await updateResource<EntriNilaiDoc>("Entri Nilai", existing.name, body);
        } else {
          saved = await createResource<EntriNilaiDoc>("Entri Nilai", body);
        }
        nextEntri.set(siswa, saved);
        const savedRow: Record<string, CellState> = { ...updatedRow };
        for (const k of komponenList) {
          const c = savedRow[k.name];
          if (!c) continue;
          if (c.status === "error") {
            savedRow[k.name] = { ...c };
          } else {
            savedRow[k.name] = { value: c.value, baseline: c.value, status: "saved" };
          }
        }
        nextGrid[siswa] = savedRow;
        setGrid({ ...nextGrid });
        ok += 1;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Gagal menyimpan";
        const erroredRow: Record<string, CellState> = { ...updatedRow };
        for (const k of komponenList) {
          const c = erroredRow[k.name];
          if (c && c.status === "saving") erroredRow[k.name] = { ...c, status: "error", error: msg };
        }
        nextGrid[siswa] = erroredRow;
        setGrid({ ...nextGrid });
        fail += 1;
      }
    }
    setEntri(nextEntri);
    setSaving(false);
    setSaveSummary({ ok, fail });
    await qc.invalidateQueries({ queryKey: ["resource:list", "Entri Nilai"] });
  }, [dirtyRows, grid, entri, komponenList, rombel?.tingkat, selection, qc]);

  if (loading) {
    return <div className="py-12 text-center text-sm text-muted-fg">Memuat grid…</div>;
  }
  if (loadError) {
    return (
      <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
        {loadError}
        <Button variant="outline" className="ml-3" onClick={reload}>
          Coba lagi
        </Button>
      </div>
    );
  }

  const bobotOk = Math.abs(totalBobot - 100) < 0.001;

  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[
          {
            label: "Akademik",
            render: ({ className, children }) => (
              <Link to={sekolah ? "/sch/$sekolah/akademik" : "/akademik" as "/sch/$sekolah/akademik"} params={{ sekolah: sekolah ?? "" }} className={className}>
                {children}
              </Link>
            ),
          },
          {
            label: "Entri Nilai",
            render: ({ className, children }) => (
              <Link to={sekolah ? "/sch/$sekolah/akademik/entri-nilai" : "/akademik/entri-nilai" as "/sch/$sekolah/akademik/entri-nilai"} params={{ sekolah: sekolah ?? "" }} className={className}>
                {children}
              </Link>
            ),
          },
          { label: "Editor" },
        ]}
      />
      <PageHeader
        eyebrow="Akademik · Entri Nilai"
        title="Editor Nilai"
        description={`${rombel?.nama_rombel ?? selection.rombel} · ${selection.mapel} · ${selection.semester} · ${selection.tahunAjaran}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={onChangeSelection}>
              {/* Size class lives on the icon itself so the SVG is always
                  bounded (base icon defaults to width/height 100%). */}
              <IconArrowLeft className="h-4 w-4 shrink-0 mr-1.5" />
              Ubah Konteks
            </Button>
            <Button onClick={saveAll} disabled={saving || dirtyRows.length === 0}>
              {saving ? "Menyimpan…" : `Simpan${dirtyRows.length ? ` (${dirtyRows.length} baris)` : ""}`}
            </Button>
          </div>
        }
      />

      {!bobotOk && komponenList.length > 0 ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Total bobot komponen mapel ini <strong>{totalBobot.toFixed(1)}%</strong> (idealnya 100%). Nilai
          akhir tertimbang tetap dihitung secara proporsional terhadap total bobot, namun raport akan menandai
          konfigurasi tidak konsisten.
        </div>
      ) : null}
      {saveSummary ? (
        <div
          className={`rounded-md border px-3 py-2 text-xs ${
            saveSummary.fail === 0
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          Simpan selesai: {saveSummary.ok} baris berhasil, {saveSummary.fail} gagal
          {akademik?.tahunAjaran ? ` · ${akademik.tahunAjaran} ${akademik.semester}` : ""}.
        </div>
      ) : null}

      {komponenList.length > 0 && anggota.length > 0 ? (
        <ClassSummaryPanel summary={summary} />
      ) : null}

      <SectionCard
        title={`${anggota.length} siswa × ${komponenList.length} komponen`}
        description="Isi nilai 0–100 per sel. Klik Simpan untuk menyimpan baris yang berubah."
        padded={false}
      >
        {komponenList.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-fg">
            Mata pelajaran ini belum memiliki Komponen Nilai. Tambahkan komponen di menu{" "}
            <Link to={sekolah ? "/sch/$sekolah/master/komponen-nilai" : "/master/komponen-nilai" as "/sch/$sekolah/master/komponen-nilai"} params={{ sekolah: sekolah ?? "" }} className="text-brand hover:underline">
              Komponen Nilai
            </Link>{" "}
            terlebih dahulu.
          </div>
        ) : anggota.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-fg">
            Rombel ini belum punya anggota aktif.
          </div>
        ) : (
          <div className="overflow-auto max-h-[70vh]">
            <table className="min-w-full border-separate border-spacing-0 text-sm">
              <thead className="sticky top-0 z-20 bg-muted">
                <tr>
                  <th className="sticky left-0 z-30 bg-muted px-3 py-2 text-left text-xs uppercase tracking-wider text-muted-fg border-b border-border min-w-[14rem]">
                    Siswa
                  </th>
                  {komponenList.map((k) => (
                    <th
                      key={k.name}
                      className="px-3 py-2 text-left text-xs uppercase tracking-wider text-muted-fg border-b border-border whitespace-nowrap"
                    >
                      <div>{k.nama}</div>
                      <div className="text-[10px] text-muted-fg/80 font-normal">Bobot {k.bobot ?? 0}%</div>
                    </th>
                  ))}
                  <th className="px-3 py-2 text-right text-xs uppercase tracking-wider text-muted-fg border-b border-border whitespace-nowrap">
                    Nilai Akhir
                  </th>
                </tr>
              </thead>
              <tbody>
                {anggota.map((a, idx) => {
                  const info = siswaMap.get(a.siswa);
                  const row = grid[a.siswa];
                  const akhir = computeNilaiAkhir(row, komponenList);
                  return (
                    <tr key={a.siswa ?? `row-${idx}`} className="hover:bg-muted/40">
                      <td className="sticky left-0 z-10 bg-bg px-3 py-1.5 border-b border-border min-w-[14rem]">
                        <div className="font-medium text-fg truncate">
                          {info?.nama_lengkap ?? a.siswa}
                        </div>
                        <div className="text-[11px] text-muted-fg font-mono truncate">
                          {info?.nis ?? a.siswa}
                        </div>
                      </td>
                      {komponenList.map((k, kIdx) => {
                        const cell = row?.[k.name];
                        const key = `${idx}:${kIdx}`;
                        const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const next = e.shiftKey ? idx - 1 : idx + 1;
                            if (next >= 0 && next < anggota.length) focusCell(next, kIdx);
                          } else if (e.key === "Tab") {
                            const dir = e.shiftKey ? -1 : 1;
                            const nextK = kIdx + dir;
                            if (nextK >= 0 && nextK < komponenList.length) {
                              e.preventDefault();
                              focusCell(idx, nextK);
                            } else if (!e.shiftKey && idx + 1 < anggota.length) {
                              e.preventDefault();
                              focusCell(idx + 1, 0);
                            } else if (e.shiftKey && idx > 0) {
                              e.preventDefault();
                              focusCell(idx - 1, komponenList.length - 1);
                            }
                          } else if (e.key === "Escape") {
                            e.preventDefault();
                            revertCell(a.siswa, k.name);
                          } else if (e.key === "ArrowDown" && e.altKey) {
                            e.preventDefault();
                            if (idx + 1 < anggota.length) focusCell(idx + 1, kIdx);
                          } else if (e.key === "ArrowUp" && e.altKey) {
                            e.preventDefault();
                            if (idx > 0) focusCell(idx - 1, kIdx);
                          }
                        };
                        return (
                          <td key={k.name} className="px-2 py-1.5 border-b border-border">
                            <NilaiInput
                              refKey={key}
                              registerRef={registerRef}
                              value={cell?.value ?? ""}
                              status={cell?.status ?? "idle"}
                              {...(cell?.error ? { error: cell.error } : {})}
                              onChange={(v) => setCell(a.siswa, k.name, v)}
                              onKeyDown={onKey}
                            />
                          </td>
                        );
                      })}
                      <td className="px-3 py-1.5 text-right border-b border-border tabular-nums">
                        {akhir != null ? (
                          <Badge tone={akhir >= 75 ? "success" : akhir >= 60 ? "warning" : "danger"}>
                            {akhir.toFixed(2)}
                          </Badge>
                        ) : (
                          <span className="text-muted-fg">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

/**
 * Class summary panel: a fill-progress ring plus a mastery distribution bar.
 * Helps Kepala Sekolah / Administrator gauge entry progress at a glance.
 */
function ClassSummaryPanel({ summary }: { summary: GridSummary }) {
  const segments: DistributionSegment[] = [
    { label: "Tuntas", value: summary.tuntas, tone: "emerald" },
    { label: "Belum tuntas", value: summary.belumTuntas, tone: "rose" },
    { label: "Belum dinilai", value: summary.belumDinilai, tone: "neutral" },
  ];
  const fillTone = summary.fillPercent >= PERCENT_MAX ? "emerald" : "brand";
  return (
    <SectionCard
      title="Ringkasan kelas"
      description={`Progres pengisian & ketuntasan terhadap KKM ${KKM_DEFAULT}, dihitung dari nilai akhir berbobot tiap siswa.`}
    >
      <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="flex flex-col items-center gap-1">
          <ProgressRing value={summary.fillPercent} tone={fillTone} label="Sel terisi" />
          <span className="text-xs text-muted-fg tabular-nums">
            {summary.filledCells} / {summary.totalCells} sel
          </span>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-fg">
            {/* Size class on the icon, not the wrapper: an unconstrained SVG
                (base width/height 100%) would balloon to fill the flex row. */}
            <IconChart className="h-4 w-4 shrink-0 text-muted-fg" />
            Sebaran ketuntasan siswa
          </div>
          <DistributionBar segments={segments} />
        </div>
      </div>
    </SectionCard>
  );
}

interface InputProps {
  refKey: string;
  registerRef: (key: string, el: HTMLInputElement | null) => void;
  value: string;
  status: CellStatus;
  error?: string;
  onChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

function NilaiInput({ refKey, registerRef, value, status, error, onChange, onKeyDown }: InputProps) {
  const ring =
    status === "saving"
      ? "ring-2 ring-sky-400"
      : status === "dirty"
        ? "ring-2 ring-amber-400"
        : status === "saved"
          ? "ring-1 ring-border"
          : status === "error"
            ? "ring-2 ring-rose-500"
            : "ring-1 ring-border";
  return (
    <div className="flex flex-col">
      <input
        ref={(el) => registerRef(refKey, el)}
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        className={`w-20 rounded bg-bg px-2 py-1 text-sm text-fg tabular-nums focus:outline-none focus:ring-2 focus:ring-brand ${ring}`}
        placeholder="—"
        title={error ?? undefined}
      />
      {error ? <span className="mt-0.5 text-[10px] text-rose-600">{error}</span> : null}
    </div>
  );
}
