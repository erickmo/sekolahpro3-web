/**
 * Gelombang PPDB — manajemen batch berbasis kartu visual.
 *
 * Tiap batch tampil sebagai kartu: GaugeArc kuota (terisi/kuota), mini
 * FunnelChart komposisi status pendaftar, dan timeline tanggal_buka..tutup.
 * Aksi inline: Aktifkan / Tutup. Tombol "Buat Gelombang" buka form create cepat.
 * PageGuide menjelaskan alur per peran (staff vs manajer).
 *
 * Data hooks dipertahankan dari versi tabel: useResourceList "Gelombang PPDB"
 * (daftar batch) + useResourceList "Pendaftaran PPDB" (agregat kuota & status),
 * useResourceUpdate (ubah status), useResourceCreate (form buat batch).
 */

import { useMemo, useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  Button,
  FilterBar,
  PageHeader,
  Pagination,
  SectionCard,
  IconPlus,
} from "@sekolahpro/ui";
import { useResourceList, useResourceUpdate } from "@sekolahpro/api-client";
import { PageGuide } from "../components/guide/PageGuide";
import {
  GelombangBatchCard,
  type BatchStatusRow,
  type GelombangRow,
} from "../components/ppdb/gelombangPanel";
import { GelombangCreateModal } from "../components/ppdb/gelombangCreateModal";

const STATUS_OPTIONS = ["Semua", "Draft", "Aktif", "Tutup"];
const PAGE_SIZE = 12;
const PENDAFTARAN_DOCTYPE = "Pendaftaran PPDB";
const GELOMBANG_DOCTYPE = "Gelombang PPDB";
const GUIDE_STORAGE_ID = "ppdb-gelombang";

const GELOMBANG_FIELDS = [
  "name", "nama", "tingkat", "status", "tahun_ajaran", "sekolah",
  "tanggal_buka", "tanggal_tutup", "biaya_pendaftaran", "kuota",
];

/** Baris Pendaftaran PPDB untuk agregasi kuota + komposisi status per batch. */
type PendaftaranRow = { name: string; gelombang_ppdb?: string; status?: string };

/** Agregasi pendaftaran: jumlah terisi + baris status, dikelompokkan per batch. */
interface BatchAggregate {
  terisi: Record<string, number>;
  statusRows: Record<string, BatchStatusRow[]>;
}

/** Kelompokkan pendaftaran per gelombang → count + daftar status (1 pass). */
function aggregateByGelombang(rows: PendaftaranRow[]): BatchAggregate {
  const terisi: Record<string, number> = {};
  const statusRows: Record<string, BatchStatusRow[]> = {};
  for (const p of rows) {
    const key = p.gelombang_ppdb;
    if (!key) continue;
    terisi[key] = (terisi[key] ?? 0) + 1;
    (statusRows[key] ??= []).push({ status: p.status ?? "" });
  }
  return { terisi, statusRows };
}

/** Langkah panduan halaman gelombang (Bahasa Indonesia, per peran). */
const GUIDE_STEPS = [
  {
    title: "Buat gelombang baru",
    detail: "Tetapkan nama, tahun ajaran, periode buka–tutup, kuota, dan biaya.",
  },
  {
    title: "Pantau kuota tiap batch",
    detail: "Gauge menunjukkan pendaftar terisi dibanding kuota yang ditetapkan.",
  },
  {
    title: "Aktifkan atau tutup",
    detail: "Hanya gelombang Aktif yang menerima pendaftaran baru dari calon siswa.",
  },
];

const GUIDE_TIPS = [
  "Tutup gelombang lama sebelum mengaktifkan gelombang berikutnya agar kuota tidak tumpang tindih.",
  "Komposisi status membantu melihat berapa pendaftar yang sudah lolos seleksi per batch.",
];

function GelombangPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Semua");
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const update = useResourceUpdate(GELOMBANG_DOCTYPE);

  const params = useMemo(() => {
    const filters: Array<[string, string, unknown]> = [];
    if (status !== "Semua") filters.push(["status", "=", status]);
    if (search.trim()) filters.push(["nama", "like", `%${search.trim()}%`]);
    return {
      fields: GELOMBANG_FIELDS,
      ...(filters.length ? { filters } : {}),
      order_by: "`tanggal_buka` desc",
      limit_start: (page - 1) * PAGE_SIZE,
      limit_page_length: PAGE_SIZE + 1,
    };
  }, [status, search, page]);

  const q = useResourceList<GelombangRow>(GELOMBANG_DOCTYPE, params);
  const fetched = q.data ?? [];
  const hasNext = fetched.length > PAGE_SIZE;
  const rows = hasNext ? fetched.slice(0, PAGE_SIZE) : fetched;

  // 1 query agregat untuk kuota meter + komposisi status semua batch di halaman.
  const pendaftaranQ = useResourceList<PendaftaranRow>(
    PENDAFTARAN_DOCTYPE,
    {
      fields: ["name", "gelombang_ppdb", "status"],
      ...(rows.length
        ? { filters: [["gelombang_ppdb", "in", rows.map((r) => r.name)]] as [string, string, unknown][] }
        : {}),
      limit_page_length: 0,
    },
    { enabled: rows.length > 0 },
  );

  const agg = useMemo(
    () => aggregateByGelombang(pendaftaranQ.data ?? []),
    [pendaftaranQ.data],
  );

  /** Ubah status satu batch lalu refresh daftar (feedback inline). */
  const onToggleStatus = async (r: GelombangRow, next: "Aktif" | "Tutup") => {
    setFeedback(null);
    try {
      await update.mutateAsync({ name: r.name, patch: { status: next } });
      setFeedback(`${r.nama ?? r.name} → ${next}.`);
      q.refetch();
    } catch (e) {
      setFeedback((e as Error)?.message ?? "Gagal ubah status.");
    }
  };

  const isEmpty = rows.length === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="PPDB"
        title="Gelombang PPDB"
        description="Atur periode pendaftaran, kuota, dan biaya per gelombang."
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <span className="mr-1.5 h-4 w-4"><IconPlus /></span>
            Buat Gelombang
          </Button>
        }
      />

      <PageGuide
        storageId={GUIDE_STORAGE_ID}
        intro="Gelombang adalah periode pendaftaran dengan kuota & biaya tersendiri."
        steps={GUIDE_STEPS}
        tips={GUIDE_TIPS}
      />

      <SectionCard padded={false}>
        <div className="p-3">
          <FilterBar
            search={{
              value: search,
              onChange: (v) => { setSearch(v); setPage(1); },
              placeholder: "Cari nama gelombang...",
            }}
            filters={[
              {
                key: "status",
                label: "Status",
                value: status,
                options: STATUS_OPTIONS.map((v) => ({ value: v, label: v })),
                onChange: (v) => { setStatus(v); setPage(1); },
              },
            ]}
          />
        </div>
        {feedback && (
          <div className="border-t border-border bg-emerald-50 px-4 py-2 text-xs text-emerald-800">
            {feedback}
          </div>
        )}
      </SectionCard>

      {isEmpty ? (
        <SectionCard className="text-center text-sm text-muted-fg">
          {q.isLoading ? "Memuat..." : q.isError ? "Gagal memuat gelombang." : "Belum ada gelombang."}
        </SectionCard>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((r) => (
            <GelombangBatchCard
              key={r.name}
              gelombang={r}
              terisi={agg.terisi[r.name] ?? 0}
              statusRows={agg.statusRows[r.name] ?? []}
              busy={update.isPending}
              onToggleStatus={(next) => onToggleStatus(r, next)}
            />
          ))}
        </div>
      )}

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        total={(page - 1) * PAGE_SIZE + rows.length + (hasNext ? 1 : 0)}
        onPageChange={setPage}
      />

      <p className="text-xs text-muted-fg">
        Butuh mengubah biaya atau formulir?{" "}
        <Link to="/sch/$sekolah/ppdb/pengaturan" params={{ sekolah }} className="text-brand hover:underline">
          Buka Pengaturan PPDB
        </Link>
        .
      </p>

      <GelombangCreateModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => q.refetch()}
      />
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/ppdb/gelombang")({ component: GelombangPage });
