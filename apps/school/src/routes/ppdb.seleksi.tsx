/**
 * Seleksi PPDB — batch scoring + bulk pengumuman per gelombang.
 *
 * UX flow:
 *   1. Panitia pilih gelombang dari filter atas.
 *   2. Tabel menampilkan seleksi pendaftar — kolom Nilai inline-editable,
 *      kolom Aksi menawarkan Lulus / Tidak Lulus (set_hasil_seleksi).
 *   3. Tombol "Umumkan Hasil" memetakan Lulus→Diterima, Tidak Lulus→Ditolak
 *      pada semua Pendaftaran berstatus Seleksi di gelombang ini.
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
  SearchableSelect,
  SectionCard,
  type Column,
} from "@sekolahpro/ui";
import {
  useResourceList,
  useResourceUpdate,
} from "@sekolahpro/api-client";
import {
  useGelombangAktif,
  useSetHasilSeleksi,
  useUmumkanHasil,
  useStatistikGelombang,
} from "../lib/ppdbApi";

type SeleksiRow = {
  name: string;
  pendaftaran_ppdb?: string;
  calon_siswa?: string;
  gelombang_ppdb?: string;
  nilai?: number;
  hasil?: string;
};

function SeleksiPpdbPage() {
  const [gelombang, setGelombang] = useState<string>("");
  const [search, setSearch] = useState("");
  const [editingNilai, setEditingNilai] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [confirmUmumkan, setConfirmUmumkan] = useState(false);

  const gelombangQ = useGelombangAktif();
  const stat = useStatistikGelombang(gelombang || undefined);
  const setHasil = useSetHasilSeleksi();
  const umumkan = useUmumkanHasil();
  const updateSeleksi = useResourceUpdate("Seleksi PPDB");

  const params = useMemo(() => {
    const filters: Array<[string, string, unknown]> = [];
    if (gelombang) filters.push(["gelombang_ppdb", "=", gelombang]);
    if (search.trim()) filters.push(["calon_siswa", "like", `%${search.trim()}%`]);
    return {
      fields: ["name", "pendaftaran_ppdb", "calon_siswa", "gelombang_ppdb", "nilai", "hasil"],
      ...(filters.length ? { filters } : {}),
      order_by: "`nilai` desc",
      limit_page_length: 200,
    };
  }, [gelombang, search]);

  const q = useResourceList<SeleksiRow>("Seleksi PPDB", params);
  const rows = q.data ?? [];

  const rankedRows = useMemo(() => {
    return rows
      .slice()
      .sort((a, b) => (b.nilai ?? -Infinity) - (a.nilai ?? -Infinity))
      .map((r, i): SeleksiRow & { _rank?: number } => (r.nilai !== undefined ? { ...r, _rank: i + 1 } : { ...r }));
  }, [rows]);

  const onSaveNilai = async (row: SeleksiRow) => {
    const v = editingNilai[row.name];
    if (v === undefined) return;
    const num = Number(v);
    if (Number.isNaN(num)) {
      setFeedback(`Nilai tidak valid untuk ${row.calon_siswa ?? row.name}.`);
      return;
    }
    try {
      await updateSeleksi.mutateAsync({ name: row.name, patch: { nilai: num } });
      setEditingNilai((cur) => {
        const { [row.name]: _omit, ...rest } = cur;
        return rest;
      });
      setFeedback(`Nilai disimpan: ${num}.`);
      q.refetch();
    } catch (e) {
      setFeedback((e as Error)?.message ?? "Gagal menyimpan nilai.");
    }
  };

  const onSetHasil = async (row: SeleksiRow, hasil: "Lulus" | "Tidak Lulus") => {
    try {
      await setHasil.mutateAsync({ seleksi_ppdb: row.name, hasil });
      setFeedback(`${row.calon_siswa ?? row.name} → ${hasil}.`);
      q.refetch();
    } catch (e) {
      setFeedback((e as Error)?.message ?? "Gagal set hasil.");
    }
  };

  const onUmumkan = async () => {
    if (!gelombang) return;
    try {
      await umumkan.mutateAsync({ gelombang_ppdb: gelombang });
      setFeedback("Hasil seleksi diumumkan. Pendaftaran terkait di-update.");
      setConfirmUmumkan(false);
      q.refetch();
    } catch (e) {
      setFeedback((e as Error)?.message ?? "Gagal mengumumkan hasil.");
    }
  };

  const gelombangOpts = (gelombangQ.data ?? []).map((g) => ({
    value: g.name,
    label: `${g.nama}${g.tahun_ajaran ? ` · TA ${g.tahun_ajaran}` : ""}`,
  }));

  const tooneOf = (hasil: string | undefined): "success" | "danger" | "neutral" => {
    if (hasil === "Lulus") return "success";
    if (hasil === "Tidak Lulus") return "danger";
    return "neutral";
  };

  const COLUMNS: Column<SeleksiRow & { _rank?: number }>[] = [
    {
      key: "_rank",
      header: "#",
      align: "right",
      width: "60px",
      cell: (r) => (r._rank !== undefined ? <span className="tabular-nums text-muted-fg">{r._rank}</span> : "—"),
    },
    {
      key: "calon_siswa",
      header: "Calon Siswa",
      cell: (r) => <span className="font-medium">{r.calon_siswa ?? r.name}</span>,
    },
    {
      key: "pendaftaran_ppdb",
      header: "Pendaftaran",
      cell: (r) => <span className="font-mono text-xs text-muted-fg">{r.pendaftaran_ppdb ?? "—"}</span>,
    },
    {
      key: "nilai",
      header: "Nilai",
      align: "right",
      width: "140px",
      cell: (r) => {
        const editing = editingNilai[r.name];
        const isEditing = editing !== undefined;
        return (
          <div className="flex items-center justify-end gap-1.5">
            <input
              type="number"
              step="0.01"
              value={isEditing ? editing : (r.nilai ?? "")}
              onChange={(e) =>
                setEditingNilai((cur) => ({ ...cur, [r.name]: e.target.value }))
              }
              className="h-7 w-20 rounded-md border border-border bg-bg px-2 text-right text-sm tabular-nums focus:border-brand focus:outline-none"
            />
            {isEditing && (
              <Button size="sm" variant="outline" onClick={() => onSaveNilai(r)}>
                ✓
              </Button>
            )}
          </div>
        );
      },
    },
    {
      key: "hasil",
      header: "Hasil",
      cell: (r) => (
        <Badge tone={tooneOf(r.hasil)} dot>
          {r.hasil ?? "Belum"}
        </Badge>
      ),
    },
    {
      key: "aksi",
      header: "Aksi",
      align: "right",
      cell: (r) => (
        <div className="flex justify-end gap-1.5">
          <Button
            size="sm"
            variant={r.hasil === "Lulus" ? "default" : "outline"}
            onClick={() => onSetHasil(r, "Lulus")}
            disabled={setHasil.isPending}
            className={r.hasil === "Lulus" ? "!bg-emerald-600 !text-white" : ""}
          >
            Lulus
          </Button>
          <Button
            size="sm"
            variant={r.hasil === "Tidak Lulus" ? "default" : "outline"}
            onClick={() => onSetHasil(r, "Tidak Lulus")}
            disabled={setHasil.isPending}
            className={r.hasil === "Tidak Lulus" ? "!bg-rose-600 !text-white" : ""}
          >
            Tidak Lulus
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="PPDB"
        title="Seleksi PPDB"
        description="Input nilai, tetapkan kelulusan, lalu umumkan hasil seleksi per gelombang."
        actions={
          <Button
            disabled={!gelombang || umumkan.isPending}
            onClick={() => setConfirmUmumkan(true)}
            className="!bg-violet-600 hover:!bg-violet-700 !text-white"
          >
            Umumkan Hasil
          </Button>
        }
      />

      <SectionCard padded={false}>
        <div className="p-3">
          <FilterBar
            search={{
              value: search,
              onChange: setSearch,
              placeholder: "Cari calon siswa...",
            }}
            trailing={
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-muted-fg">Gelombang</span>
                <div className="min-w-[260px]">
                  <SearchableSelect
                    value={gelombang}
                    onChange={setGelombang}
                    options={[{ value: "", label: "Semua gelombang" }, ...gelombangOpts]}
                    placeholder="Pilih gelombang..."
                  />
                </div>
              </div>
            }
          />
        </div>

        {gelombang && stat.data && (
          <div className="grid gap-3 border-y border-border bg-muted/30 p-4 sm:grid-cols-4">
            <Mini label="Total" value={stat.data.total_pendaftar} />
            <Mini label="Diterima" value={stat.data.diterima} tone="success" />
            <Mini label="Ditolak" value={stat.data.ditolak} tone="danger" />
            <Mini label="Sisa Kuota" value={stat.data.sisa_kuota} tone="brand" />
          </div>
        )}

        {feedback && (
          <div className="border-b border-border bg-emerald-50 px-4 py-2 text-xs text-emerald-800">
            {feedback}
          </div>
        )}

        <DataTable
          data={rankedRows}
          columns={COLUMNS}
          rowKey={(r) => r.name}
          empty={
            q.isLoading
              ? "Memuat..."
              : !gelombang
                ? "Pilih gelombang untuk menampilkan seleksi."
                : "Belum ada data seleksi di gelombang ini."
          }
        />
      </SectionCard>

      <Modal
        open={confirmUmumkan}
        onClose={() => setConfirmUmumkan(false)}
        title="Umumkan Hasil Seleksi"
        description="Aksi batch: Lulus → Diterima, Tidak Lulus → Ditolak pada gelombang ini."
        tone="violet"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmUmumkan(false)}>Batal</Button>
            <Button
              onClick={onUmumkan}
              disabled={umumkan.isPending}
              className="!bg-violet-600 hover:!bg-violet-700 !text-white"
            >
              {umumkan.isPending ? "Memproses..." : "Umumkan Sekarang"}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-muted-fg">
          Pastikan semua peserta sudah dinilai dan ditandai Lulus/Tidak Lulus
          sebelum melanjutkan. Aksi ini akan langsung mengubah status pendaftaran
          yang masih berstatus <strong>Seleksi</strong>.
        </p>
      </Modal>
    </div>
  );
}

function Mini({ label, value, tone = "neutral" }: { label: string; value: number; tone?: "success" | "danger" | "brand" | "neutral" }) {
  const cls =
    tone === "success"
      ? "text-emerald-700"
      : tone === "danger"
        ? "text-rose-700"
        : tone === "brand"
          ? "text-brand"
          : "text-fg";
  return (
    <div>
      <div className="text-xs text-muted-fg">{label}</div>
      <div className={`text-2xl font-bold tabular-nums ${cls}`}>{value.toLocaleString("id-ID")}</div>
    </div>
  );
}

export const Route = createFileRoute("/ppdb/seleksi")({ component: SeleksiPpdbPage });
