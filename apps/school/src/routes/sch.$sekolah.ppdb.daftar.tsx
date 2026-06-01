/**
 * Pendaftaran PPDB list — enriched table (NO Kanban), bulk-action capable.
 *
 * Preserves: multi-select, bulk Ajukan/Verifikasi (whitelisted endpoints), and
 * the "Tambah Pendaftar" wizard. Adds the status-distribution strip, an in-page
 * PageGuide + EmptyState, and the doc-completeness ring + payment-health dot
 * columns. Those enrichment columns read LIVE Dokumen/Pembayaran PPDB (keyed by
 * pendaftaran_ppdb = row.name) and fall back per-row to the mock fixture matched
 * by candidate name — see components/ppdb/pendaftaranPanel.tsx.
 */

import { useMemo, useState } from "react";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import {
  Button,
  DataTable,
  EmptyState,
  FilterBar,
  PageHeader,
  Pagination,
  SectionCard,
  IconPlus,
  type SortState,
} from "@sekolahpro/ui";
import { useResourceList, type ListParams } from "@sekolahpro/api-client";
import {
  useAjukanPendaftaran,
  useVerifikasiPendaftaran,
  type VerifikasiStatus,
} from "../lib/ppdbApi";
import { listPpdbForSekolah } from "../data/ppdb";
import { PageGuide } from "../components/guide/PageGuide";
import {
  docCompletenessByPendaftaran,
  useDokumenLive,
  usePembayaranLive,
} from "../lib/ppdbLive";
import {
  buildEnrichedColumns,
  indexByName,
  paymentHealthByPendaftaranLive,
  BulkActionBar,
  StatusDistributionStrip,
  BulkVerifikasiModal,
  PENDAFTARAN_GUIDE,
  type PendaftaranRow,
} from "../components/ppdb/pendaftaranPanel";
import { PendaftaranWizard } from "../components/ppdb/pendaftaranWizard";

const STATUS_OPTIONS = [
  "Semua",
  "Draft",
  "Diajukan",
  "Diverifikasi",
  "Seleksi",
  "Diterima",
  "Ditolak",
  "Selesai",
  "Mengundurkan Diri",
];

const PAGE_SIZE = 25;
const DRAFT_STATUS = "Draft";
const LIST_FIELDS = ["name", "status", "gelombang_ppdb", "calon_siswa", "tanggal_daftar"];

