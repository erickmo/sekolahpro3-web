import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Badge,
  Breadcrumb,
  Button,
  PageHeader,
  SectionCard,
  StatCard,
  IconArrowLeft,
  IconCheck,
  IconChart,
  IconEdit,
} from "@sekolahpro/ui";
import { getResource, listResource, updateResource } from "@sekolahpro/api-client";

interface NilaiRow {
  siswa: string;
  nilai?: number | null;
  catatan?: string;
}

// Payload baris nilai yang dikirim ke server (nilai sudah pasti angka valid).
interface PayloadRow {
  siswa: string;
  nilai: number;
}

interface AsesmenDoc {
  name: string;
  judul: string;
  mata_pelajaran: string;
  komponen: string;
  rombel: string;
  semester: string;
  tahun_ajaran: string;
  nilai?: NilaiRow[];
}

interface AnggotaRow {
  siswa: string;
  no_urut?: number;
}
interface SiswaInfo {
  name: string;
  nama_lengkap?: string;
  nis?: string;
}

type RowStatus = "idle" | "dirty" | "saving" | "saved" | "error";

interface SiswaCell {
  siswa: string;
  nama: string;
  nis?: string;
  value: string;
  baseline: string;
  status: RowStatus;
  error?: string;
}

const ANGGOTA_FIELDS = ["name", "siswa", "no_urut", "status", "parent"];
const SISWA_FIELDS = ["name", "nama_lengkap", "nis"];

function clampNilai(raw: string): { ok: boolean; error: string | null } {
  const t = raw.trim();
  if (t === "") return { ok: true, error: null };
  const n = Number(t);
  if (Number.isNaN(n)) return { ok: false, error: "Bukan angka" };
  if (n < 0 || n > 100) return { ok: false, error: "0–100" };
  return { ok: true, error: null };
}

async function loadAnggota(rombel: string): Promise<AnggotaRow[]> {
  return listResource<AnggotaRow>("Anggota Rombel", {
    fields: ANGGOTA_FIELDS,
    filters: [
      ["parent", "=", rombel],
      ["status", "=", "Aktif"],
    ],
    order_by: "`no_urut` asc",
    limit_page_length: 200,
  });
}

async function loadSiswa(names: string[]): Promise<Map<string, SiswaInfo>> {
  if (names.length === 0) return new Map();
  const rows = await listResource<SiswaInfo>("Siswa", {
    fields: SISWA_FIELDS,
    filters: [["name", "in", names.join(",")]],
    limit_page_length: names.length,
  });
  return new Map(rows.map((r) => [r.name, r]));
}

