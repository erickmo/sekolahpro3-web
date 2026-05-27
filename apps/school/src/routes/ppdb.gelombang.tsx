/**
 * Gelombang PPDB — list + kuota meter + activate/close lifecycle.
 *
 * Setiap row menampilkan progress kuota (pendaftar yang tercatat / kuota)
 * lewat statistik gelombang. Aksi inline: Aktifkan / Tutup.
 * Tombol "Buat Gelombang" buka form create cepat.
 */

import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Badge,
  Button,
  DataTable,
  FilterBar,
  Modal,
  PageHeader,
  Pagination,
  SectionCard,
  IconPlus,
  type Column,
} from "@sekolahpro/ui";
import {
  useResourceList,
  useResourceCreate,
  useResourceUpdate,
} from "@sekolahpro/api-client";

type Row = {
  name: string;
  nama?: string;
  tingkat?: string;
  status?: string;
  tahun_ajaran?: string;
  sekolah?: string;
  tanggal_buka?: string;
  tanggal_tutup?: string;
  biaya_pendaftaran?: number;
  kuota?: number;
};

const STATUS_OPTIONS = ["Semua", "Draft", "Aktif", "Tutup"];
const PAGE_SIZE = 25;

function GelombangPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Semua");
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const update = useResourceUpdate("Gelombang PPDB");

  const params = useMemo(() => {
    const filters: Array<[string, string, unknown]> = [];
    if (status !== "Semua") filters.push(["status", "=", status]);
    if (search.trim()) filters.push(["nama", "like", `%${search.trim()}%`]);
    return {
      fields: [
        "name", "nama", "tingkat", "status", "tahun_ajaran", "sekolah",
        "tanggal_buka", "tanggal_tutup", "biaya_pendaftaran", "kuota",
      ],
      ...(filters.length ? { filters } : {}),
      order_by: "`tanggal_buka` desc",
      limit_start: (page - 1) * PAGE_SIZE,
      limit_page_length: PAGE_SIZE + 1,
    };
  }, [status, search, page]);

  const q = useResourceList<Row>("Gelombang PPDB", params);
  const fetched = q.data ?? [];
  const hasNext = fetched.length > PAGE_SIZE;
  const rows = hasNext ? fetched.slice(0, PAGE_SIZE) : fetched;

  // Ambil total pendaftaran per gelombang untuk kuota meter.
  // 1 query agregat dipakai semua row.
  const allPendaftaranQ = useResourceList<{ name: string; gelombang_ppdb?: string }>(
    "Pendaftaran PPDB",
    {
      fields: ["name", "gelombang_ppdb"],
      ...(rows.length
        ? { filters: [["gelombang_ppdb", "in", rows.map((r) => r.name)]] as [string, string, unknown][] }
        : {}),
      limit_page_length: 0,
    },
    { enabled: rows.length > 0 },
  );
  const terisiByGelombang = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of allPendaftaranQ.data ?? []) {
      if (!p.gelombang_ppdb) continue;
      map[p.gelombang_ppdb] = (map[p.gelombang_ppdb] ?? 0) + 1;
    }
    return map;
  }, [allPendaftaranQ.data]);

  const onToggleStatus = async (r: Row, next: "Aktif" | "Tutup") => {
    setFeedback(null);
    try {
      await update.mutateAsync({ name: r.name, patch: { status: next } });
      setFeedback(`${r.nama ?? r.name} → ${next}.`);
      q.refetch();
    } catch (e) {
      setFeedback((e as Error)?.message ?? "Gagal ubah status.");
    }
  };

  const statTone = (s: string | undefined): "success" | "neutral" | "warning" => {
    if (s === "Aktif") return "success";
    if (s === "Tutup") return "neutral";
    return "warning";
  };

  const COLUMNS: Column<Row>[] = [
    { key: "name", header: "ID", cell: (r) => <span className="font-mono text-xs">{r.name}</span> },
    {
      key: "nama",
      header: "Gelombang",
      cell: (r) => (
        <div>
          <div className="font-medium">{r.nama ?? "—"}</div>
          <div className="text-xs text-muted-fg">
            {[r.tahun_ajaran && `TA ${r.tahun_ajaran}`, r.sekolah, r.tingkat && `Tingkat ${r.tingkat}`]
              .filter(Boolean)
              .join(" · ") || "—"}
          </div>
        </div>
      ),
    },
    {
      key: "jadwal",
      header: "Jadwal",
      cell: (r) => (
        <div className="text-xs text-muted-fg">
          <div>Buka: {r.tanggal_buka ?? "—"}</div>
          <div>Tutup: {r.tanggal_tutup ?? "—"}</div>
        </div>
      ),
    },
    {
      key: "kuota",
      header: "Kuota",
      align: "right",
      cell: (r) => {
        const terisi = terisiByGelombang[r.name] ?? 0;
        const kuota = r.kuota ?? 0;
        const pct = kuota > 0 ? Math.min(100, Math.round((terisi / kuota) * 100)) : 0;
        const overLimit = kuota > 0 && terisi >= kuota;
        return (
          <div className="min-w-[160px] text-right">
            <div className="tabular-nums text-sm">
              <strong>{terisi}</strong>
              <span className="text-muted-fg"> / {kuota || "∞"}</span>
            </div>
            {kuota > 0 ? (
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={overLimit ? "h-full bg-rose-600" : pct >= 80 ? "h-full bg-amber-500" : "h-full bg-emerald-500"}
                  style={{ width: `${pct}%` }}
                />
              </div>
            ) : null}
          </div>
        );
      },
    },
    {
      key: "biaya_pendaftaran",
      header: "Biaya",
      align: "right",
      cell: (r) => (
        <span className="tabular-nums text-xs">
          Rp {(r.biaya_pendaftaran ?? 0).toLocaleString("id-ID")}
        </span>
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
        if (r.status === "Aktif") {
          return (
            <Button size="sm" variant="outline" onClick={() => onToggleStatus(r, "Tutup")} disabled={update.isPending}>
              Tutup
            </Button>
          );
        }
        if (r.status === "Draft" || r.status === "Tutup") {
          return (
            <Button
              size="sm"
              onClick={() => onToggleStatus(r, "Aktif")}
              disabled={update.isPending}
              className="!bg-emerald-600 hover:!bg-emerald-700 !text-white"
            >
              Aktifkan
            </Button>
          );
        }
        return null;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="PPDB"
        title="Gelombang PPDB"
        description="Atur periode pendaftaran, kuota, dan biaya per gelombang."
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <span className="h-4 w-4 mr-1.5"><IconPlus /></span>
            Buat Gelombang
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
              placeholder: "Cari nama gelombang...",
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
          <div className="border-b border-border bg-emerald-50 px-4 py-2 text-xs text-emerald-800">
            {feedback}
          </div>
        )}

        <DataTable
          data={rows}
          columns={COLUMNS}
          rowKey={(r) => r.name}
          empty={q.isLoading ? "Memuat..." : q.isError ? "Gagal memuat." : "Belum ada gelombang."}
        />

        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={(page - 1) * PAGE_SIZE + rows.length + (hasNext ? 1 : 0)}
          onPageChange={setPage}
        />
      </SectionCard>

      <GelombangCreateModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => q.refetch()}
      />
    </div>
  );
}

function GelombangCreateModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [nama, setNama] = useState("");
  const [tahunAjaran, setTahunAjaran] = useState("");
  const [sekolah, setSekolah] = useState("");
  const [tingkat, setTingkat] = useState("");
  const [tanggalBuka, setTanggalBuka] = useState("");
  const [tanggalTutup, setTanggalTutup] = useState("");
  const [kuota, setKuota] = useState<string>("");
  const [biaya, setBiaya] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);

  const create = useResourceCreate("Gelombang PPDB");

  const reset = () => {
    setNama("");
    setTahunAjaran("");
    setSekolah("");
    setTingkat("");
    setTanggalBuka("");
    setTanggalTutup("");
    setKuota("");
    setBiaya("");
    setErr(null);
  };

  const submit = async () => {
    setErr(null);
    try {
      await create.mutateAsync({
        nama,
        tahun_ajaran: tahunAjaran || undefined,
        sekolah: sekolah || undefined,
        tingkat: tingkat || undefined,
        tanggal_buka: tanggalBuka || undefined,
        tanggal_tutup: tanggalTutup || undefined,
        kuota: kuota ? Number(kuota) : undefined,
        biaya_pendaftaran: biaya ? Number(biaya) : undefined,
        status: "Draft",
      });
      reset();
      onCreated();
      onClose();
    } catch (e) {
      setErr((e as Error)?.message ?? "Gagal membuat gelombang.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Buat Gelombang Baru"
      description="Default status Draft; aktifkan dari daftar setelah konfigurasi selesai."
      size="lg"
      tone="brand"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => { reset(); onClose(); }}>Batal</Button>
          <Button onClick={submit} disabled={!nama || create.isPending}>
            {create.isPending ? "Membuat..." : "Buat"}
          </Button>
        </div>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nama Gelombang *">
          <input value={nama} onChange={(e) => setNama(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Tahun Ajaran">
          <input value={tahunAjaran} onChange={(e) => setTahunAjaran(e.target.value)} className={inputCls} placeholder="2026-2027" />
        </Field>
        <Field label="Sekolah">
          <input value={sekolah} onChange={(e) => setSekolah(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Tingkat">
          <input value={tingkat} onChange={(e) => setTingkat(e.target.value)} className={inputCls} placeholder="mis. 10" />
        </Field>
        <Field label="Tanggal Buka">
          <input type="date" value={tanggalBuka} onChange={(e) => setTanggalBuka(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Tanggal Tutup">
          <input type="date" value={tanggalTutup} onChange={(e) => setTanggalTutup(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Kuota">
          <input type="number" value={kuota} onChange={(e) => setKuota(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Biaya Pendaftaran (Rp)">
          <input type="number" value={biaya} onChange={(e) => setBiaya(e.target.value)} className={inputCls} />
        </Field>
      </div>
      {err && (
        <div className="mt-3 rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-800">
          {err}
        </div>
      )}
    </Modal>
  );
}

const inputCls =
  "h-9 w-full rounded-md border border-border bg-bg px-3 text-sm focus:border-brand focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-fg">{label}</span>
      {children}
    </label>
  );
}

export const Route = createFileRoute("/ppdb/gelombang")({ component: GelombangPage });