/** Pendaftaran PPDB list page — enriched table with bulk actions. */
export function PpdbDaftarPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [sort, setSort] = useState<SortState>({ key: "tanggal_daftar", dir: "desc" });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showWizard, setShowWizard] = useState(false);
  const [showBulkVerifikasi, setShowBulkVerifikasi] = useState(false);
  const [bulkTarget, setBulkTarget] = useState<VerifikasiStatus>("Diverifikasi");
  const [feedback, setFeedback] = useState<string | null>(null);

  const ajukan = useAjukanPendaftaran();
  const verifikasi = useVerifikasiPendaftaran();

  // Live enrichment source (GAP 4): doc completeness + payment health keyed by
  // pendaftaran_ppdb = row.name. Falls back to the mock fixture per-row.
  const dokumenLive = useDokumenLive();
  const pembayaranLive = usePembayaranLive();
  const live = useMemo(
    () => ({
      docByPendaftaran: docCompletenessByPendaftaran(dokumenLive.data ?? []),
      paymentByPendaftaran: paymentHealthByPendaftaranLive(pembayaranLive.data ?? []),
    }),
    [dokumenLive.data, pembayaranLive.data],
  );

  // Name → mock Pendaftar lookup: the per-row fallback when live has no entry.
  const byName = useMemo(() => indexByName(listPpdbForSekolah(sekolah)), [sekolah]);
  const columns = useMemo(
    () => buildEnrichedColumns(sekolah, byName, live),
    [sekolah, byName, live],
  );

  const params: ListParams = useMemo(() => {
    const filters: Array<[string, string, unknown]> = [];
    if (statusFilter !== "Semua") filters.push(["status", "=", statusFilter]);
    if (search.trim()) filters.push(["name", "like", `%${search.trim()}%`]);
    const p: ListParams = {
      fields: LIST_FIELDS,
      order_by: `\`${sort.key}\` ${sort.dir}`,
      limit_start: (page - 1) * PAGE_SIZE,
      limit_page_length: PAGE_SIZE + 1,
    };
    if (filters.length) p.filters = filters;
    return p;
  }, [statusFilter, search, sort, page]);

  const q = useResourceList<PendaftaranRow>("Pendaftaran PPDB", params);
  const fetched = q.data ?? [];
  const hasNext = fetched.length > PAGE_SIZE;
  const rows = hasNext ? fetched.slice(0, PAGE_SIZE) : fetched;

  const toggleRow = (key: string) => {
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  const toggleAll = () => {
    setSelected((cur) => {
      if (rows.every((r) => cur.has(r.name))) return new Set();
      return new Set(rows.map((r) => r.name));
    });
  };

  const selectedRows = useMemo(() => rows.filter((r) => selected.has(r.name)), [rows, selected]);
  // Ajukan only valid for Draft rows — guard so the backend never rejects a batch.
  const canBulkAjukan = selectedRows.length > 0 && selectedRows.every((r) => r.status === DRAFT_STATUS);

  /** Run `op` over each selected row, tallying successes vs failures. */
  const runBulk = async (op: (name: string) => Promise<unknown>) => {
    let ok = 0, err = 0;
    // Sequential so one mutation's failure never aborts the rest of the batch.
    for (const r of selectedRows) {
      try { await op(r.name); ok++; } catch { err++; }
    }
    setSelected(new Set());
    return { ok, err };
  };

  /** Run bulk Ajukan over the selected Draft rows and report a tally. */
  const onBulkAjukan = async () => {
    setFeedback(null);
    const { ok, err } = await runBulk((name) => ajukan.mutateAsync({ pendaftaran_ppdb: name }));
    setFeedback(`Ajukan: ${ok} berhasil, ${err} gagal.`);
  };

  /** Run bulk Verifikasi to the chosen target status and report a tally. */
  const onBulkVerifikasi = async () => {
    setFeedback(null);
    const { ok, err } = await runBulk((name) =>
      verifikasi.mutateAsync({ pendaftaran_ppdb: name, status: bulkTarget }),
    );
    setShowBulkVerifikasi(false);
    setFeedback(`Verifikasi → ${bulkTarget}: ${ok} berhasil, ${err} gagal.`);
  };

  // Friendly empty state only when the query succeeded with zero rows.
  const showEmpty = !q.isLoading && !q.isError && rows.length === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Penerimaan"
        title="Pendaftaran PPDB"
        description="Kelola pendaftaran calon siswa: ajukan, verifikasi, dan lacak status."
        actions={
          <Button onClick={() => setShowWizard(true)}>
            <span className="h-4 w-4 mr-1.5"><IconPlus /></span>
            Tambah Pendaftar
          </Button>
        }
      />

      <PageGuide
        storageId="ppdb-pendaftaran"
        intro={PENDAFTARAN_GUIDE.intro}
        steps={[...PENDAFTARAN_GUIDE.steps]}
        tips={[...PENDAFTARAN_GUIDE.tips]}
      />

      <SectionCard padded={false}>
        <div className="p-3">
          <FilterBar
            search={{
              value: search,
              onChange: (v) => {
                setSearch(v);
                setPage(1);
              },
              placeholder: "Cari nomor pendaftaran atau calon...",
            }}
            filters={[
              {
                key: "status",
                label: "Status",
                value: statusFilter,
                options: STATUS_OPTIONS.map((v) => ({ value: v, label: v })),
                onChange: (v) => {
                  setStatusFilter(v);
                  setPage(1);
                },
              },
            ]}
          />
        </div>

        <StatusDistributionStrip rows={rows} />

        {selected.size > 0 && (
          <BulkActionBar
            count={selected.size}
            canAjukan={canBulkAjukan}
            ajukanPending={ajukan.isPending}
            verifikasiPending={verifikasi.isPending}
            onAjukan={onBulkAjukan}
            onVerifikasi={() => setShowBulkVerifikasi(true)}
            onCancel={() => setSelected(new Set())}
          />
        )}

        {feedback && (
          <div className="border-b border-border bg-emerald-50 px-4 py-2 text-xs text-emerald-800">
            {feedback}
          </div>
        )}

        {showEmpty ? (
          <EmptyState
            title="Belum ada pendaftaran"
            description="Mulai dengan menambahkan calon siswa ke gelombang aktif."
            action={
              <Button onClick={() => setShowWizard(true)}>
                <span className="h-4 w-4 mr-1.5"><IconPlus /></span>
                Tambah Pendaftar
              </Button>
            }
          />
        ) : (
          <DataTable<PendaftaranRow>
            data={rows}
            columns={columns}
            rowKey={(r) => r.name}
            selectable
            selected={selected}
            onToggleRow={toggleRow}
            onToggleAll={toggleAll}
            sort={sort}
            onSortChange={setSort}
            onRowClick={(r) =>
              navigate({ to: "/sch/$sekolah/ppdb/$noPendaftaran", params: { sekolah, noPendaftaran: r.name } })
            }
            empty={q.isLoading ? "Memuat..." : q.isError ? "Gagal memuat data." : "Belum ada pendaftaran."}
          />
        )}

        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={(page - 1) * PAGE_SIZE + rows.length + (hasNext ? 1 : 0)}
          onPageChange={setPage}
        />
      </SectionCard>

      <PendaftaranWizard open={showWizard} onClose={() => setShowWizard(false)} onCreated={() => q.refetch()} sekolah={sekolah} />

      <BulkVerifikasiModal
        open={showBulkVerifikasi}
        count={selected.size}
        target={bulkTarget}
        pending={verifikasi.isPending}
        onSelect={setBulkTarget}
        onConfirm={onBulkVerifikasi}
        onClose={() => setShowBulkVerifikasi(false)}
      />
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/ppdb/daftar")({ component: PpdbDaftarPage });