export function AsesmenInput({ asesmenId, sekolah }: { asesmenId: string; sekolah?: string }) {
  const qc = useQueryClient();
  const [doc, setDoc] = useState<AsesmenDoc | null>(null);
  const [cells, setCells] = useState<SiswaCell[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const inputRefs = useRef<Map<number, HTMLInputElement>>(new Map());

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const d = await getResource<AsesmenDoc>("Asesmen", asesmenId);
      setDoc(d);
      const anggota = await loadAnggota(d.rombel);
      const siswaMap = await loadSiswa(anggota.map((a) => a.siswa).filter(Boolean));
      const nilaiBySiswa = new Map<string, NilaiRow>(
        (d.nilai ?? []).map((r) => [r.siswa, r]),
      );
      const next: SiswaCell[] = anggota.map((a) => {
        const existing = nilaiBySiswa.get(a.siswa);
        const v = existing?.nilai != null ? String(existing.nilai) : "";
        const info = siswaMap.get(a.siswa);
        return {
          siswa: a.siswa,
          nama: info?.nama_lengkap ?? a.siswa,
          ...(info?.nis ? { nis: info.nis } : {}),
          value: v,
          baseline: v,
          status: "saved",
        };
      });
      setCells(next);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Gagal memuat asesmen.");
    } finally {
      setLoading(false);
    }
  }, [asesmenId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const setValue = useCallback((idx: number, value: string) => {
    setCells((prev) => {
      const next = [...prev];
      const c = next[idx];
      if (!c) return prev;
      const { error } = clampNilai(value);
      const isClean = value.trim() === c.baseline.trim() && !error;
      const updated: SiswaCell = {
        siswa: c.siswa,
        nama: c.nama,
        value,
        baseline: c.baseline,
        status: error ? "error" : isClean ? "saved" : "dirty",
        ...(c.nis ? { nis: c.nis } : {}),
        ...(error ? { error } : {}),
      };
      next[idx] = updated;
      return next;
    });
  }, []);

  // Autosave on-blur: kirim seluruh array nilai (Frappe ganti child rows).
  const saveCell = useCallback(
    async (idx: number) => {
      const target = cells[idx];
      if (!target || target.status !== "dirty") return;
      setCells((prev) => {
        const next = [...prev];
        if (next[idx]) next[idx] = { ...next[idx], status: "saving" };
        return next;
      });
      const payloadNilai: PayloadRow[] = cells
        .map((c): PayloadRow | null => {
          const t = c.value.trim();
          if (t === "") return null;
          const n = Number(t);
          if (Number.isNaN(n) || n < 0 || n > 100) return null;
          return { siswa: c.siswa, nilai: n };
        })
        .filter((r): r is PayloadRow => r !== null);
      try {
        await updateResource("Asesmen", asesmenId, { nilai: payloadNilai });
        setCells((prev) => {
          const next = [...prev];
          const c = next[idx];
          if (c) next[idx] = { ...c, baseline: c.value, status: "saved" };
          return next;
        });
        await qc.invalidateQueries({ queryKey: ["resource:list", "Asesmen"] });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Gagal menyimpan";
        setCells((prev) => {
          const next = [...prev];
          const c = next[idx];
          if (c) next[idx] = { ...c, status: "error", error: msg };
          return next;
        });
      }
    },
    [cells, asesmenId, qc],
  );

  const focusRow = useCallback((idx: number) => {
    const el = inputRefs.current.get(idx);
    if (el) {
      el.focus();
      el.select();
    }
  }, []);

  const summary = useMemo(() => {
    const vals = cells
      .map((c) => Number(c.value.trim()))
      .filter((n) => !Number.isNaN(n) && c2(n));
    const filled = cells.filter((c) => c.value.trim() !== "").length;
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    const max = vals.length ? Math.max(...vals) : null;
    return { filled, total: cells.length, avg, max };
  }, [cells]);

  if (loading) {
    return <div className="py-12 text-center text-sm text-muted-fg">Memuat asesmen…</div>;
  }
  if (loadError || !doc) {
    return (
      <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
        {loadError ?? "Asesmen tidak ditemukan."}
        <Button variant="outline" className="ml-3" onClick={reload}>
          Coba lagi
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[
          {
            label: "Akademik",
            render: ({ className, children }) => (
              <Link to="/sch/$sekolah/akademik" params={{ sekolah: sekolah ?? "" }} className={className}>
                {children}
              </Link>
            ),
          },
          {
            label: "Input Nilai Test",
            render: ({ className, children }) => (
              <Link to="/sch/$sekolah/akademik/asesmen" params={{ sekolah: sekolah ?? "" }} className={className}>
                {children}
              </Link>
            ),
          },
          { label: doc.judul },
        ]}
      />
      <PageHeader
        eyebrow="Akademik · Input Nilai Test"
        title={doc.judul}
        description={`${doc.mata_pelajaran} · ${doc.komponen} · ${doc.semester} · ${doc.tahun_ajaran}`}
        actions={
          <Link
            to="/sch/$sekolah/akademik/asesmen"
            params={{ sekolah: sekolah ?? "" }}
            className="inline-flex items-center justify-center rounded-md border border-border h-10 px-4 text-sm font-medium hover:bg-muted"
          >
            <span className="h-4 w-4 mr-1.5"><IconArrowLeft /></span>
            Kembali
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Terisi" value={`${summary.filled}/${summary.total}`} hint="siswa dinilai" icon={<IconEdit />} accent="brand" urgency="normal" />
        <StatCard label="Rata-rata" value={summary.avg != null ? summary.avg.toFixed(1) : "—"} hint="nilai kelas" icon={<IconChart />} accent="violet" urgency="normal" />
        <StatCard label="Tertinggi" value={summary.max != null ? String(summary.max) : "—"} hint="nilai puncak" icon={<IconCheck />} accent="emerald" urgency="normal" />
      </div>

      <SectionCard
        title={`${cells.length} siswa`}
        description="Isi nilai 0–100 per siswa. Enter pindah ke bawah; tersimpan otomatis saat keluar dari kolom."
        padded={false}
      >
        {cells.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-fg">Rombel ini belum punya anggota aktif.</div>
        ) : (
          <ul className="divide-y divide-border">
            {cells.map((c, idx) => (
              <li key={c.siswa} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="min-w-0 flex items-center gap-3">
                  <span className="text-xs text-muted-fg tabular-nums w-6 text-right">{idx + 1}</span>
                  <div className="min-w-0">
                    <div className="font-medium text-fg truncate">{c.nama}</div>
                    {c.nis ? <div className="text-xs text-muted-fg font-mono">{c.nis}</div> : null}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {c.status === "saving" ? <span className="text-xs text-muted-fg">menyimpan…</span> : null}
                  {c.status === "saved" && c.baseline.trim() !== "" ? <span className="text-emerald-600"><span className="h-4 w-4 inline-block"><IconCheck /></span></span> : null}
                  {c.status === "error" ? <Badge tone="danger">{c.error ?? "error"}</Badge> : null}
                  <input
                    ref={(el) => {
                      if (el) inputRefs.current.set(idx, el);
                      else inputRefs.current.delete(idx);
                    }}
                    type="number"
                    min={0}
                    max={100}
                    inputMode="numeric"
                    value={c.value}
                    onChange={(e) => setValue(idx, e.target.value)}
                    onBlur={() => void saveCell(idx)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void saveCell(idx);
                        focusRow(idx + 1);
                      }
                    }}
                    className={`w-20 rounded-md border bg-bg px-2 py-1.5 text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-brand/40 ${
                      c.status === "error" ? "border-rose-400" : "border-border"
                    }`}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}

// Guard 0..100 helper for summary aggregation.
function c2(n: number): boolean {
  return n >= 0 && n <= 100;
}
