/**
 * Pendaftaran PPDB list — bulk-action capable.
 *
 * Replaces the generic ResourceListPage to add:
 *   - row selection (multi-select via checkbox)
 *   - bulk Ajukan / Verifikasi via PPDB whitelisted endpoints
 *   - "Tambah Pendaftar" wizard (Calon Siswa → Gelombang → submit)
 *
 * Wired to live Pendaftaran PPDB doctype + sekolahpro.ppdb.api.ppdb.*.
 */

import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Badge,
  Button,
  DataTable,
  FilterBar,
  Modal,
  PageHeader,
  Pagination,
  SearchableSelect,
  SectionCard,
  IconPlus,
  type Column,
  type SortState,
} from "@sekolahpro/ui";
import {
  useResourceList,
  useResourceCreate,
  type ListParams,
} from "@sekolahpro/api-client";
import {
  TONE_BY_STATUS,
  useAjukanPendaftaran,
  useVerifikasiPendaftaran,
  useGelombangAktif,
  type VerifikasiStatus,
} from "../lib/ppdbApi";

type Row = {
  name: string;
  status?: string;
  gelombang_ppdb?: string;
  calon_siswa?: string;
  tanggal_daftar?: string;
};

const COLUMNS_BASE: Column<Row>[] = [
  {
    key: "name",
    header: "No. Pendaftaran",
    sortable: true,
    cell: (r) => (
      <Link
        to="/ppdb/$noPendaftaran"
        params={{ noPendaftaran: r.name }}
        className="font-mono text-xs text-brand hover:underline"
      >
        {r.name}
      </Link>
    ),
  },
  { key: "calon_siswa", header: "Calon Siswa", sortable: true, cell: (r) => r.calon_siswa ?? "—" },
  { key: "gelombang_ppdb", header: "Gelombang", cell: (r) => r.gelombang_ppdb ?? "—" },
  { key: "tanggal_daftar", header: "Tanggal Daftar", sortable: true, cell: (r) => r.tanggal_daftar ?? "—" },
  {
    key: "status",
    header: "Status",
    cell: (r) => (
      <Badge tone={TONE_BY_STATUS[r.status ?? ""] ?? "neutral"} dot>
        {r.status ?? "—"}
      </Badge>
    ),
  },
];

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

const VERIFIKASI_OPTIONS: VerifikasiStatus[] = [
  "Diverifikasi",
  "Seleksi",
  "Diterima",
  "Ditolak",
];

function PpdbDaftarPage() {
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

  const params: ListParams = useMemo(() => {
    const filters: Array<[string, string, unknown]> = [];
    if (statusFilter !== "Semua") filters.push(["status", "=", statusFilter]);
    if (search.trim()) filters.push(["name", "like", `%${search.trim()}%`]);
    const p: ListParams = {
      fields: ["name", "status", "gelombang_ppdb", "calon_siswa", "tanggal_daftar"],
      order_by: `\`${sort.key}\` ${sort.dir}`,
      limit_start: (page - 1) * PAGE_SIZE,
      limit_page_length: PAGE_SIZE + 1,
    };
    if (filters.length) p.filters = filters;
    return p;
  }, [statusFilter, search, sort, page]);

  const q = useResourceList<Row>("Pendaftaran PPDB", params);
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
  const canBulkAjukan = selectedRows.length > 0 && selectedRows.every((r) => r.status === "Draft");

  const onBulkAjukan = async () => {
    setFeedback(null);
    let ok = 0, err = 0;
    for (const r of selectedRows) {
      try {
        await ajukan.mutateAsync({ pendaftaran_ppdb: r.name });
        ok++;
      } catch {
        err++;
      }
    }
    setSelected(new Set());
    setFeedback(`Ajukan: ${ok} berhasil, ${err} gagal.`);
  };

  const onBulkVerifikasi = async () => {
    setFeedback(null);
    let ok = 0, err = 0;
    for (const r of selectedRows) {
      try {
        await verifikasi.mutateAsync({ pendaftaran_ppdb: r.name, status: bulkTarget });
        ok++;
      } catch {
        err++;
      }
    }
    setSelected(new Set());
    setShowBulkVerifikasi(false);
    setFeedback(`Verifikasi → ${bulkTarget}: ${ok} berhasil, ${err} gagal.`);
  };

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

        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-3 border-y border-border bg-brand/5 px-4 py-3">
            <span className="text-sm text-fg">
              <strong className="tabular-nums">{selected.size}</strong> dipilih
            </span>
            <div className="ml-auto flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={!canBulkAjukan || ajukan.isPending}
                onClick={onBulkAjukan}
                title={canBulkAjukan ? "" : "Hanya pendaftaran berstatus Draft yang bisa diajukan"}
              >
                Ajukan Massal
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={verifikasi.isPending}
                onClick={() => setShowBulkVerifikasi(true)}
              >
                Verifikasi Massal
              </Button>
              <Button size="sm" variant="outline" onClick={() => setSelected(new Set())}>
                Batal
              </Button>
            </div>
          </div>
        )}

        {feedback && (
          <div className="border-b border-border bg-emerald-50 px-4 py-2 text-xs text-emerald-800">
            {feedback}
          </div>
        )}

        <DataTable<Row>
          data={rows}
          columns={COLUMNS_BASE}
          rowKey={(r) => r.name}
          selectable
          selected={selected}
          onToggleRow={toggleRow}
          onToggleAll={toggleAll}
          sort={sort}
          onSortChange={setSort}
          onRowClick={(r) =>
            navigate({ to: "/ppdb/$noPendaftaran", params: { noPendaftaran: r.name } })
          }
          empty={
            q.isLoading
              ? "Memuat..."
              : q.isError
                ? "Gagal memuat data."
                : "Belum ada pendaftaran."
          }
        />

        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={(page - 1) * PAGE_SIZE + rows.length + (hasNext ? 1 : 0)}
          onPageChange={setPage}
        />
      </SectionCard>

      <PendaftaranWizard open={showWizard} onClose={() => setShowWizard(false)} onCreated={() => q.refetch()} />

      <Modal
        open={showBulkVerifikasi}
        onClose={() => setShowBulkVerifikasi(false)}
        title={`Verifikasi ${selected.size} Pendaftaran`}
        tone="brand"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowBulkVerifikasi(false)}>Batal</Button>
            <Button onClick={onBulkVerifikasi} disabled={verifikasi.isPending}>
              {verifikasi.isPending ? "Memproses..." : "Konfirmasi"}
            </Button>
          </div>
        }
      >
        <div>
          <label className="mb-2 block text-xs font-medium text-muted-fg">Status Tujuan</label>
          <div className="flex flex-wrap gap-2">
            {VERIFIKASI_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setBulkTarget(s)}
                className={
                  "rounded-md border px-3 py-1.5 text-xs font-medium transition " +
                  (bulkTarget === s
                    ? "border-brand bg-brand text-white"
                    : "border-border bg-card hover:border-brand")
                }
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}

