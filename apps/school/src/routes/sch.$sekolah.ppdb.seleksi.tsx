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
import { createFileRoute, useParams } from "@tanstack/react-router";
import {
  Button,
  DataTable,
  FilterBar,
  Modal,
  PageHeader,
  SearchableSelect,
  SectionCard,
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
import { listPpdbForSekolah } from "../data/ppdb";
import { PageGuide, type PageGuideStep } from "../components/guide/PageGuide";
import {
  SeleksiAnalyticsPanel,
  SeleksiMiniStat,
  buildSeleksiColumns,
  type SeleksiBoardRow,
} from "../components/ppdb/seleksiPanel";

// Baris board seleksi memakai tipe terpusat dari panel (sumber tunggal).
type SeleksiRow = SeleksiBoardRow;

// Identitas guide untuk persistensi open/collapse di localStorage.
const GUIDE_STORAGE_ID = "ppdb-seleksi";
const GUIDE_INTRO =
  "Halaman ini memetakan skor peserta, lalu menetapkan dan mengumumkan kelulusan per gelombang.";

// Langkah panduan papan seleksi — string UI terpusat (no magic strings).
const GUIDE_STEPS: PageGuideStep[] = [
  { title: "Pilih gelombang", detail: "Gunakan filter di atas untuk memfokuskan satu gelombang." },
  { title: "Pantau sebaran skor", detail: "Histogram & donat memperlihatkan distribusi nilai dan komposisi hasil." },
  { title: "Input & tetapkan hasil", detail: "Edit nilai inline, lalu tandai Lulus / Tidak Lulus tiap peserta." },
  { title: "Umumkan hasil", detail: "Klik Umumkan Hasil untuk memetakan Lulus → Diterima, Tidak Lulus → Ditolak." },
];

// Tips ringkas papan seleksi.
const GUIDE_TIPS: string[] = [
  "Peringkat skor otomatis mengurutkan peserta dari nilai tertinggi.",
  "Pastikan semua peserta sudah dinilai sebelum mengumumkan hasil.",
];

export function SeleksiPpdbPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
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
  // Memoize so the empty-array fallback keeps a stable identity across renders
  // (avoids re-running downstream useMemo on every render).
  const rows = useMemo(() => q.data ?? [], [q.data]);

  // Daftar pendaftar (mock) ter-scope sekolah — sumber viz histogram/donat/peringkat.
  // TODO(api): ganti dengan agregasi skor dari backend saat endpoint tersedia.
  const mockList = useMemo(() => listPpdbForSekolah(sekolah), [sekolah]);

  const rankedRows = useMemo(() => {
    return rows
      .slice()
      .sort((a, b) => (b.nilai ?? -Infinity) - (a.nilai ?? -Infinity))
      .map((r, i): SeleksiRow => (r.nilai !== undefined ? { ...r, _rank: i + 1 } : { ...r }));
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

  // Kolom board disuntik handler/state agar logika mutasi tetap di route.
  const columns = buildSeleksiColumns({
    editingNilai,
    setEditingNilai,
    onSaveNilai,
    onSetHasil,
    isPending: setHasil.isPending,
  });

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

      <PageGuide
        storageId={GUIDE_STORAGE_ID}
        intro={GUIDE_INTRO}
        steps={GUIDE_STEPS}
        tips={GUIDE_TIPS}
      />

      {/* Papan visual: histogram skor, donat hasil, dan peringkat (data mock). */}
      <SeleksiAnalyticsPanel list={mockList} />

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
            <SeleksiMiniStat label="Total" value={stat.data.total_pendaftar} />
            <SeleksiMiniStat label="Diterima" value={stat.data.diterima} tone="success" />
            <SeleksiMiniStat label="Ditolak" value={stat.data.ditolak} tone="danger" />
            <SeleksiMiniStat label="Sisa Kuota" value={stat.data.sisa_kuota} tone="brand" />
          </div>
        )}

        {feedback && (
          <div className="border-b border-border bg-emerald-50 px-4 py-2 text-xs text-emerald-800">
            {feedback}
          </div>
        )}

        <DataTable
          data={rankedRows}
          columns={columns}
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

export const Route = createFileRoute("/sch/$sekolah/ppdb/seleksi")({ component: SeleksiPpdbPage });
