/**
 * Daftar Ulang PPDB — pelunasan + finalisasi ke Siswa.
 *
 * Setiap row menampilkan status daftar ulang; jika sudah Selesai DU dan
 * pendaftaran terkait masih Diterima/Daftar Ulang, tombol "Finalisasi"
 * memanggil `finalisasi_pendaftaran` untuk membuat record Siswa.
 * Setelah jadi siswa, kolom Siswa menampilkan link ke record baru.
 */

import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Badge,
  Button,
  DataTable,
  FilterBar,
  Modal,
  PageHeader,
  Pagination,
  SectionCard,
  type Column,
} from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import { useFinalisasiPendaftaran } from "../lib/ppdbApi";

type Row = {
  name: string;
  pendaftaran_ppdb?: string;
  siswa?: string;
  status?: string;
  tanggal_daftar_ulang?: string;
  tahun_ajaran?: string;
  rombongan_belajar_tujuan?: string;
  gelombang_ppdb?: string;
};

const STATUS_OPTIONS = ["Semua", "Pending", "Selesai", "Batal"];
const PAGE_SIZE = 25;

function DaftarUlangPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Semua");
  const [page, setPage] = useState(1);
  const [confirmRow, setConfirmRow] = useState<Row | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "ok" | "err"; msg: string } | null>(null);

  const finalisasi = useFinalisasiPendaftaran();

  const params = useMemo(() => {
    const filters: Array<[string, string, unknown]> = [];
    if (status !== "Semua") filters.push(["status", "=", status]);
    if (search.trim()) filters.push(["name", "like", `%${search.trim()}%`]);
    return {
      fields: [
        "name", "pendaftaran_ppdb", "siswa", "status",
        "tanggal_daftar_ulang", "tahun_ajaran", "rombongan_belajar_tujuan", "gelombang_ppdb",
      ],
      ...(filters.length ? { filters } : {}),
      order_by: "`tanggal_daftar_ulang` desc",
      limit_start: (page - 1) * PAGE_SIZE,
      limit_page_length: PAGE_SIZE + 1,
    };
  }, [status, search, page]);

  const q = useResourceList<Row>("Daftar Ulang PPDB", params);
  const fetched = q.data ?? [];
  const hasNext = fetched.length > PAGE_SIZE;
  const rows = hasNext ? fetched.slice(0, PAGE_SIZE) : fetched;

  const onFinalisasi = async (r: Row) => {
    if (!r.pendaftaran_ppdb) {
      setFeedback({ tone: "err", msg: "Pendaftaran tidak ditemukan." });
      return;
    }
    setFeedback(null);
    try {
      const res = (await finalisasi.mutateAsync({ pendaftaran_ppdb: r.pendaftaran_ppdb })) as
        | { siswa?: string }
        | undefined;
      setConfirmRow(null);
      setFeedback({
        tone: "ok",
        msg: res?.siswa
          ? `Siswa dibuat: ${res.siswa}.`
          : "Pendaftaran difinalisasi.",
      });
      q.refetch();
    } catch (e) {
      setFeedback({ tone: "err", msg: (e as Error)?.message ?? "Gagal finalisasi." });
    }
  };

  const statTone = (s: string | undefined): "success" | "warning" | "danger" | "neutral" => {
    if (s === "Selesai") return "success";
    if (s === "Batal") return "danger";
    if (s === "Pending") return "warning";
    return "neutral";
  };

  const COLUMNS: Column<Row>[] = [
    {
      key: "name",
      header: "ID",
      cell: (r) => <span className="font-mono text-xs">{r.name}</span>,
    },
    {
      key: "pendaftaran_ppdb",
      header: "Pendaftaran",
      cell: (r) =>
        r.pendaftaran_ppdb ? (
          <Link
            to="/ppdb/$noPendaftaran"
            params={{ noPendaftaran: r.pendaftaran_ppdb }}
            className="font-mono text-xs text-brand hover:underline"
          >
            {r.pendaftaran_ppdb}
          </Link>
        ) : (
          "—"
        ),
    },
    { key: "tanggal_daftar_ulang", header: "Tanggal DU", cell: (r) => r.tanggal_daftar_ulang ?? "—" },
    { key: "rombongan_belajar_tujuan", header: "Rombel Tujuan", cell: (r) => r.rombongan_belajar_tujuan ?? "—" },
    {
      key: "siswa",
      header: "Siswa",
      cell: (r) =>
        r.siswa ? (
          <Link to="/siswa" className="text-xs text-emerald-700 hover:underline">
            ✓ {r.siswa}
          </Link>
        ) : (
          <span className="text-xs text-muted-fg">— belum difinalisasi</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => (
        <Badge tone={statTone(r.status)} dot>
          {r.status ?? "—"}
        </Badge>
      ),
    },
    {
      key: "aksi",
      header: "Aksi",
      align: "right",
      cell: (r) => {
        const canFinalisasi = r.status === "Selesai" && !r.siswa && !!r.pendaftaran_ppdb;
        return (
          <Button
            size="sm"
            disabled={!canFinalisasi || finalisasi.isPending}
            onClick={() => setConfirmRow(r)}
            className={canFinalisasi ? "!bg-emerald-600 hover:!bg-emerald-700 !text-white" : ""}
            variant={canFinalisasi ? "default" : "outline"}
            title={r.siswa ? "Sudah difinalisasi" : "Selesaikan daftar ulang terlebih dahulu"}
          >
            {r.siswa ? "Selesai" : "Finalisasi"}
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="PPDB"
        title="Daftar Ulang PPDB"
        description="Konfirmasi calon diterima → buat record Siswa resmi."
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
              placeholder: "Cari ID daftar ulang...",
            }}
            filters={[
              {
                key: "status",
                label: "Status",
                value: status,
                options: STATUS_OPTIONS.map((v) => ({ value: v, label: v })),
                onChange: (v) => {
                  setStatus(v);
                  setPage(1);
                },
              },
            ]}
          />
        </div>

        {feedback && (
          <div
            className={
              "border-b border-border px-4 py-2 text-xs " +
              (feedback.tone === "ok"
                ? "bg-emerald-50 text-emerald-800"
                : "bg-rose-50 text-rose-800")
            }
          >
            {feedback.msg}
          </div>
        )}

        <DataTable
          data={rows}
          columns={COLUMNS}
          rowKey={(r) => r.name}
          empty={q.isLoading ? "Memuat..." : q.isError ? "Gagal memuat." : "Belum ada daftar ulang."}
        />

        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={(page - 1) * PAGE_SIZE + rows.length + (hasNext ? 1 : 0)}
          onPageChange={setPage}
        />
      </SectionCard>

      <Modal
        open={!!confirmRow}
        onClose={() => setConfirmRow(null)}
        title="Finalisasi → Buat Siswa"
        description="Aksi idempoten: membuat record Siswa + Pendaftaran Siswa, lalu menutup pendaftaran PPDB."
        tone="emerald"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmRow(null)}>Batal</Button>
            <Button
              disabled={finalisasi.isPending}
              onClick={() => confirmRow && onFinalisasi(confirmRow)}
              className="!bg-emerald-600 hover:!bg-emerald-700 !text-white"
            >
              {finalisasi.isPending ? "Memproses..." : "Finalisasi Sekarang"}
            </Button>
          </div>
        }
      >
        {confirmRow && (
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-muted-fg">Pendaftaran:</span>{" "}
              <span className="font-mono">{confirmRow.pendaftaran_ppdb}</span>
            </div>
            <div>
              <span className="text-muted-fg">Rombel tujuan:</span>{" "}
              <span>{confirmRow.rombongan_belajar_tujuan ?? "—"}</span>
            </div>
            <div>
              <span className="text-muted-fg">Tahun ajaran:</span>{" "}
              <span>{confirmRow.tahun_ajaran ?? "—"}</span>
            </div>
            <p className="text-xs text-muted-fg">
              Pastikan pelunasan biaya pendaftaran sudah dikonfirmasi sebelum
              melanjutkan.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}

export const Route = createFileRoute("/ppdb/daftar-ulang")({ component: DaftarUlangPage });