interface WizardProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

type CalonOpt = { name: string; nama_lengkap?: string };

function PendaftaranWizard({ open, onClose, onCreated }: WizardProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [calon, setCalon] = useState<string>("");
  const [gelombang, setGelombang] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);

  const calonQ = useResourceList<CalonOpt>("Calon Siswa", {
    fields: ["name", "nama_lengkap"],
    order_by: "`modified` desc",
    limit_page_length: 100,
  }, { enabled: open });

  const gelombangQ = useGelombangAktif();
  const create = useResourceCreate<{ name: string }>("Pendaftaran PPDB");

  const reset = () => {
    setStep(1);
    setCalon("");
    setGelombang("");
    setErr(null);
  };

  const submit = async () => {
    setErr(null);
    try {
      await create.mutateAsync({
        calon_siswa: calon,
        gelombang_ppdb: gelombang,
      });
      onCreated();
      reset();
      onClose();
    } catch (e) {
      setErr((e as Error)?.message ?? "Gagal membuat pendaftaran.");
    }
  };

  const calonOpts = (calonQ.data ?? []).map((c) => ({
    value: c.name,
    label: `${c.nama_lengkap ?? "—"} (${c.name})`,
  }));
  const gelombangOpts = (gelombangQ.data ?? []).map((g) => ({
    value: g.name,
    label: `${g.nama}${g.tahun_ajaran ? ` · TA ${g.tahun_ajaran}` : ""}${g.sekolah ? ` · ${g.sekolah}` : ""}`,
  }));

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      size="lg"
      title="Tambah Pendaftaran PPDB"
      description="Pilih calon siswa dan gelombang aktif."
      tone="brand"
      footer={
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-fg">Langkah {step} dari 2</span>
          <div className="flex gap-2">
            {step === 2 && (
              <Button variant="outline" onClick={() => setStep(1)} disabled={create.isPending}>
                Sebelumnya
              </Button>
            )}
            {step === 1 ? (
              <Button onClick={() => setStep(2)} disabled={!calon}>
                Lanjut
              </Button>
            ) : (
              <Button onClick={submit} disabled={!gelombang || create.isPending}>
                {create.isPending ? "Membuat..." : "Buat Pendaftaran"}
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {step === 1 && (
          <div>
            <label className="mb-2 block text-xs font-medium text-muted-fg">Calon Siswa</label>
            <SearchableSelect
              value={calon}
              onChange={setCalon}
              options={calonOpts}
              placeholder={calonQ.isLoading ? "Memuat..." : "Cari nama atau ID calon..."}
            />
            <p className="mt-2 text-xs text-muted-fg">
              Calon belum terdaftar?{" "}
              <Link to="/ppdb/calon-siswa" className="text-brand hover:underline">
                Tambah Calon Siswa
              </Link>
              .
            </p>
          </div>
        )}
        {step === 2 && (
          <div>
            <label className="mb-2 block text-xs font-medium text-muted-fg">Gelombang Aktif</label>
            <SearchableSelect
              value={gelombang}
              onChange={setGelombang}
              options={gelombangOpts}
              placeholder={gelombangQ.isLoading ? "Memuat..." : "Pilih gelombang..."}
            />
            {gelombangQ.data?.length === 0 && (
              <p className="mt-2 text-xs text-amber-700">
                Belum ada gelombang aktif.{" "}
                <Link to="/ppdb/gelombang" className="underline">
                  Buka pengaturan gelombang
                </Link>
                .
              </p>
            )}
          </div>
        )}
        {err && (
          <div className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-800">
            {err}
          </div>
        )}
      </div>
    </Modal>
  );
}

export const Route = createFileRoute("/ppdb/daftar")({ component: PpdbDaftarPage });
