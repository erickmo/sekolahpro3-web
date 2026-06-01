/**
 * Editor Entri Nilai — route.
 *
 * Two-phase page: a selector (EntriNilaiSelector) to pick rombel / mapel /
 * semester / tahun ajaran, then the fast grid editor (EntriNilaiGrid). This is
 * a PRESENTATION + GUIDANCE redesign: the search-param wiring, the navigation
 * into the grid, the validateSearch contract and both child components keep
 * their exact behavior. The redesign adds, layered above the untouched flow:
 *  - a collapsible PageGuide (how to fill the grid, step by step);
 *  - role framing for Administrator / Guru / Kepala Sekolah (labels only,
 *    nothing is hidden or disabled by role).
 *
 * All UI copy is Bahasa Indonesia; code comments are English.
 */
import { useCallback } from "react";
import { createFileRoute, useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { Badge, cn } from "@sekolahpro/ui";
import { EntriNilaiSelector, type EntriNilaiSelection } from "../components/akademik/EntriNilaiSelector";
import { EntriNilaiGrid } from "../components/akademik/EntriNilaiGrid";
import { useAkademikContextOptional } from "../lib/akademikContext";
import { PageGuide, type PageGuideStep } from "../components/guide";
import { useAkademikRole, ROLE_LABEL } from "../lib/akademikRole";

export interface EditSearch {
  rombel?: string;
  mapel?: string;
  semester?: string;
  ta?: string;
}

/** Stable id so the guide's collapsed state persists per page. */
const GUIDE_STORAGE_ID = "entri-nilai-edit";

/** Guide steps; Guru is highlighted as the primary grade-entry role. */
const GUIDE_STEPS: PageGuideStep[] = [
  {
    title: "Pilih rombel, mapel & periode",
    detail:
      "Tentukan rombongan belajar, mata pelajaran, semester, dan tahun ajaran terlebih dahulu. Klik 'Ubah Konteks' kapan saja untuk menggantinya.",
    roles: ["guru", "admin"],
  },
  {
    title: "Isi nilai per kolom komponen",
    detail:
      "Setiap kolom adalah satu komponen penilaian dengan bobotnya sendiri (mis. Tugas 30%, UTS 30%, UAS 40%). Ketik angka 0–100 pada sel siswa.",
    roles: ["guru"],
  },
  {
    title: "Pahami warna & status sel",
    detail:
      "Kuning = perubahan belum disimpan, biru = sedang menyimpan, merah = nilai tidak valid. Nilai akhir per siswa muncul otomatis di kolom kanan.",
    roles: ["guru"],
  },
  {
    title: "Simpan sebelum berpindah",
    detail:
      "Klik 'Simpan' untuk menyimpan baris yang berubah. Bila keluar tanpa menyimpan, sistem akan mengingatkan agar isian tidak hilang.",
    roles: ["guru", "admin"],
  },
  {
    title: "Pantau ketuntasan kelas",
    detail:
      "Lihat ringkasan progres pengisian dan sebaran KKM (tuntas / belum tuntas / belum dinilai) di atas tabel.",
    roles: ["kepala", "admin"],
  },
];

const GUIDE_TIPS: string[] = [
  "Tab / Shift+Tab pindah antar sel; Enter / Shift+Enter pindah antar baris; Esc membatalkan perubahan satu sel.",
  "Nilai akhir adalah rata-rata berbobot seluruh komponen — pastikan total bobot mapel mendekati 100%.",
];

function EntriNilaiEditPage() {
  const ctx = useAkademikContextOptional();
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const search = useSearch({ from: "/sch/$sekolah/akademik/entri-nilai/edit" });
  const navigate = useNavigate({ from: "/sch/$sekolah/akademik/entri-nilai/edit" });

  const onStart = useCallback(
    (sel: EntriNilaiSelection) => {
      navigate({
        to: ".",
        search: {
          rombel: sel.rombel,
          mapel: sel.mapel,
          semester: sel.semester,
          ta: sel.tahunAjaran,
        },
        replace: true,
      });
    },
    [navigate],
  );

  const onChangeSelection = useCallback(() => {
    navigate({
      to: ".",
      search: () => ({}),
      replace: true,
    });
  }, [navigate]);

  const ready = !!(search.rombel && search.mapel && search.semester && search.ta);

  if (ready) {
    return (
      <div className="space-y-6">
        <EditorGuide />
        <EntriNilaiGrid
          selection={{
            rombel: search.rombel!,
            mapel: search.mapel!,
            semester: search.semester!,
            tahunAjaran: search.ta!,
          }}
          onChangeSelection={onChangeSelection}
          sekolah={sekolah}
        />
      </div>
    );
  }

  const initial: Partial<EntriNilaiSelection> = {};
  if (search.rombel) initial.rombel = search.rombel;
  if (search.mapel) initial.mapel = search.mapel;
  if (search.semester) initial.semester = search.semester;
  else if (ctx?.semester) initial.semester = ctx.semester;
  if (search.ta) initial.tahunAjaran = search.ta;
  else if (ctx?.tahunAjaran) initial.tahunAjaran = ctx.tahunAjaran;

  return (
    <div className="space-y-6">
      <EditorGuide />
      <EntriNilaiSelector initial={initial} onStart={onStart} />
    </div>
  );
}

/**
 * Collapsible how-to-use guide plus a primary-role badge. Role badge is a
 * framing hint only — it never hides or disables any functionality.
 */
function EditorGuide() {
  const role = useAkademikRole();
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Badge tone="brand" className={cn("whitespace-nowrap")}>
          Peran Anda: {ROLE_LABEL[role.primary]}
        </Badge>
      </div>
      <PageGuide
        storageId={GUIDE_STORAGE_ID}
        intro="Halaman ini dipakai Guru untuk mengisi nilai per komponen. Administrator menyiapkan konteks, dan Kepala Sekolah memantau ketuntasan lewat ringkasan di atas tabel."
        steps={GUIDE_STEPS}
        tips={GUIDE_TIPS}
      />
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akademik/entri-nilai/edit")({
  component: EntriNilaiEditPage,
  validateSearch: (s: Record<string, unknown>): EditSearch => {
    const out: EditSearch = {};
    if (typeof s.rombel === "string" && s.rombel) out.rombel = s.rombel;
    if (typeof s.mapel === "string" && s.mapel) out.mapel = s.mapel;
    if (typeof s.semester === "string" && s.semester) out.semester = s.semester;
    if (typeof s.ta === "string" && s.ta) out.ta = s.ta;
    return out;
  },
});
