/**
 * Calon Siswa — direktori kartu pendaftar PPDB yang dapat difilter.
 *
 * Menggantikan tabel CRUD lama dengan grid kartu yang lebih mudah dipindai:
 * tiap kartu menampilkan avatar, nama, badge jenjang/jalur, dan cincin
 * kelengkapan dokumen. Filter status/jalur/jenjang + pencarian nama mempersempit
 * himpunan secara langsung.
 *
 * Sumber data: mock listPpdbForSekolah(sekolah) (shape Pendaftar) — diganti
 * dengan @sekolahpro/api-client ketika backend Calon Siswa siap.
 */

import { useMemo, useState, type ReactNode } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { EmptyState, FilterBar, PageHeader, SectionCard } from "@sekolahpro/ui";
import { PageGuide } from "../components/guide/PageGuide";
import { CalonSiswaCard } from "../components/ppdb/calon-siswaPanel";
import { listPpdbForSekolah, FILTER_OPTIONS, type Pendaftar } from "../data/ppdb";

// Nilai sentinel "semua" pada dropdown filter (tidak menyaring apa pun).
const ALL = "Semua";
// storageId tutorial halaman — stabil agar preferensi buka/tutup tersimpan.
const GUIDE_STORAGE_ID = "ppdb-calon-siswa";

// Label UI Bahasa Indonesia terpusat (no magic strings).
const SEARCH_PLACEHOLDER = "Cari nama atau nomor pendaftaran...";
const EMPTY_TITLE = "Tidak ada calon siswa";
const EMPTY_DESC =
  "Tidak ada pendaftar yang cocok dengan filter saat ini. Setel ulang filter atau ubah kata kunci pencarian.";

// Langkah tutorial PageGuide — dipisah dari JSX agar fungsi komponen ringkas.
const GUIDE_STEPS = [
  {
    title: "Telusuri kartu pendaftar",
    detail: "Tiap kartu memuat identitas, jenjang/jalur, dan kelengkapan dokumen.",
  },
  {
    title: "Saring dengan filter",
    detail: "Gunakan filter status, jalur, dan jenjang untuk mempersempit daftar.",
  },
  {
    title: "Buka detail",
    detail: "Klik \"Lihat detail\" pada kartu untuk membuka biodata lengkap pendaftar.",
  },
];

const GUIDE_TIPS = [
  "Cincin dokumen berwarna hijau berarti berkas hampir lengkap.",
  "Pencarian mencocokkan nama maupun nomor pendaftaran.",
];

/** State filter aktif untuk direktori calon siswa. */
interface FilterState {
  search: string;
  status: string;
  jalur: string;
  jenjang: string;
}

const INITIAL_FILTER: FilterState = {
  search: "",
  status: ALL,
  jalur: ALL,
  jenjang: ALL,
};

/** True bila `value` sentinel ALL atau cocok dengan field pendaftar. */
function matchesOption(field: string, value: string): boolean {
  return value === ALL || field === value;
}

/** True bila kata kunci kosong atau cocok (case-insensitive) nama/no. */
function matchesSearch(p: Pendaftar, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    p.namaLengkap.toLowerCase().includes(q) ||
    p.noPendaftaran.toLowerCase().includes(q)
  );
}

/** Terapkan seluruh kriteria filter ke daftar pendaftar (pure, mudah diuji). */
function applyFilter(list: Pendaftar[], f: FilterState): Pendaftar[] {
  return list.filter(
    (p) =>
      matchesSearch(p, f.search) &&
      matchesOption(p.statusPendaftaran, f.status) &&
      matchesOption(p.jalur, f.jalur) &&
      matchesOption(p.jenjangTujuan, f.jenjang),
  );
}

/** Bangun opsi dropdown {value,label} dari daftar opsi FILTER_OPTIONS. */
function toSelectOptions(values: readonly string[]) {
  return values.map((v) => ({ value: v, label: v }));
}

/**
 * Halaman direktori Calon Siswa. Diekspor terpisah dari Route agar dapat diuji
 * langsung tanpa <RouterProvider> (lihat ppdb.calon-siswa.test.tsx).
 */
export function CalonSiswaPage(): ReactNode {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const [filter, setFilter] = useState<FilterState>(INITIAL_FILTER);

  // Sumber data mock di-scope ke sekolah aktif; memo agar stabil per render.
  const all = useMemo(() => listPpdbForSekolah(sekolah), [sekolah]);
  const visible = useMemo(() => applyFilter(all, filter), [all, filter]);

  /** Patch sebagian state filter sambil menjaga field lain tetap. */
  const patch = (next: Partial<FilterState>) =>
    setFilter((cur) => ({ ...cur, ...next }));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="PPDB"
        title="Calon Siswa"
        description="Direktori biodata pendaftar — telusuri, saring, dan buka detail calon."
      />

      <PageGuide
        storageId={GUIDE_STORAGE_ID}
        intro="Halaman ini menampilkan seluruh calon siswa sebagai kartu yang dapat disaring."
        steps={GUIDE_STEPS}
        tips={GUIDE_TIPS}
      />

      <SectionCard padded={false}>
        <div className="p-3">
          <FilterBar
            search={{
              value: filter.search,
              onChange: (v) => patch({ search: v }),
              placeholder: SEARCH_PLACEHOLDER,
            }}
            filters={[
              {
                key: "status",
                label: "Status",
                value: filter.status,
                options: toSelectOptions(FILTER_OPTIONS.statusPendaftaran),
                onChange: (v) => patch({ status: v }),
              },
              {
                key: "jalur",
                label: "Jalur",
                value: filter.jalur,
                options: toSelectOptions(FILTER_OPTIONS.jalur),
                onChange: (v) => patch({ jalur: v }),
              },
              {
                key: "jenjang",
                label: "Jenjang",
                value: filter.jenjang,
                options: toSelectOptions(FILTER_OPTIONS.jenjangTujuan),
                onChange: (v) => patch({ jenjang: v }),
              },
            ]}
          />
        </div>
      </SectionCard>

      {visible.length === 0 ? (
        <EmptyState title={EMPTY_TITLE} description={EMPTY_DESC} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((p) => (
            <CalonSiswaCard
              key={p.noPendaftaran}
              pendaftar={p}
              renderDetailLink={(noPendaftaran, children) => (
                <Link
                  to="/sch/$sekolah/ppdb/$noPendaftaran"
                  params={{ sekolah, noPendaftaran }}
                >
                  {children}
                </Link>
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/ppdb/calon-siswa")({
  component: CalonSiswaPage,
});
